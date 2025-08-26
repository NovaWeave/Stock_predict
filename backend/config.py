import os
from datetime import timedelta

class Config:
    """Base configuration class"""
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'ff7300cabf7ebad2fee55dc1cc115ef219178cbe276aff7aa04b4f2a78280b1e')
    FLASK_ENV = os.environ.get('FLASK_ENV', 'production')
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Server Configuration
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5000))
    
    # API Configuration
    API_TITLE = 'Stock Sentiment Analyzer API'
    API_VERSION = 'v1.0.0'
    API_DESCRIPTION = 'AI-powered stock sentiment analysis from social media and financial data'
    
    # Rate Limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = 'memory://'
    RATELIMIT_DEFAULT = '100 per minute'
    RATELIMIT_HEADERS_ENABLED = True
    
    # Caching
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes
    
    # Security
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'True').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # CORS Configuration
    CORS_ORIGINS = [o.strip() for o in os.environ.get('CORS_ORIGINS', 'http://localhost:3000,https://yourdomain.com').split(',') if o.strip()]
    CORS_METHODS = ['GET', 'POST', 'OPTIONS']
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Data Sources Configuration
    REDDIT_CLIENT_ID = os.environ.get('REDDIT_CLIENT_ID', 'placeholder')
    REDDIT_CLIENT_SECRET = os.environ.get('REDDIT_CLIENT_SECRET', 'placeholder')
    REDDIT_USER_AGENT = os.environ.get('REDDIT_USER_AGENT', 'StockSentimentBot/1.0')
    
    X_BEARER_TOKEN = os.environ.get('X_BEARER_TOKEN', 'placeholder')
    X_API_KEY = os.environ.get('X_API_KEY', 'placeholder')
    X_API_SECRET = os.environ.get('X_API_SECRET', 'placeholder')
    X_ACCESS_TOKEN = os.environ.get('X_ACCESS_TOKEN', 'placeholder')
    X_ACCESS_TOKEN_SECRET = os.environ.get('X_ACCESS_TOKEN_SECRET', 'placeholder')
    
    FINNHUB_API_KEY = os.environ.get('FINNHUB_API_KEY', 'placeholder_finnhub_key')
    
    # Mock Data Configuration
    MOCK_DATA_ENABLED = os.environ.get('MOCK_DATA_ENABLED', 'True').lower() == 'true'
    
    # Performance Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    REQUEST_TIMEOUT = 30  # 30 seconds
    
    # Database Configuration (for future use)
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    # Redis Configuration (for future use)
    REDIS_URL = os.environ.get('REDIS_URL')

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    FLASK_ENV = 'development'
    CACHE_TYPE = 'null'
    LOG_LEVEL = 'DEBUG'
    MOCK_DATA_ENABLED = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    FLASK_ENV = 'production'
    SESSION_COOKIE_SECURE = True
    LOG_LEVEL = 'WARNING'
    MOCK_DATA_ENABLED = False

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    CACHE_TYPE = 'null'
    MOCK_DATA_ENABLED = True

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': ProductionConfig
}

def get_config():
    """Get configuration based on environment"""
    config_name = os.environ.get('FLASK_ENV', 'production')
    return config.get(config_name, config['default'])
