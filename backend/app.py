"""
Stock Sentiment Analyzer - Main Application Entry Point

Clean architecture Flask application with proper application factory pattern
and dependency injection for services.
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional

from flask import Flask, jsonify, request
from flask_cors import CORS

from config_enhanced import get_config
from services.sentiment import SentimentAnalysisService
from services.social_media import SocialMediaService
from services.stock_data import StockDataService
from utils.error_handling import (
    register_error_handlers, setup_logging, ValidationError,
    validate_stock_symbol, validate_limit
)


def create_app(config_name: Optional[str] = None) -> Flask:
    """
    Application factory function to create Flask app instance.
    
    Args:
        config_name: Configuration name to use
        
    Returns:
        Configured Flask application instance
    """
    # Create Flask app
    app = Flask(__name__)
    
    # Configure application
    app.config.from_object(get_config(config_name))
    
    # Setup logging
    log_level = app.config.get('LOG_LEVEL', 'INFO')
    logger = setup_logging('stock_sentiment_api', log_level)
    
    # Initialize extensions
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get('CORS_ORIGINS', ['*'])}},
        supports_credentials=True
    )
    
    # Register error handlers
    register_error_handlers(app)
    
    # Initialize services
    services = init_services(app.config)
    
    # Register blueprints/routes
    register_routes(app, services)
    
    logger.info("Stock Sentiment Analyzer API initialized successfully")
    return app


def init_services(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Initialize all application services.
    
    Args:
        config: Application configuration
        
    Returns:
        Dictionary of initialized services
    """
    logger = logging.getLogger('stock_sentiment_api')
    
    try:
        services = {
            'sentiment': SentimentAnalysisService(),
            'stock_data': StockDataService(),
            'social_media': SocialMediaService()
        }
        
        logger.info("All services initialized successfully")
        return services
        
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise


