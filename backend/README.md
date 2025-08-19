# Stock Sentiment Analyzer

A comprehensive stock sentiment analysis platform that collects stock-related discussions from Reddit and X (Twitter), and combines them with financial data from Finnhub to analyze market sentiment. Using natural language processing (NLP), it processes posts and comments to evaluate the sentiment around specific stocks, then correlates this sentiment with actual stock price movements. The system provides basic trend predictions and generates visual insights such as prediction graphs, helping users understand how online discussions may influence market behavior.

## 🚀 Features

### Core Functionality
- **Multi-Source Sentiment Analysis**: Combines Reddit, X (Twitter), and market data
- **Real-Time Data**: Live sentiment analysis from social media platforms
- **Advanced Analytics**: Technical indicators, trend analysis, and correlation studies
- **AI-Powered Predictions**: Uses VADER sentiment analysis for trend predictions
- **Comprehensive Data**: Company profiles, news, and financial metrics

### Data Sources
- **Reddit API**: Community sentiment from investment subreddits
- **X (Twitter) API**: Real-time tweet sentiment analysis
- **Yahoo Finance**: Stock prices and technical indicators
- **Finnhub API**: Company profiles, news, and financial data

### Technical Features
- **AI-Powered Sentiment Analysis**: Uses VADER and advanced NLP techniques
- **Technical Indicators**: RSI, MACD, SMA calculations
- **Caching System**: Intelligent caching for improved performance
- **RESTful API**: Clean API endpoints for easy integration
- **CLI Interface**: Command-line tool for direct analysis

## 🛠️ Technology Stack

- **Backend**: Python with Flask RESTful API
- **AI/ML**: NLTK, VADER, Pandas, NumPy
- **Data Processing**: Pandas, NumPy, Scikit-learn
- **APIs**: Reddit API, Twitter API v2, Yahoo Finance, Finnhub
- **Deployment**: Ready for Vercel or any cloud platform

## 📋 Prerequisites

- Python 3.9+
- Reddit Developer Account
- X (Twitter) Developer Account
- Finnhub API Key

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd stock-main/backend
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Setup
Create a `.env` file in the backend directory:

```env
# Reddit API Credentials
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=your_user_agent

# X (Twitter) API Credentials
X_BEARER_TOKEN=your_bearer_token
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_TOKEN_SECRET=your_access_token_secret

# Finnhub API Credentials
FINNHUB_API_KEY=your_finnhub_api_key

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
```

### 4. Get API Credentials

#### Reddit API
1. Go to [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Create a new app (script type)
3. Note your client ID and secret

#### X (Twitter) API
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app and get your credentials
3. Apply for Elevated access for full API features

#### Finnhub API
1. Go to [Finnhub](https://finnhub.io/)
2. Sign up for a free API key
3. Note your API key

## 🚀 Running the Application

### CLI Mode (Interactive)
```bash
python stock_sentiment.py
```

### Web Service Mode (Development)
```bash
python stock_sentiment.py --web
```

The web service will start on `http://localhost:5000`

### Production (WSGI)

Use Gunicorn behind a reverse proxy (Nginx/Render/Fly/Heroku).

```bash
export FLASK_ENV=production
export SECRET_KEY="$(python -c "import secrets; print(secrets.token_hex(32))")"
gunicorn -w 2 -b 0.0.0.0:5000 wsgi:application
```

Or on Windows (PowerShell):
```powershell
$env:FLASK_ENV='production'
$env:SECRET_KEY=(python -c "import secrets; print(secrets.token_hex(32))")
gunicorn -w 2 -b 0.0.0.0:5000 wsgi:application
```

Set `CORS_ORIGINS` to your frontend origin for strict CORS.

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Check service status

### Stock Analysis
- `GET /api/analyze/<stock_symbol>` - Comprehensive stock analysis
- `GET /api/trend/<stock_symbol>` - Trend prediction only
- `GET /api/stock/<stock_symbol>` - Stock data and technical indicators

### Social Media Data
- `GET /api/reddit/<stock_symbol>` - Reddit posts and sentiment
- `GET /api/x/<stock_symbol>` - X (Twitter) posts and sentiment

### Financial Data
- `GET /api/finnhub/profile/<stock_symbol>` - Company profile
- `GET /api/finnhub/news/<stock_symbol>` - Company news

## 🔍 Usage Examples

### CLI Example
```bash
$ python stock_sentiment.py
🚀 StockSentiment Pro - Enhanced Stock Analysis
==================================================
Enter stock symbol (e.g., AAPL): AAPL

📊 Analyzing AAPL...

🎯 Trend Prediction: Bullish
📈 Confidence: 75.2%
💭 Sentiment Score: 0.234

💰 Stock Data:
   Current Price: $175.43
   Change: +2.34%
   Volume: 45,678,901

🏢 Company Profile:
   Name: Apple Inc.
   Industry: Technology
   Country: United States

📰 News Articles: 15
📱 Reddit Posts: 23
🐦 X Posts: 18
```

### API Example
```bash
curl "http://localhost:5000/api/analyze/AAPL"
```

## 📊 Data Analysis

### Sentiment Analysis
- **VADER Sentiment**: Uses VADER (Valence Aware Dictionary and sEntiment Reasoner) for accurate sentiment scoring
- **Multi-Source Aggregation**: Combines sentiment from Reddit and X with weighted averaging
- **Confidence Scoring**: Provides confidence levels for predictions

### Technical Indicators
- **Moving Averages**: 20-day and 50-day Simple Moving Averages
- **RSI**: Relative Strength Index for overbought/oversold signals
- **MACD**: Moving Average Convergence Divergence for trend analysis

### Trend Prediction
- **Bullish**: Positive sentiment detected (score > 0.1)
- **Bearish**: Negative sentiment detected (score < -0.1)
- **Neutral**: Mixed sentiment (score between -0.1 and 0.1)

## 🚀 Deployment

### Local Development
```bash
python stock_sentiment.py --web
```

### Production Deployment
The application is ready for deployment on:
- **Vercel**: Serverless deployment
- **Heroku**: Traditional hosting
- **AWS/GCP**: Cloud deployment
- **Docker**: Containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This tool is for educational and research purposes only. Stock market predictions are inherently uncertain and should not be used as the sole basis for investment decisions. Always conduct thorough research and consult with financial professionals before making investment decisions.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs

## 🗺️ Roadmap

- [ ] Real-time data streaming
- [ ] Advanced ML models for prediction
- [ ] Portfolio tracking and alerts
- [ ] Mobile app development
- [ ] Additional data sources
- [ ] Enhanced visualization tools 