"""
Enhanced Configuration Management System

Provides comprehensive configuration management with validation, 
environment detection, and proper documentation.
"""

import os
import logging
from datetime import timedelta
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field

from utils.security import get_secure_config_value, validate_cors_origins


@dataclass
class ConfigValidationRule:
    """Configuration validation rule"""
    key: str
    required: bool = False
    data_type: type = str
    validator: Optional[callable] = None
    default: Any = None
    description: str = ""


class ConfigValidator:
    """Configuration validation system"""
    
    def __init__(self):
        self.rules: List[ConfigValidationRule] = []
        self.warnings: List[str] = []
        self.errors: List[str] = []
    
    def add_rule(self, rule: ConfigValidationRule):
        """Add validation rule"""
        self.rules.append(rule)
    
    def validate(self, config_dict: Dict[str, Any]) -> bool:
        """Validate configuration against rules"""
        self.warnings.clear()
        self.errors.clear()
        
        for rule in self.rules:
            value = config_dict.get(rule.key)
            
            # Check required fields
            if rule.required and value is None:
                self.errors.append(f"Required configuration missing: {rule.key}")
                continue
            
            # Skip validation if value is None and not required
            if value is None:
                continue
            
            # Type validation
            if not isinstance(value, rule.data_type):
                try:
                    # Try to convert
                    if rule.data_type == bool and isinstance(value, str):
                        config_dict[rule.key] = value.lower() in ('true', '1', 'yes', 'on')
                    elif rule.data_type == int and isinstance(value, str):
                        config_dict[rule.key] = int(value)
                    elif rule.data_type == float and isinstance(value, str):
                        config_dict[rule.key] = float(value)
                    else:
                        config_dict[rule.key] = rule.data_type(value)
                except (ValueError, TypeError):
                    self.errors.append(
                        f"Invalid type for {rule.key}: expected {rule.data_type.__name__}, got {type(value).__name__}"
                    )
                    continue
            
            # Custom validation
            if rule.validator:
                try:
                    if not rule.validator(config_dict[rule.key]):
                        self.errors.append(f"Validation failed for {rule.key}")
                except Exception as e:
                    self.errors.append(f"Validation error for {rule.key}: {str(e)}")
        
        return len(self.errors) == 0


