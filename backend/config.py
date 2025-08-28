import os
from datetime import timedelta
from utils.security import get_secure_config_value, validate_cors_origins, SecurityConfig

class Config:
    """Base configuration class with security best practices"""
    
    def __init__(self):
        """Initialize configuration with validation"""
        self._validate_environment()
    
    # Flask Configuration
    SECRET_KEY = get_secure_config_value('SECRET_KEY', required=False) or 'dev-secret-key-change-in-production'
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
    CORS_ORIGINS = validate_cors_origins(os.environ.get('CORS_ORIGINS', 'http://localhost:3000'))
    CORS_METHODS = ['GET', 'POST', 'OPTIONS']
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Data Sources Configuration (remove defaults for security)
    REDDIT_CLIENT_ID = os.environ.get('REDDIT_CLIENT_ID')
    REDDIT_CLIENT_SECRET = os.environ.get('REDDIT_CLIENT_SECRET')
    REDDIT_USER_AGENT = os.environ.get('REDDIT_USER_AGENT', 'StockSentimentBot/1.0')
    
    X_BEARER_TOKEN = os.environ.get('X_BEARER_TOKEN')
    X_API_KEY = os.environ.get('X_API_KEY')
    X_API_SECRET = os.environ.get('X_API_SECRET')
    X_ACCESS_TOKEN = os.environ.get('X_ACCESS_TOKEN')
    X_ACCESS_TOKEN_SECRET = os.environ.get('X_ACCESS_TOKEN_SECRET')
    
    FINNHUB_API_KEY = os.environ.get('FINNHUB_API_KEY')
    
    # Mock Data Configuration
    MOCK_DATA_ENABLED = os.environ.get('MOCK_DATA_ENABLED', 'True').lower() == 'true'
    
    # Performance Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    REQUEST_TIMEOUT = 30  # 30 seconds
    
    # Database Configuration (for future use)
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    # Redis Configuration (for future use)
    REDIS_URL = os.environ.get('REDIS_URL')
    
    @staticmethod
    def _validate_environment():
        """Validate environment configuration"""
        # No required vars for basic operation with fallbacks
        required_vars = []
        missing_vars = [var for var in required_vars if not os.environ.get(var)]
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        # Warn about missing optional but important variables
        optional_vars = ['REDDIT_CLIENT_ID', 'FINNHUB_API_KEY']
        missing_optional = [var for var in optional_vars if not os.environ.get(var)]
        
        if missing_optional:
            import logging
            logger = logging.getLogger(__name__)
            self.logger.warning(f"Missing optional API keys: {', '.join(missing_optional)}")

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
