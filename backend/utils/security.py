"""
Security Utilities Module

Provides security-related utilities including secret management,
input validation, and security headers configuration.
"""

import os
import secrets
import string
from typing import Dict, List, Optional

from flask import Flask


def generate_secret_key(length: int = 32) -> str:
    """
    Generate a cryptographically secure secret key.
    
    Args:
        length: Length of the secret key
        
    Returns:
        Generated secret key
    """
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def validate_secret_key(secret_key: str) -> bool:
    """
    Validate if a secret key meets minimum security requirements.
    
    Args:
        secret_key: Secret key to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not secret_key or len(secret_key) < 16:
        return False
    
    # Check for common weak keys
    weak_keys = [
        'your_secret_key_here',
        'secret',
        'password',
        'key',
        'flask_secret',
        'development_key'
    ]
    
    return secret_key.lower() not in weak_keys


def get_secure_config_value(key: str, default: str = None, required: bool = False) -> Optional[str]:
    """
    Get configuration value with security validation.
    
    Args:
        key: Configuration key
        default: Default value if not found
        required: Whether the value is required
        
    Returns:
        Configuration value
        
    Raises:
        ValueError: If required value is missing or invalid
    """
    value = os.getenv(key, default)
    
    if required and not value:
        raise ValueError(f"Required configuration value missing: {key}")
    
    # Special validation for secret key
    if key == 'SECRET_KEY' and value:
        if not validate_secret_key(value):
            raise ValueError("SECRET_KEY does not meet security requirements")
    
    return value


def sanitize_api_key_for_logging(api_key: str) -> str:
    """
    Sanitize API key for safe logging.
    
    Args:
        api_key: API key to sanitize
        
    Returns:
        Sanitized key showing only first and last few characters
    """
    if not api_key or len(api_key) < 8:
        return "[HIDDEN]"
    
    return f"{api_key[:4]}...{api_key[-4:]}"


def validate_cors_origins(origins: str) -> List[str]:
    """
    Validate and parse CORS origins configuration.
    
    Args:
        origins: Comma-separated list of origins
        
    Returns:
        List of validated origins
    """
    if not origins:
        return ['*']  # Default to allow all (not recommended for production)
    
    origin_list = [origin.strip() for origin in origins.split(',')]
    validated_origins = []
    
    for origin in origin_list:
        if origin == '*':
            validated_origins.append(origin)
        elif origin.startswith(('http://', 'https://')):
            validated_origins.append(origin)
        else:
            # Add protocol if missing (assume https for production)
            if 'localhost' in origin or '127.0.0.1' in origin:
                validated_origins.append(f"http://{origin}")
            else:
                validated_origins.append(f"https://{origin}")
    
    return validated_origins


def configure_security_headers(app: Flask) -> None:
    """
    Configure security headers for Flask application.
    
    Args:
        app: Flask application instance
    """
    
    @app.after_request
    def add_security_headers(response):
        """Add security headers to all responses"""
        
        # Prevent MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # Prevent clickjacking
        response.headers['X-Frame-Options'] = 'DENY'
        
        # XSS protection
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy (basic)
        if app.config.get('FLASK_ENV') == 'production':
            response.headers['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https:; "
                "font-src 'self' https:; "
            )
        
        # HSTS (only in production over HTTPS)
        if (app.config.get('FLASK_ENV') == 'production' and 
            request.environ.get('wsgi.url_scheme') == 'https'):
            response.headers['Strict-Transport-Security'] = (
                'max-age=31536000; includeSubDomains'
            )
        
        return response


def mask_sensitive_data(data: Dict, sensitive_keys: List[str] = None) -> Dict:
    """
    Mask sensitive data in dictionaries for safe logging.
    
    Args:
        data: Dictionary to mask
        sensitive_keys: List of keys to mask (defaults to common sensitive keys)
        
    Returns:
        Dictionary with sensitive values masked
    """
    if sensitive_keys is None:
        sensitive_keys = [
            'password', 'secret', 'key', 'token', 'api_key',
            'client_secret', 'bearer_token', 'access_token'
        ]
    
    masked_data = data.copy()
    
    for key, value in masked_data.items():
        if any(sensitive_key in key.lower() for sensitive_key in sensitive_keys):
            if isinstance(value, str) and len(value) > 8:
                masked_data[key] = f"{value[:4]}...{value[-4:]}"
            else:
                masked_data[key] = "[HIDDEN]"
    
    return masked_data


def validate_input_length(value: str, max_length: int = 100, field_name: str = "input") -> str:
    """
    Validate input length to prevent potential attacks.
    
    Args:
        value: Input value to validate
        max_length: Maximum allowed length
        field_name: Name of the field for error messages
        
    Returns:
        Validated input
        
    Raises:
        ValueError: If input is too long
    """
    if not value:
        return value
    
    if len(value) > max_length:
        raise ValueError(f"{field_name} exceeds maximum length of {max_length} characters")
    
    return value.strip()


def check_environment_security() -> Dict[str, bool]:
    """
    Check environment for common security issues.
    
    Returns:
        Dictionary with security check results
    """
    checks = {
        'secret_key_secure': False,
        'debug_disabled': True,
        'cors_configured': False,
        'env_file_exists': False,
        'required_vars_set': False
    }
    
    # Check secret key
    secret_key = os.getenv('SECRET_KEY')
    if secret_key:
        checks['secret_key_secure'] = validate_secret_key(secret_key)
    
    # Check debug mode
    debug = os.getenv('FLASK_DEBUG', 'False').lower()
    checks['debug_disabled'] = debug in ['false', '0', 'no']
    
    # Check CORS configuration
    cors_origins = os.getenv('CORS_ORIGINS')
    checks['cors_configured'] = bool(cors_origins and cors_origins != '*')
    
    # Check if .env file exists
    checks['env_file_exists'] = os.path.exists('.env')
    
    # Check required environment variables
    required_vars = ['SECRET_KEY', 'FLASK_ENV']
    checks['required_vars_set'] = all(os.getenv(var) for var in required_vars)
    
    return checks


class SecurityConfig:
    """Configuration class for security settings"""
    
    def __init__(self):
        self.secret_key = get_secure_config_value('SECRET_KEY', required=True)
        self.cors_origins = validate_cors_origins(os.getenv('CORS_ORIGINS', ''))
        self.session_cookie_secure = os.getenv('SESSION_COOKIE_SECURE', 'True').lower() == 'true'
        self.session_cookie_httponly = os.getenv('SESSION_COOKIE_HTTPONLY', 'True').lower() == 'true'
        self.session_cookie_samesite = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
        
    def apply_to_app(self, app: Flask) -> None:
        """Apply security configuration to Flask app"""
        app.config['SECRET_KEY'] = self.secret_key
        app.config['SESSION_COOKIE_SECURE'] = self.session_cookie_secure
        app.config['SESSION_COOKIE_HTTPONLY'] = self.session_cookie_httponly
        app.config['SESSION_COOKIE_SAMESITE'] = self.session_cookie_samesite
        
        configure_security_headers(app)