class BaseConfig:
    """Base configuration class with enhanced validation and documentation"""
    
    def __init__(self):
        """Initialize configuration with comprehensive validation"""
        self._validator = ConfigValidator()
        self._setup_validation_rules()
        
        # Load configuration values
        self._load_configuration()
        
        # Validate configuration
        config_dict = {key: getattr(self, key) for key in dir(self) if not key.startswith('_')}
        
        if not self._validator.validate(config_dict):
            for error in self._validator.errors:
                logging.error(f"Configuration error: {error}")
            raise ValueError(f"Configuration validation failed: {'; '.join(self._validator.errors)}")
        
        if self._validator.warnings:
            for warning in self._validator.warnings:
                logging.warning(f"Configuration warning: {warning}")
    
    def _setup_validation_rules(self):
        """Setup configuration validation rules"""
        rules = [
            # Flask Core
            ConfigValidationRule(
                'SECRET_KEY', required=False, data_type=str,
                description="Flask secret key for session security"
            ),
            ConfigValidationRule(
                'DEBUG', required=False, data_type=bool, default=False,
                description="Enable debug mode (development only)"
            ),
            ConfigValidationRule(
                'TESTING', required=False, data_type=bool, default=False,
                description="Enable testing mode"
            ),
            
            # Server Configuration
            ConfigValidationRule(
                'HOST', required=False, data_type=str, default='0.0.0.0',
                description="Server host address"
            ),
            ConfigValidationRule(
                'PORT', required=False, data_type=int, default=5000,
                validator=lambda x: 1 <= x <= 65535,
                description="Server port number (1-65535)"
            ),
            
            # API Configuration
            ConfigValidationRule(
                'API_VERSION', required=False, data_type=str, default='v1.0.0',
                description="API version string"
            ),
            ConfigValidationRule(
                'LOG_LEVEL', required=False, data_type=str, default='INFO',
                validator=lambda x: x.upper() in ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'],
                description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)"
            ),
            
            # Rate Limiting
            ConfigValidationRule(
                'RATELIMIT_ENABLED', required=False, data_type=bool, default=True,
                description="Enable API rate limiting"
            ),
            
            # Data Sources (removed mock data configuration)
            
            # Cache Configuration
            ConfigValidationRule(
                'CACHE_DEFAULT_TIMEOUT', required=False, data_type=int, default=300,
                validator=lambda x: x > 0,
                description="Default cache timeout in seconds"
            ),
            
            # Request Configuration
            ConfigValidationRule(
                'MAX_CONTENT_LENGTH', required=False, data_type=int, default=16*1024*1024,
                validator=lambda x: x > 0,
                description="Maximum request content length in bytes"
            ),
            ConfigValidationRule(
                'REQUEST_TIMEOUT', required=False, data_type=int, default=30,
                validator=lambda x: x > 0,
                description="Request timeout in seconds"
            ),
        ]
        
        for rule in rules:
            self._validator.add_rule(rule)
    
    def _load_configuration(self):
        """Load configuration values from environment"""
        # Flask Core Configuration
        self.SECRET_KEY = get_secure_config_value('SECRET_KEY', required=False) or 'dev-secret-key-change-in-production'
        self.FLASK_ENV = os.environ.get('FLASK_ENV', 'production')
        self.DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
        self.TESTING = os.environ.get('TESTING', 'False').lower() == 'true'
        
        # Server Configuration
        self.HOST = os.environ.get('HOST', '0.0.0.0')
        self.PORT = int(os.environ.get('PORT', 5000))
        
        # API Configuration
        self.API_TITLE = 'Stock Sentiment Analyzer API'
        self.API_VERSION = os.environ.get('API_VERSION', 'v1.0.0')
        self.API_DESCRIPTION = 'AI-powered stock sentiment analysis from social media and financial data'
        
        # Logging Configuration
        self.LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
        self.LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
        
        # Rate Limiting Configuration
        self.RATELIMIT_ENABLED = os.environ.get('RATELIMIT_ENABLED', 'True').lower() == 'true'
        self.RATELIMIT_STORAGE_URL = os.environ.get('RATELIMIT_STORAGE_URL', 'memory://')
        self.RATELIMIT_DEFAULT = os.environ.get('RATELIMIT_DEFAULT', '100 per minute')
        self.RATELIMIT_HEADERS_ENABLED = os.environ.get('RATELIMIT_HEADERS_ENABLED', 'True').lower() == 'true'
        
        # Caching Configuration
        self.CACHE_TYPE = os.environ.get('CACHE_TYPE', 'simple')
        self.CACHE_DEFAULT_TIMEOUT = int(os.environ.get('CACHE_DEFAULT_TIMEOUT', 300))
        
        # Security Configuration
        self.SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'True').lower() == 'true'
        self.SESSION_COOKIE_HTTPONLY = True
        self.SESSION_COOKIE_SAMESITE = 'Lax'
        self.PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
        
        # CORS Configuration
        cors_origins_str = os.environ.get('CORS_ORIGINS', 'http://localhost:3000')
        self.CORS_ORIGINS = validate_cors_origins(cors_origins_str)
        self.CORS_METHODS = ['GET', 'POST', 'OPTIONS']
        self.CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
        
        # Performance Configuration
        self.MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
        self.REQUEST_TIMEOUT = int(os.environ.get('REQUEST_TIMEOUT', 30))
        
        # External API Configuration
        self._load_api_configuration()
        
        # Database Configuration (for future use)
        self.DATABASE_URL = os.environ.get('DATABASE_URL')
        self.REDIS_URL = os.environ.get('REDIS_URL')
    
    def _load_api_configuration(self):
        """Load external API configuration"""
        # Reddit API Configuration
        self.REDDIT_CLIENT_ID = os.environ.get('REDDIT_CLIENT_ID')
        self.REDDIT_CLIENT_SECRET = os.environ.get('REDDIT_CLIENT_SECRET')
        self.REDDIT_USER_AGENT = os.environ.get('REDDIT_USER_AGENT', 'StockSentimentBot/1.0')
        
        # X (Twitter) API Configuration
        self.X_BEARER_TOKEN = os.environ.get('X_BEARER_TOKEN')
        self.X_API_KEY = os.environ.get('X_API_KEY')
        self.X_API_SECRET = os.environ.get('X_API_SECRET')
        self.X_ACCESS_TOKEN = os.environ.get('X_ACCESS_TOKEN')
        self.X_ACCESS_TOKEN_SECRET = os.environ.get('X_ACCESS_TOKEN_SECRET')
        
        # Finnhub API Configuration
        self.FINNHUB_API_KEY = os.environ.get('FINNHUB_API_KEY')
    
    def get_config_summary(self) -> Dict[str, Any]:
        """Get configuration summary for debugging"""
        summary = {}
        for key in dir(self):
            if not key.startswith('_') and not callable(getattr(self, key)):
                value = getattr(self, key)
                
                # Convert non-serializable types
                if isinstance(value, timedelta):
                    value = str(value)
                elif hasattr(value, '__dict__'):
                    value = str(value)
                
                # Mask sensitive values
                if 'secret' in key.lower() or 'key' in key.lower() or 'token' in key.lower():
                    if value:
                        summary[key] = f"{'*' * 8}...{str(value)[-4:]}"
                    else:
                        summary[key] = None
                else:
                    summary[key] = value
        return summary
    
    def validate_api_keys(self) -> Dict[str, bool]:
        """Validate availability of API keys"""
        return {
            'reddit': bool(self.REDDIT_CLIENT_ID and self.REDDIT_CLIENT_SECRET),
            'x_twitter': bool(self.X_BEARER_TOKEN or (self.X_API_KEY and self.X_API_SECRET)),
            'finnhub': bool(self.FINNHUB_API_KEY)
        }


