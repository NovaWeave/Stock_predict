import os
from datetime import datetime, timedelta
import json
from typing import Dict, List, Optional, Any

import nltk
import pandas as pd
import praw
import yfinance as yf
import tweepy
import requests
import finnhub
from dotenv import load_dotenv
from nltk.sentiment import SentimentIntensityAnalyzer
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_compress import Compress
from config import get_config

# Ensure required NLTK data is available
nltk.download('vader_lexicon', quiet=True)

# Load API credentials from .env file
load_dotenv()

app = Flask(__name__)
app.config.from_object(get_config())
app.secret_key = app.config.get('SECRET_KEY')
Compress(app)
CORS(app, resources={r"/api/*": {"origins": app.config.get('CORS_ORIGINS', ['*'])}}, supports_credentials=True)

class StockSentimentAnalyzer:
    def __init__(self):
        # Initialize Reddit API with error handling
        try:
            self.reddit = praw.Reddit(
                client_id=os.getenv("REDDIT_CLIENT_ID", "placeholder"),
                client_secret=os.getenv("REDDIT_CLIENT_SECRET", "placeholder"),
                user_agent=os.getenv("REDDIT_USER_AGENT", "StockSentimentBot/1.0")
            )
            self.reddit_enabled = True
        except Exception as e:
            print(f"Reddit API initialization failed: {e}")
            self.reddit_enabled = False
        
        # Initialize X (Twitter) API with error handling
        try:
            self.x_client = tweepy.Client(
                bearer_token=os.getenv('X_BEARER_TOKEN', 'placeholder'),
                consumer_key=os.getenv('X_API_KEY', 'placeholder'),
                consumer_secret=os.getenv('X_API_SECRET', 'placeholder'),
                access_token=os.getenv('X_ACCESS_TOKEN', 'placeholder'),
                access_token_secret=os.getenv('X_ACCESS_TOKEN_SECRET', 'placeholder'),
                wait_on_rate_limit=True
            )
            self.x_enabled = True
        except Exception as e:
            print(f"X API initialization failed: {e}")
            self.x_enabled = False
        
        # Initialize Finnhub API
        self.finnhub_api_key = os.getenv('FINNHUB_API_KEY', 'placeholder_finnhub_key')
        self.finnhub_base_url = 'https://finnhub.io/api/v1'
        
        # Initialize Finnhub client
        try:
            self.finnhub_client = finnhub.Client(api_key=self.finnhub_api_key)
            self.finnhub_enabled = True
        except Exception as e:
            print(f"Finnhub client initialization failed: {e}")
            self.finnhub_enabled = False
        
        self.sia = SentimentIntensityAnalyzer()
        self.cache = {}
        self.cache_duration = 300  # 5 minutes cache
        
        # Mock data for testing when APIs are not available (driven by config)
        try:
            # app is available in module scope
            from stock_sentiment import app as _app  # type: ignore
            self.mock_data_enabled = bool(_app.config.get('MOCK_DATA_ENABLED', True))
        except Exception:
            self.mock_data_enabled = os.getenv('MOCK_DATA_ENABLED', 'True').lower() == 'true'

    def _make_finnhub_request(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """Make a request to Finnhub API"""
        if not self.finnhub_api_key:
            return None
            
        if params is None:
            params = {}
            
        params['token'] = self.finnhub_api_key
        
        try:
            response = requests.get(f"{self.finnhub_base_url}/{endpoint}", params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Finnhub API error: {str(e)}")
            return None

    def get_reddit_posts(self, stock_symbol: str, limit: int = 100) -> pd.DataFrame:
        """Fetch Reddit posts about a stock"""
        if not hasattr(self, 'reddit_enabled') or not self.reddit_enabled:
            print("Reddit API not configured")
            return pd.DataFrame()
            
        # Check if we have valid API credentials
        if os.getenv('REDDIT_CLIENT_ID') == 'placeholder' or not os.getenv('REDDIT_CLIENT_ID'):
            print("Reddit API credentials not configured")
            return pd.DataFrame()
            
        subreddit_query = 'stocks+investing+wallstreetbets'
        search_query = f"{stock_symbol} stock"
        posts = []

        try:
            for post in self.reddit.subreddit(subreddit_query).search(search_query, limit=min(limit, 20)):  # Reduce limit
                posts.append({
                    "title": post.title,
                    "text": post.selftext,
                    "score": post.score,
                    "created_utc": datetime.fromtimestamp(post.created_utc),
                    "url": f"https://reddit.com{post.permalink}",
                    "author": str(post.author),
                    "subreddit": str(post.subreddit)
                })
        except Exception as e:
            print(f"Error fetching Reddit posts: {str(e)} - using mock data")
            if self.mock_data_enabled:
                return self._generate_mock_reddit_posts(stock_symbol, limit)

        posts_df = pd.DataFrame(posts)
        if not posts_df.empty:
            try:
                def _score_row(row):
                    text = f"{row.get('title','')} {row.get('text','')}".strip()
                    return self.analyze_sentiment(text) if text else 0.0
                posts_df['sentiment'] = posts_df.apply(_score_row, axis=1)
            except Exception as e:
                print(f"Error scoring Reddit sentiments: {e}")
                posts_df['sentiment'] = 0.0
        return posts_df
    

    


    def get_x_posts(self, stock_symbol: str, limit: int = 100) -> List[Dict]:
        """Fetch X (Twitter) posts about a stock"""
        print("X API not configured")
        return []

    def analyze_sentiment(self, text: str) -> float:
        """Analyze sentiment of text using VADER"""
        return self.sia.polarity_scores(text)['compound']

    def get_stock_data(self, stock_symbol: str, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive stock data including technical indicators"""
        try:
            print(f"Fetching stock data for {stock_symbol}")
            
            # Try Yahoo Finance first (per yfinance docs: Ticker.history)
            try:
                stock = yf.Ticker(stock_symbol)
                hist = stock.history(period=f"{days}d", auto_adjust=True, actions=False)
                
                print(f"Yahoo Finance history data shape: {hist.shape}")
                if not hist.empty:
                    return self._process_yahoo_data(hist)
                else:
                    print(f"No Yahoo Finance data available for {stock_symbol}")
            except Exception as e:
                print(f"Yahoo Finance error: {e}")
            
            # Fallback to Finnhub
            print(f"Trying Finnhub for {stock_symbol}")
            return self._get_finnhub_stock_data(stock_symbol, days)
            
        except Exception as e:
            print(f"All stock data sources failed: {e}")
            return {"success": False, "error": "No data available from any source"}
    
    def _process_yahoo_data(self, hist: pd.DataFrame) -> Dict[str, Any]:
        """Process Yahoo Finance data and calculate indicators"""
        try:
            # Sanity: ensure Close exists and index is datetime
            if 'Close' not in hist.columns and 'close' in hist.columns:
                hist = hist.rename(columns={'close': 'Close'})
            if not hasattr(hist.index, 'strftime'):
                hist.index = pd.to_datetime(hist.index)

            # Calculate technical indicators
            hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
            hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
            hist['RSI'] = self._calculate_rsi(hist['Close'])
            hist['MACD'], hist['MACD_Signal'] = self._calculate_macd(hist['Close'])
            
            current_price = hist['Close'].iloc[-1]
            price_change = current_price - hist['Close'].iloc[-2] if len(hist) > 1 else 0
            price_change_percent = (price_change / hist['Close'].iloc[-2]) * 100 if len(hist) > 1 else 0
            
            return {
                "success": True,
                "data": {
                    "current_price": float(current_price),
                    "price_change": float(price_change),
                    "price_change_percent": float(price_change_percent),
                    "volume": int(hist['Volume'].iloc[-1]),
                    "historical_data": {
                        "dates": hist.index.strftime('%Y-%m-%d').tolist(),
                        "prices": hist['Close'].tolist(),
                        "volumes": hist['Volume'].tolist()
                    },
                    "technical_indicators": {
                        "sma_20": float(hist['SMA_20'].iloc[-1]) if not pd.isna(hist['SMA_20'].iloc[-1]) else None,
                        "sma_50": float(hist['SMA_50'].iloc[-1]) if not pd.isna(hist['SMA_50'].iloc[-1]) else None,
                        "rsi": float(hist['RSI'].iloc[-1]) if not pd.isna(hist['RSI'].iloc[-1]) else None,
                        "macd": float(hist['MACD'].iloc[-1]) if not pd.isna(hist['MACD'].iloc[-1]) else None,
                        "macd_signal": float(hist['MACD_Signal'].iloc[-1]) if not pd.isna(hist['MACD_Signal'].iloc[-1]) else None
                    }
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _get_finnhub_stock_data(self, stock_symbol: str, days: int = 30) -> Dict[str, Any]:
        """Get stock data from Finnhub API using official client"""
        if not hasattr(self, 'finnhub_enabled') or not self.finnhub_enabled:
            print("Finnhub client not enabled")
            return {"success": False, "error": "Finnhub not available"}
        
        if not self.finnhub_api_key or self.finnhub_api_key in ['placeholder_finnhub_key', 'placeholder', 'your_finnhub_api_key_here']:
            print("Finnhub API not configured")
            return {"success": False, "error": "Finnhub API key not configured"}
        
        try:
            # Get current quote using Finnhub client
            quote_data = self.finnhub_client.quote(symbol=stock_symbol)
            if not quote_data or 'c' not in quote_data:
                print("Failed to fetch quote data")
                return {"success": False, "error": "Failed to fetch quote data"}
            
            current_price = quote_data['c']
            
            # Get historical data
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            hist_data = self.finnhub_client.stock_candles(
                symbol=stock_symbol,
                resolution='D',
                _from=int(start_date.timestamp()),
                to=int(end_date.timestamp())
            )
            
            if not hist_data or hist_data.get('s') != 'ok':
                print("Failed to fetch historical data")
                return {"success": False, "error": "Failed to fetch historical data"}
            
            # Process historical data
            timestamps = hist_data.get('t', [])
            closes = hist_data.get('c', [])
            volumes = hist_data.get('v', [])
            
            if not closes:
                return {"success": False, "error": "No historical data available"}
            
            price_change = current_price - closes[-2] if len(closes) > 1 else 0
            price_change_percent = (price_change / closes[-2]) * 100 if len(closes) > 1 else 0
            
            # Convert to pandas for technical indicators
            hist_df = pd.DataFrame({
                'Close': closes,
                'Volume': volumes
            })
            
            # Calculate basic indicators
            hist_df['SMA_20'] = hist_df['Close'].rolling(window=min(20, len(hist_df))).mean()
            hist_df['SMA_50'] = hist_df['Close'].rolling(window=min(50, len(hist_df))).mean()
            hist_df['RSI'] = self._calculate_rsi(hist_df['Close'])
            hist_df['MACD'], hist_df['MACD_Signal'] = self._calculate_macd(hist_df['Close'])
            
            # Convert timestamps to dates
            dates = [datetime.fromtimestamp(ts).strftime('%Y-%m-%d') for ts in timestamps]
            
            return {
                "success": True,
                "data": {
                    "current_price": float(current_price),
                    "price_change": float(price_change),
                    "price_change_percent": float(price_change_percent),
                    "volume": int(volumes[-1]) if volumes else 0,
                    "historical_data": {
                        "dates": dates,
                        "prices": closes,
                        "volumes": volumes
                    },
                    "technical_indicators": {
                        "sma_20": float(hist_df['SMA_20'].iloc[-1]) if not pd.isna(hist_df['SMA_20'].iloc[-1]) else None,
                        "sma_50": float(hist_df['SMA_50'].iloc[-1]) if not pd.isna(hist_df['SMA_50'].iloc[-1]) else None,
                        "rsi": float(hist_df['RSI'].iloc[-1]) if not pd.isna(hist_df['RSI'].iloc[-1]) else None,
                        "macd": float(hist_df['MACD'].iloc[-1]) if not pd.isna(hist_df['MACD'].iloc[-1]) else None,
                        "macd_signal": float(hist_df['MACD_Signal'].iloc[-1]) if not pd.isna(hist_df['MACD_Signal'].iloc[-1]) else None
                    }
                }
            }
            
        except Exception as e:
            print(f"Finnhub stock data error: {e}")
            return {"success": False, "error": str(e)}
    


    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate RSI technical indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi

    def _calculate_macd(self, prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> tuple:
        """Calculate MACD technical indicator"""
        ema_fast = prices.ewm(span=fast).mean()
        ema_slow = prices.ewm(span=slow).mean()
        macd = ema_fast - ema_slow
        macd_signal = macd.ewm(span=signal).mean()
        return macd, macd_signal

    def get_finnhub_company_profile(self, stock_symbol: str) -> Dict[str, Any]:
        """Get company profile from Finnhub API"""
        cache_key = f"{stock_symbol}_finnhub_profile"
        
        if cache_key in self.cache:
            cache_time, cached_data = self.cache[cache_key]
            if datetime.now().timestamp() - cache_time < self.cache_duration:
                return cached_data
        
        if not self.finnhub_api_key or self.finnhub_api_key in ['placeholder_finnhub_key', 'placeholder', 'your_finnhub_api_key_here']:
            # Fallback to Yahoo Finance basic profile
            try:
                stock = yf.Ticker(stock_symbol)
                info = stock.info if hasattr(stock, 'info') else {}
                name = info.get('longName') or info.get('shortName')
                exchange = info.get('exchange') or info.get('fullExchangeName')
                industry = info.get('industry') or info.get('sector')
                website = info.get('website')
                country = info.get('country')
                market_cap = info.get('marketCap') or 0
                if any([name, exchange, industry, website, country, market_cap]):
                    return {
                        "success": True,
                        "data": {
                            "name": name or 'Unknown',
                            "country": country or 'Unknown',
                            "exchange": exchange or 'Unknown',
                            "industry": industry or 'Unknown',
                            "website": website or '',
                            "market_cap": market_cap or 0
                        }
                    }
            except Exception:
                pass
            # Fallback to basic profile
            return {"success": False, "error": "Finnhub API key not configured"}
        
        try:
            data = self._make_finnhub_request('stock/profile2', {'symbol': stock_symbol})
            
            if not data:
                return {"success": False, "error": "Failed to fetch company profile"}
            
            result = {
                "success": True,
                "data": {
                    "name": data.get('name', 'Unknown'),
                    "country": data.get('country', 'Unknown'),
                    "exchange": data.get('exchange', 'Unknown'),
                    "industry": data.get('finnhubIndustry', 'Unknown'),
                    "website": data.get('weburl', ''),
                    "market_cap": data.get('marketCapitalization', 0)
                }
            }
            
            self.cache[cache_key] = (datetime.now().timestamp(), result)
            return result
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_finnhub_news(self, stock_symbol: str, days: int = 30) -> Dict[str, Any]:
        """Get company news from Finnhub API"""
        if not self.finnhub_api_key or self.finnhub_api_key in ['placeholder_finnhub_key', 'placeholder', 'your_finnhub_api_key_here']:
            # Fallback to Yahoo Finance news endpoint
            try:
                stock = yf.Ticker(stock_symbol)
                if hasattr(stock, 'news'):
                    news_items = stock.news or []
                    news_data = []
                    for article in news_items[:20]:
                        headline = article.get('title', '')
                        summary = article.get('summary', '')
                        url = article.get('link') or article.get('url', '')
                        source = (article.get('publisher') or article.get('source') or '')
                        published = article.get('providerPublishTime') or article.get('pubDate') or 0
                        text_for_sentiment = f"{headline} {summary}".strip()
                        try:
                            sentiment_score = self.analyze_sentiment(text_for_sentiment) if text_for_sentiment else 0.0
                        except Exception:
                            sentiment_score = 0.0
                        news_data.append({
                            'headline': headline,
                            'summary': summary,
                            'url': url,
                            'source': source,
                            'datetime': int(published) if isinstance(published, (int, float)) else 0,
                            'sentiment': sentiment_score
                        })
                    if news_data:
                        return {"success": True, "data": news_data}
            except Exception:
                pass
            # Fallback to basic news
            return {"success": False, "error": "Finnhub API key not configured"}
        
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            params = {
                'symbol': stock_symbol,
                'from': start_date.strftime('%Y-%m-%d'),
                'to': end_date.strftime('%Y-%m-%d')
            }
            
            data = self._make_finnhub_request('company-news', params)
            
            if not data:
                return {"success": False, "error": "Failed to fetch news"}
            
            news_data = []
            for article in data[:20]:  # Limit to 20 articles
                headline = article.get('headline', '')
                summary = article.get('summary', '')
                text_for_sentiment = f"{headline} {summary}".strip()
                try:
                    sentiment_score = self.analyze_sentiment(text_for_sentiment) if text_for_sentiment else 0.0
                except Exception:
                    sentiment_score = 0.0
                news_data.append({
                    'headline': headline,
                    'summary': summary,
                    'url': article.get('url', ''),
                    'source': article.get('source', ''),
                    'datetime': article.get('datetime', 0),
                    'sentiment': sentiment_score
                })
            
            return {"success": True, "data": news_data}
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def predict_trend(self, stock_symbol: str) -> Dict[str, Any]:
        """Predict stock trend based on multiple data sources"""
        try:
            # Get data from all sources
            reddit_posts = self.get_reddit_posts(stock_symbol, limit=50)
            x_posts = self.get_x_posts(stock_symbol, limit=50)
            stock_data = self.get_stock_data(stock_symbol)
            
            # Analyze Reddit sentiment
            reddit_sentiment = 0
            if not reddit_posts.empty:
                reddit_posts['sentiment'] = reddit_posts['text'].apply(self.analyze_sentiment)
                reddit_sentiment = reddit_posts['sentiment'].mean()
            
            # Analyze X sentiment
            x_sentiment = 0
            if x_posts:
                x_sentiments = [self.analyze_sentiment(post['text']) for post in x_posts]
                x_sentiment = sum(x_sentiments) / len(x_sentiments) if x_sentiments else 0
            
            # Combine sentiment scores (weighted average)
            combined_sentiment = (reddit_sentiment * 0.4 + x_sentiment * 0.6)
            
            # Determine trend
            if combined_sentiment > 0.1:
                trend = "Bullish"
                confidence = min(0.9, abs(combined_sentiment) + 0.3)
            elif combined_sentiment < -0.1:
                trend = "Bearish"
                confidence = min(0.9, abs(combined_sentiment) + 0.3)
            else:
                trend = "Neutral"
                confidence = 0.5
            
            return {
                "success": True,
                "trend": trend,
                "confidence": confidence,
                "sentiment_score": combined_sentiment,
                "reddit_sentiment": reddit_sentiment,
                "x_sentiment": x_sentiment,
                "data_points": {
                    "reddit_posts": len(reddit_posts),
                    "x_posts": len(x_posts)
                }
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_comprehensive_analysis(self, stock_symbol: str) -> Dict[str, Any]:
        """Get comprehensive analysis including all data sources"""
        try:
            # Get all data
            trend_prediction = self.predict_trend(stock_symbol)
            stock_data = self.get_stock_data(stock_symbol)
            company_profile = self.get_finnhub_company_profile(stock_symbol)
            news = self.get_finnhub_news(stock_symbol)
            reddit_posts = self.get_reddit_posts(stock_symbol, limit=10)
            x_posts = self.get_x_posts(stock_symbol, limit=10)
            
            return {
                "success": True,
                "stock_symbol": stock_symbol,
                "timestamp": datetime.now().isoformat(),
                "trend_prediction": trend_prediction,
                "stock_data": stock_data,
                "company_profile": company_profile,
                "news": news,
                "reddit_posts": reddit_posts.to_dict('records') if not reddit_posts.empty else [],
                "x_posts": x_posts
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

# Initialize the analyzer
analyzer = StockSentimentAnalyzer()

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'reddit_api': hasattr(analyzer, 'reddit_enabled') and analyzer.reddit_enabled and os.getenv("REDDIT_CLIENT_ID", "placeholder") not in [None, "placeholder", "placeholder_client_id", "your_client_id_here"],
            'x_api': False,  # Disabled due to rate limits
            'finnhub_api': hasattr(analyzer, 'finnhub_enabled') and analyzer.finnhub_enabled and analyzer.finnhub_api_key not in ['placeholder_finnhub_key', 'placeholder', 'your_finnhub_api_key_here'],
            'yahoo_finance_fallback': True
        }
    })

@app.route('/api/analyze/<stock_symbol>', methods=['GET'])
def analyze_stock(stock_symbol: str):
    """Analyze a stock and return comprehensive data"""
    try:
        result = analyzer.get_comprehensive_analysis(stock_symbol.upper())
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/trend/<stock_symbol>', methods=['GET'])
def get_trend(stock_symbol: str):
    """Get trend prediction for a stock"""
    try:
        result = analyzer.predict_trend(stock_symbol.upper())
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/reddit/<stock_symbol>', methods=['GET'])
def get_reddit_data(stock_symbol: str):
    """Get Reddit posts for a stock"""
    try:
        limit = request.args.get('limit', 50, type=int)
        posts = analyzer.get_reddit_posts(stock_symbol.upper(), limit)
        return jsonify({
            "success": True,
            "data": posts.to_dict('records') if not posts.empty else []
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/x/<stock_symbol>', methods=['GET'])
def get_x_data(stock_symbol: str):
    """Get X posts for a stock"""
    try:
        limit = request.args.get('limit', 50, type=int)
        posts = analyzer.get_x_posts(stock_symbol.upper(), limit)
        return jsonify({
            "success": True,
            "data": posts
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/stock/<stock_symbol>', methods=['GET'])
def get_stock_data(stock_symbol: str):
    """Get stock data for a stock"""
    try:
        days = request.args.get('days', 30, type=int)
        result = analyzer.get_stock_data(stock_symbol.upper(), days)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/finnhub/profile/<stock_symbol>', methods=['GET'])
def get_finnhub_profile(stock_symbol: str):
    """Get Finnhub company profile"""
    try:
        result = analyzer.get_finnhub_company_profile(stock_symbol.upper())
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/finnhub/news/<stock_symbol>', methods=['GET'])
def get_finnhub_news(stock_symbol: str):
    """Get Finnhub news for a stock"""
    try:
        days = request.args.get('days', 30, type=int)
        result = analyzer.get_finnhub_news(stock_symbol.upper(), days)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/', methods=['GET'])
def index_root():
    """Root route for basic status and helpful links."""
    return jsonify({
        'service': app.config.get('API_TITLE', 'Stock Sentiment Analyzer API'),
        'status': 'ok',
        'version': app.config.get('API_VERSION', 'v1.0.0'),
        'endpoints': {
            'health': '/api/health',
            'analyze_example': '/api/analyze/AAPL',
            'trend_example': '/api/trend/AAPL',
            'stock_example': '/api/stock/AAPL',
            'profile_example': '/api/finnhub/profile/AAPL',
            'news_example': '/api/finnhub/news/AAPL'
        }
    })

@app.route('/api/version', methods=['GET'])
def api_version():
    """Return API version and config flags (safe subset)."""
    return jsonify({
        'version': app.config.get('API_VERSION', 'v1.0.0'),
        'mock_data_enabled': bool(app.config.get('MOCK_DATA_ENABLED', True)),
        'cors_origins': app.config.get('CORS_ORIGINS', ['*'])
    })

def main():
    """CLI interface for the analyzer"""
    print("🚀 StockSentiment Pro - Enhanced Stock Analysis")
    print("=" * 50)
    
    stock = input("Enter stock symbol (e.g., AAPL): ").upper()

    try:
        print(f"\n📊 Analyzing {stock}...")
        
        # Get comprehensive analysis
        analysis = analyzer.get_comprehensive_analysis(stock)
        
        if analysis['success']:
            trend = analysis['trend_prediction']
            print(f"\n🎯 Trend Prediction: {trend['trend']}")
            print(f"📈 Confidence: {trend['confidence']:.1%}")
            print(f"💭 Sentiment Score: {trend['sentiment_score']:.3f}")
            
            if analysis['stock_data']['success']:
                stock_data = analysis['stock_data']['data']
                print(f"\n💰 Stock Data:")
                print(f"   Current Price: ${stock_data['current_price']:.2f}")
                print(f"   Change: {stock_data['price_change_percent']:+.2f}%")
                print(f"   Volume: {stock_data['volume']:,}")
            
            if analysis['company_profile']['success']:
                profile = analysis['company_profile']['data']
                print(f"\n🏢 Company Profile:")
                print(f"   Name: {profile['name']}")
                print(f"   Industry: {profile['industry']}")
                print(f"   Country: {profile['country']}")
            
            print(f"\n📰 News Articles: {len(analysis['news']['data']) if analysis['news']['success'] else 0}")
            print(f"📱 Reddit Posts: {len(analysis['reddit_posts'])}")
            print(f"🐦 X Posts: {len(analysis['x_posts'])}")
            
        else:
            print(f"❌ Error: {analysis['error']}")

    except Exception as error:
        print(f"❌ Error: {error}")

if __name__ == "__main__":
    # Check if running as web service or CLI
    if len(os.sys.argv) > 1 and os.sys.argv[1] == '--web':
        print("🌐 Starting StockSentiment Pro Web Service...")
        port = int(os.environ.get('PORT', 5000))
        app.run(host='0.0.0.0', port=port, debug=False)
    else:
        main()