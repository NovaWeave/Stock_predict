"""
Stock Sentiment Analyzer - Refactored Application

A modular, clean architecture implementation of the stock sentiment analyzer
following SOLID principles and clean code practices.
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, Union, Tuple

from flask import Flask, jsonify, request, Response
from flask_compress import Compress
from flask_cors import CORS

from config_enhanced import get_config
from services.sentiment import SentimentAnalysisService
from services.social_media import SocialMediaService
from services.stock_data import StockDataService


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class StockSentimentApp:
    """
    Main application class for Stock Sentiment Analyzer.
    
    Orchestrates different services to provide comprehensive stock analysis
    including sentiment analysis, stock data, and social media insights.
    """
    
    def __init__(self):
        """Initialize Flask app and services"""
        self.app = Flask(__name__)
        self._configure_app()
        self._init_services()
        self._register_routes()
        logger.info("Stock Sentiment Analyzer initialized")
    
    def _configure_app(self) -> None:
        """Configure Flask application"""
        self.app.config.from_object(get_config())
        
        # Security and middleware
        self.app.secret_key = self.app.config.get('SECRET_KEY')
        Compress(self.app)
        CORS(
            self.app,
            resources={r"/api/*": {"origins": self.app.config.get('CORS_ORIGINS', ['*'])}},
            supports_credentials=True
        )
        
        logger.info("Flask app configured")
    
    def _init_services(self) -> None:
        """Initialize all services"""
        try:
            self.sentiment_service = SentimentAnalysisService()
            self.stock_service = StockDataService()
            self.social_service = SocialMediaService()
            
            logger.info("All services initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize services: {e}")
            raise
    
    def _register_routes(self) -> None:
        """Register all API routes"""
        # Health check
        self.app.add_url_rule('/api/health', 'health_check', self.health_check, methods=['GET'])
        
        # Main analysis endpoints
        self.app.add_url_rule('/api/analyze/<stock_symbol>', 'analyze_stock', 
                             self.analyze_stock, methods=['GET'])
        self.app.add_url_rule('/api/trend/<stock_symbol>', 'get_trend', 
                             self.get_trend, methods=['GET'])
        
        # Individual service endpoints
        self.app.add_url_rule('/api/stock/<stock_symbol>', 'get_stock_data', 
                             self.get_stock_data, methods=['GET'])
        self.app.add_url_rule('/api/reddit/<stock_symbol>', 'get_reddit_data', 
                             self.get_reddit_data, methods=['GET'])
        self.app.add_url_rule('/api/x/<stock_symbol>', 'get_x_data', 
                             self.get_x_data, methods=['GET'])
        
        # Utility endpoints
        self.app.add_url_rule('/', 'index_root', self.index_root, methods=['GET'])
        self.app.add_url_rule('/api/version', 'api_version', self.api_version, methods=['GET'])
        
        logger.info("Routes registered")
    
    def health_check(self) -> Union[Response, Tuple[Dict[str, Any], int]]:
        """Health check endpoint"""
        try:
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'services': {
                    'sentiment_analysis': self.sentiment_service.is_available(),
                    'stock_data': self.stock_service.is_available(),
                    'social_media': self.social_service.is_available()
                }
            })
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({'status': 'unhealthy', 'error': str(e)}), 500
    
    def analyze_stock(self, stock_symbol: str) -> Union[Response, Tuple[Dict[str, Any], int]]:
        """Comprehensive stock analysis endpoint"""
        try:
            logger.info(f"Starting comprehensive analysis for {stock_symbol}")
            
            # Get all data
            trend_prediction = self._get_trend_prediction(stock_symbol)
            stock_data = self.stock_service.get_stock_data(stock_symbol)
            reddit_posts = self.social_service.get_reddit_posts(stock_symbol, limit=10)
            x_posts = self.social_service.get_x_posts(stock_symbol, limit=10)
            
            # Process social media sentiment
            reddit_posts_with_sentiment = self._add_sentiment_to_posts(reddit_posts)
            x_posts_with_sentiment = self._add_sentiment_to_x_posts(x_posts)
            
            result = {
                "success": True,
                "stock_symbol": stock_symbol.upper(),
                "timestamp": datetime.now().isoformat(),
                "trend_prediction": trend_prediction,
                "stock_data": stock_data,
                "company_profile": {"success": True, "data": {"name": f"{stock_symbol} Corp."}},  # Simplified
                "news": {"success": True, "data": []},  # Can be extended
                "reddit_posts": reddit_posts_with_sentiment,
                "x_posts": x_posts_with_sentiment
            }
            
            logger.info(f"Comprehensive analysis completed for {stock_symbol}")
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Error in comprehensive analysis for {stock_symbol}: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_trend(self, stock_symbol: str) -> Union[Response, Tuple[Dict[str, Any], int]]:
        """Get trend prediction for a stock"""
        try:
            result = self._get_trend_prediction(stock_symbol)
            return jsonify(result)
        except Exception as e:
            logger.error(f"Error getting trend for {stock_symbol}: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    def _get_trend_prediction(self, stock_symbol: str) -> Dict[str, Any]:
        """Calculate trend prediction based on sentiment analysis"""
        try:
            # Get social media data
            reddit_posts = self.social_service.get_reddit_posts(stock_symbol, limit=50)
            x_posts = self.social_service.get_x_posts(stock_symbol, limit=50)
            
            # Calculate sentiment scores
            reddit_texts = []
            if reddit_posts:  # Check if list is not empty
                reddit_texts = [f"{post.get('title', '')} {post.get('text', '')}" for post in reddit_posts]
            
            x_texts = [post['text'] for post in x_posts if post.get('text')]
            
            reddit_sentiment = 0
            x_sentiment = 0
            
            if reddit_texts:
                reddit_summary = self.sentiment_service.get_sentiment_summary(reddit_texts)
                reddit_sentiment = reddit_summary['average_sentiment']
            
            if x_texts:
                x_summary = self.sentiment_service.get_sentiment_summary(x_texts)
                x_sentiment = x_summary['average_sentiment']
            
            # Calculate combined sentiment (weighted average)
            combined_sentiment = (reddit_sentiment * 0.4 + x_sentiment * 0.6)
            
            # Determine trend and confidence
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
            logger.error(f"Error calculating trend prediction: {e}")
            return {"success": False, "error": str(e)}
    
    def get_stock_data(self, stock_symbol: str) -> Union[Response, Tuple[Dict[str, Any], int]]:
        """Get stock data endpoint"""
        try:
            days = request.args.get('days', 30, type=int)
            result = self.stock_service.get_stock_data(stock_symbol, days)
            return jsonify(result)
        except Exception as e:
            logger.error(f"Error getting stock data for {stock_symbol}: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_reddit_data(self, stock_symbol: str) -> Union[Response, Tuple[Dict[str, Any], int]]:
        """Get Reddit data endpoint"""
        try:
            limit = request.args.get('limit', 50, type=int)
            posts = self.social_service.get_reddit_posts(stock_symbol, limit)
            posts_with_sentiment = self._add_sentiment_to_posts(posts)
            
            return jsonify({
                "success": True,
                "data": posts_with_sentiment
            })
        except Exception as e:
            logger.error(f"Error getting Reddit data for {stock_symbol}: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    def get_x_data(self, stock_symbol: str) -> Union[Response, Tuple[Dict[str, Any], int]]:
        """Get X data endpoint"""
        try:
            limit = request.args.get('limit', 50, type=int)
            posts = self.social_service.get_x_posts(stock_symbol, limit)
            posts_with_sentiment = self._add_sentiment_to_x_posts(posts)
            
            return jsonify({
                "success": True,
                "data": posts_with_sentiment
            })
        except Exception as e:
            logger.error(f"Error getting X data for {stock_symbol}: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    def _add_sentiment_to_posts(self, posts_list) -> list:
        """Add sentiment analysis to Reddit posts"""
        if not posts_list:  # Check if list is empty
            return []
        
        try:
            for post in posts_list:
                text = f"{post.get('title', '')} {post.get('text', '')}".strip()
                post['sentiment'] = self.sentiment_service.analyze_text(text)
            return posts_list
        except Exception as e:
            logger.error(f"Error adding sentiment to posts: {e}")
            return posts_list
    
    def _add_sentiment_to_x_posts(self, posts: list) -> list:
        """Add sentiment analysis to X posts"""
        try:
            for post in posts:
                text = post.get('text', '')
                post['sentiment'] = self.sentiment_service.analyze_text(text)
            return posts
        except Exception as e:
            logger.error(f"Error adding sentiment to X posts: {e}")
            return posts
    
    def index_root(self) -> Response:
        """Root endpoint"""
        return jsonify({
            'service': self.app.config.get('API_TITLE', 'Stock Sentiment Analyzer API'),
            'status': 'ok',
            'version': self.app.config.get('API_VERSION', 'v1.0.0'),
            'endpoints': {
                'health': '/api/health',
                'analyze_example': '/api/analyze/AAPL',
                'trend_example': '/api/trend/AAPL',
                'stock_example': '/api/stock/AAPL'
            }
        })
    
    def api_version(self) -> Response:
        """API version endpoint"""
        return jsonify({
            'version': self.app.config.get('API_VERSION', 'v1.0.0'),
            'cors_origins': self.app.config.get('CORS_ORIGINS', ['*'])
        })
    
    def run(self, host: str = '0.0.0.0', port: int = 5000, debug: bool = False) -> None:
        """Run the Flask application"""
        logger.info(f"Starting Stock Sentiment Analyzer on {host}:{port}")
        self.app.run(host=host, port=port, debug=debug)


# Create application instance
def create_app() -> Flask:
    """Factory function to create Flask app"""
    app_instance = StockSentimentApp()
    return app_instance.app


# CLI interface for backward compatibility
def main():
    """CLI interface for the analyzer"""
    print("🚀 StockSentiment Pro - Enhanced Stock Analysis")
    print("=" * 50)
    
    try:
        app_instance = StockSentimentApp()
        
        stock = input("Enter stock symbol (e.g., AAPL): ").upper()
        print(f"\n📊 Analyzing {stock}...")
        
        # Get trend prediction
        with app_instance.app.app_context():
            trend_result = app_instance._get_trend_prediction(stock)
            
            if trend_result['success']:
                print(f"\n🎯 Trend Prediction: {trend_result['trend']}")
                print(f"📈 Confidence: {trend_result['confidence']:.1%}")
                print(f"💭 Sentiment Score: {trend_result['sentiment_score']:.3f}")
                print(f"📱 Reddit Posts: {trend_result['data_points']['reddit_posts']}")
                print(f"🐦 X Posts: {trend_result['data_points']['x_posts']}")
            else:
                print(f"❌ Error: {trend_result['error']}")
                
    except Exception as error:
        logger.error(f"CLI error: {error}")
        print(f"❌ Error: {error}")


if __name__ == "__main__":
    import sys
    
    # Check if running as web service or CLI
    if len(sys.argv) > 1 and sys.argv[1] == '--web':
        app_instance = StockSentimentApp()
        port = int(os.environ.get('PORT', 5000))
        app_instance.run(port=port, debug=False)
    else:
        main()