class DevelopmentConfig(BaseConfig):
    """Development configuration with relaxed security"""
    
    def _load_configuration(self):
        super()._load_configuration()
        self.DEBUG = True
        self.FLASK_ENV = 'development'
        self.CACHE_TYPE = 'null'
        self.LOG_LEVEL = 'DEBUG'
        self.MOCK_DATA_ENABLED = True
        self.SESSION_COOKIE_SECURE = False
        self.RATELIMIT_ENABLED = False


class ProductionConfig(BaseConfig):
    """Production configuration with enhanced security"""
    
    def _load_configuration(self):
        super()._load_configuration()
        self.DEBUG = False
        self.FLASK_ENV = 'production'
        self.SESSION_COOKIE_SECURE = True
        self.LOG_LEVEL = os.environ.get('LOG_LEVEL', 'WARNING')
        self.MOCK_DATA_ENABLED = False


class TestingConfig(BaseConfig):
    """Testing configuration"""
    
    def _load_configuration(self):
        super()._load_configuration()
        self.TESTING = True
        self.DEBUG = True
        self.CACHE_TYPE = 'null'
        self.MOCK_DATA_ENABLED = True
        self.RATELIMIT_ENABLED = False
        self.LOG_LEVEL = 'DEBUG'


# Configuration registry
config_registry = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': ProductionConfig
}


def get_config(config_name: str = None) -> BaseConfig:
    """
    Get configuration instance based on environment.
    
    Args:
        config_name: Configuration name override
        
    Returns:
        Configuration instance
    """
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'production')
    
    config_class = config_registry.get(config_name, config_registry['default'])
    return config_class()


def create_sample_env_file(output_path: str = '.env.sample') -> None:
    """
    Create a sample environment file with all configuration options.
    
    Args:
        output_path: Path to output the sample file
    """
    sample_content = '''# Stock Sentiment Analyzer - Environment Configuration

# Flask Configuration
SECRET_KEY=your-secret-key-here-change-in-production
FLASK_ENV=development
FLASK_DEBUG=true

# Server Configuration
HOST=0.0.0.0
PORT=5000

# API Configuration
API_VERSION=v1.0.0
LOG_LEVEL=INFO

# Rate Limiting
RATELIMIT_ENABLED=true
RATELIMIT_DEFAULT=100 per minute

# Cache Configuration
CACHE_TYPE=simple
CACHE_DEFAULT_TIMEOUT=300

# Security Configuration
SESSION_COOKIE_SECURE=false
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Performance Configuration
MAX_CONTENT_LENGTH=16777216
REQUEST_TIMEOUT=30

# External API Keys (Optional)
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
REDDIT_USER_AGENT=StockSentimentBot/1.0

X_BEARER_TOKEN=your-x-bearer-token
X_API_KEY=your-x-api-key
X_API_SECRET=your-x-api-secret
X_ACCESS_TOKEN=your-x-access-token
X_ACCESS_TOKEN_SECRET=your-x-access-token-secret

FINNHUB_API_KEY=your-finnhub-api-key

# Database Configuration (Future Use)
DATABASE_URL=
REDIS_URL=
'''
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(sample_content)
    
    print(f"Sample environment file created at: {output_path}")


if __name__ == "__main__":
    # CLI tool for configuration management
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'validate':
            try:
                config = get_config()
                print("✅ Configuration validation passed")
                print(f"Environment: {config.FLASK_ENV}")
                print(f"API Keys available: {config.validate_api_keys()}")
            except Exception as e:
                print(f"❌ Configuration validation failed: {e}")
                sys.exit(1)
        
        elif sys.argv[1] == 'summary':
            try:
                config = get_config()
                import json
                print(json.dumps(config.get_config_summary(), indent=2))
            except Exception as e:
                print(f"❌ Error getting configuration summary: {e}")
                sys.exit(1)
        
        elif sys.argv[1] == 'sample':
            create_sample_env_file()
    else:
        print("Usage: python config_enhanced.py [validate|summary|sample]")