def register_routes(app: Flask, services: Dict[str, Any]) -> None:
    """
    Register all API routes.
    
    Args:
        app: Flask application instance
        services: Dictionary of initialized services
    """
    
    @app.route('/')
    def index():
        """Root endpoint"""
        return jsonify({
            'service': 'Stock Sentiment Analyzer API',
            'version': app.config.get('API_VERSION', 'v1.0.0'),
            'status': 'ok',
            'endpoints': {
                'health': '/api/health',
                'analyze': '/api/analyze/<stock_symbol>',
                'trend': '/api/trend/<stock_symbol>',
                'stock': '/api/stock/<stock_symbol>',
                'reddit': '/api/reddit/<stock_symbol>',
                'x': '/api/x/<stock_symbol>'
            }
        })
    
    @app.route('/api/health')
    def health_check():
        """Health check endpoint"""
        try:
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'services': {
                    'sentiment_analysis': services['sentiment'].is_available(),
                    'stock_data': services['stock_data'].is_available(),
                    'social_media': services['social_media'].is_available()
                },
                'version': app.config.get('API_VERSION', 'v1.0.0')
            })
        except Exception as e:
            app.logger.error(f"Health check failed: {e}")
            return jsonify({'status': 'unhealthy', 'error': str(e)}), 500
    
    @app.route('/api/analyze/<stock_symbol>')
    def analyze_stock(stock_symbol: str):
        """Comprehensive stock analysis endpoint"""
        try:
            # Validate input
            symbol = validate_stock_symbol(stock_symbol)
            
            app.logger.info(f"Starting comprehensive analysis for {symbol}")
            
            # Get trend prediction
            trend_result = get_trend_prediction(symbol, services)
            
            # Get stock data
            stock_data = services['stock_data'].get_stock_data(symbol)
            
            # Get social media data with sentiment
            reddit_posts = services['social_media'].get_reddit_posts(symbol, limit=10)
            x_posts = services['social_media'].get_x_posts(symbol, limit=10)
            
            reddit_with_sentiment = add_sentiment_to_posts(reddit_posts, services['sentiment'])
            x_with_sentiment = add_sentiment_to_x_posts(x_posts, services['sentiment'])
            
            result = {
                "success": True,
                "stock_symbol": symbol,
                "timestamp": datetime.now().isoformat(),
                "trend_prediction": trend_result,
                "stock_data": stock_data,
                "reddit_posts": {
                    "success": True,
                    "data": reddit_with_sentiment
                },
                "x_posts": {
                    "success": True,
                    "data": x_with_sentiment
                }
            }
            
            app.logger.info(f"Comprehensive analysis completed for {symbol}")
            return jsonify(result)
            
        except ValidationError as e:
            return jsonify({"success": False, "error": str(e), "field": e.field}), 400
        except Exception as e:
            app.logger.error(f"Error in comprehensive analysis for {stock_symbol}: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route('/api/trend/<stock_symbol>')
    def get_trend(stock_symbol: str):
        """Get trend prediction for a stock"""
        try:
            symbol = validate_stock_symbol(stock_symbol)
            result = get_trend_prediction(symbol, services)
            return jsonify(result)
        except ValidationError as e:
            return jsonify({"success": False, "error": str(e), "field": e.field}), 400
        except Exception as e:
            app.logger.error(f"Error getting trend for {stock_symbol}: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route('/api/stock/<stock_symbol>')
    def get_stock_data(stock_symbol: str):
        """Get stock data endpoint"""
        try:
            symbol = validate_stock_symbol(stock_symbol)
            days = validate_limit(request.args.get('days', type=int), max_limit=365)
            
            result = services['stock_data'].get_stock_data(symbol, days)
            return jsonify(result)
        except ValidationError as e:
            return jsonify({"success": False, "error": str(e), "field": e.field}), 400
        except Exception as e:
            app.logger.error(f"Error getting stock data for {stock_symbol}: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route('/api/reddit/<stock_symbol>')
    def get_reddit_data(stock_symbol: str):
        """Get Reddit data endpoint"""
        try:
            symbol = validate_stock_symbol(stock_symbol)
            limit = validate_limit(request.args.get('limit', type=int), max_limit=100)
            
            posts = services['social_media'].get_reddit_posts(symbol, limit)
            posts_with_sentiment = add_sentiment_to_posts(posts, services['sentiment'])
            
            return jsonify({
                "success": True,
                "data": posts_with_sentiment
            })
        except ValidationError as e:
            return jsonify({"success": False, "error": str(e), "field": e.field}), 400
        except Exception as e:
            app.logger.error(f"Error getting Reddit data for {stock_symbol}: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route('/api/x/<stock_symbol>')
    def get_x_data(stock_symbol: str):
        """Get X data endpoint"""
        try:
            symbol = validate_stock_symbol(stock_symbol)
            limit = validate_limit(request.args.get('limit', type=int), max_limit=100)
            
            posts = services['social_media'].get_x_posts(symbol, limit)
            posts_with_sentiment = add_sentiment_to_x_posts(posts, services['sentiment'])
            
            return jsonify({
                "success": True,
                "data": posts_with_sentiment
            })
        except ValidationError as e:
            return jsonify({"success": False, "error": str(e), "field": e.field}), 400
        except Exception as e:
            app.logger.error(f"Error getting X data for {stock_symbol}: {e}")
            return jsonify({"success": False, "error": str(e)}), 500


def get_trend_prediction(stock_symbol: str, services: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate trend prediction based on sentiment analysis.
    
    Args:
        stock_symbol: Stock symbol to analyze
        services: Dictionary of initialized services
        
    Returns:
        Trend prediction result
    """
    try:
        # Get social media data
        reddit_posts = services['social_media'].get_reddit_posts(stock_symbol, limit=50)
        x_posts = services['social_media'].get_x_posts(stock_symbol, limit=50)
        
        # Calculate sentiment scores
        reddit_texts = []
        if reddit_posts:
            reddit_texts = [f"{post.get('title', '')} {post.get('text', '')}" for post in reddit_posts]
        
        x_texts = [post['text'] for post in x_posts if post.get('text')]
        
        reddit_sentiment = 0
        x_sentiment = 0
        
        if reddit_texts:
            reddit_summary = services['sentiment'].get_sentiment_summary(reddit_texts)
            reddit_sentiment = reddit_summary['average_sentiment']
        
        if x_texts:
            x_summary = services['sentiment'].get_sentiment_summary(x_texts)
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
        logging.getLogger('stock_sentiment_api').error(f"Error calculating trend prediction: {e}")
        return {"success": False, "error": str(e)}


def add_sentiment_to_posts(posts_list: list, sentiment_service) -> list:
    """Add sentiment analysis to Reddit posts"""
    if not posts_list:
        return []
    
    try:
        for post in posts_list:
            text = f"{post.get('title', '')} {post.get('text', '')}".strip()
            post['sentiment'] = sentiment_service.analyze_text(text)
        return posts_list
    except Exception as e:
        logging.getLogger('stock_sentiment_api').error(f"Error adding sentiment to posts: {e}")
        return posts_list


def add_sentiment_to_x_posts(posts: list, sentiment_service) -> list:
    """Add sentiment analysis to X posts"""
    try:
        for post in posts:
            text = post.get('text', '')
            post['sentiment'] = sentiment_service.analyze_text(text)
        return posts
    except Exception as e:
        logging.getLogger('stock_sentiment_api').error(f"Error adding sentiment to X posts: {e}")
        return posts


# Application instance for WSGI servers
app = create_app()


if __name__ == '__main__':
    # Development server
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)