"""
Error Handling and Logging Module

Provides custom exceptions, error handlers, and logging configuration
for the Stock Sentiment Analyzer application.
"""

import logging
import sys
from datetime import datetime
from functools import wraps
from typing import Any, Dict, Optional

from flask import jsonify, request


class StockSentimentError(Exception):
    """Base exception for Stock Sentiment Analyzer"""
    
    def __init__(self, message: str, error_code: str = "GENERAL_ERROR", status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.timestamp = datetime.now().isoformat()


class APIError(StockSentimentError):
    """API-related errors"""
    
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message, "API_ERROR", status_code)


class DataSourceError(StockSentimentError):
    """Data source errors (external APIs, databases, etc.)"""
    
    def __init__(self, message: str, source: str):
        super().__init__(message, f"DATA_SOURCE_ERROR_{source.upper()}", 503)
        self.source = source


class ValidationError(StockSentimentError):
    """Input validation errors"""
    
    def __init__(self, message: str, field: str = None):
        super().__init__(message, "VALIDATION_ERROR", 400)
        self.field = field


class RateLimitError(StockSentimentError):
    """Rate limiting errors"""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, "RATE_LIMIT_ERROR", 429)


def setup_logging(app_name: str = "stock_sentiment", log_level: str = "INFO") -> logging.Logger:
    """
    Set up comprehensive logging configuration.
    
    Args:
        app_name: Name of the application for logger
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        
    Returns:
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger(app_name)
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # Remove existing handlers to avoid duplicates
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (optional, can be configured via environment)
    log_file = None  # Can be set via environment variable
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    logger.info(f"Logging configured for {app_name} at {log_level} level")
    return logger


def handle_exceptions(func):
    """
    Decorator for handling exceptions in service methods.
    
    Provides consistent error logging and exception transformation.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except StockSentimentError:
            # Re-raise our custom exceptions
            raise
        except Exception as e:
            # Log unexpected exceptions and convert to our format
            logger = logging.getLogger(func.__module__)
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}", exc_info=True)
            raise StockSentimentError(
                f"Unexpected error in {func.__name__}: {str(e)}",
                "UNEXPECTED_ERROR",
                500
            )
    return wrapper


def validate_stock_symbol(symbol: str) -> str:
    """
    Validate and normalize stock symbol.
    
    Args:
        symbol: Stock symbol to validate
        
    Returns:
        Normalized stock symbol
        
    Raises:
        ValidationError: If symbol is invalid
    """
    if not symbol:
        raise ValidationError("Stock symbol is required", "symbol")
    
    # Basic validation
    symbol = symbol.strip().upper()
    
    if len(symbol) < 1 or len(symbol) > 10:
        raise ValidationError("Stock symbol must be 1-10 characters", "symbol")
    
    if not symbol.isalnum():
        raise ValidationError("Stock symbol must contain only letters and numbers", "symbol")
    
    return symbol


def validate_limit(limit: Optional[int], max_limit: int = 100) -> int:
    """
    Validate and normalize limit parameter.
    
    Args:
        limit: Limit value to validate
        max_limit: Maximum allowed limit
        
    Returns:
        Validated limit
        
    Raises:
        ValidationError: If limit is invalid
    """
    if limit is None:
        return 50  # Default limit
    
    if not isinstance(limit, int) or limit < 1:
        raise ValidationError("Limit must be a positive integer", "limit")
    
    if limit > max_limit:
        raise ValidationError(f"Limit cannot exceed {max_limit}", "limit")
    
    return limit


def register_error_handlers(app):
    """
    Register error handlers for Flask application.
    
    Args:
        app: Flask application instance
    """
    
    @app.errorhandler(StockSentimentError)
    def handle_stock_sentiment_error(error: StockSentimentError):
        """Handle custom application errors"""
        response = {
            "success": False,
            "error": {
                "message": error.message,
                "code": error.error_code,
                "timestamp": error.timestamp
            }
        }
        
        # Add additional context for specific error types
        if isinstance(error, ValidationError) and error.field:
            response["error"]["field"] = error.field
        elif isinstance(error, DataSourceError):
            response["error"]["source"] = error.source
        
        app.logger.error(f"Application error: {error.message}")
        return jsonify(response), error.status_code
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 errors"""
        return jsonify({
            "success": False,
            "error": {
                "message": "Endpoint not found",
                "code": "NOT_FOUND",
                "timestamp": datetime.now().isoformat()
            }
        }), 404
    
    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        """Handle 405 errors"""
        return jsonify({
            "success": False,
            "error": {
                "message": "Method not allowed",
                "code": "METHOD_NOT_ALLOWED",
                "timestamp": datetime.now().isoformat()
            }
        }), 405
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle 500 errors"""
        app.logger.error(f"Internal server error: {str(error)}")
        return jsonify({
            "success": False,
            "error": {
                "message": "Internal server error",
                "code": "INTERNAL_ERROR",
                "timestamp": datetime.now().isoformat()
            }
        }), 500
    
    @app.before_request
    def log_request_info():
        """Log incoming requests"""
        app.logger.debug(f"Request: {request.method} {request.url}")
    
    @app.after_request
    def log_response_info(response):
        """Log outgoing responses"""
        app.logger.debug(f"Response: {response.status_code}")
        return response


class ErrorContext:
    """
    Context manager for handling errors in service operations.
    
    Provides structured error handling with automatic logging and
    conversion to appropriate exception types.
    """
    
    def __init__(self, operation: str, logger: logging.Logger):
        self.operation = operation
        self.logger = logger
    
    def __enter__(self):
        self.logger.debug(f"Starting operation: {self.operation}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.logger.debug(f"Operation completed successfully: {self.operation}")
            return
        
        if issubclass(exc_type, StockSentimentError):
            # Our custom exceptions, just log and re-raise
            self.logger.error(f"Operation failed: {self.operation} - {exc_val}")
            return False
        
        # Convert unexpected exceptions
        self.logger.error(f"Unexpected error in {self.operation}: {exc_val}", exc_info=True)
        
        # Convert common exception types
        if issubclass(exc_type, ValueError):
            raise ValidationError(f"Invalid input in {self.operation}: {exc_val}")
        elif issubclass(exc_type, ConnectionError):
            raise DataSourceError(f"Connection error in {self.operation}: {exc_val}", "external_api")
        elif issubclass(exc_type, TimeoutError):
            raise DataSourceError(f"Timeout error in {self.operation}: {exc_val}", "external_api")
        else:
            raise StockSentimentError(f"Unexpected error in {self.operation}: {exc_val}")


def create_success_response(data: Any, message: str = None) -> Dict[str, Any]:
    """
    Create standardized success response.
    
    Args:
        data: Response data
        message: Optional success message
        
    Returns:
        Standardized success response
    """
    response = {
        "success": True,
        "data": data,
        "timestamp": datetime.now().isoformat()
    }
    
    if message:
        response["message"] = message
    
    return response


def create_error_response(message: str, error_code: str = "ERROR", details: Dict = None) -> Dict[str, Any]:
    """
    Create standardized error response.
    
    Args:
        message: Error message
        error_code: Error code
        details: Additional error details
        
    Returns:
        Standardized error response
    """
    response = {
        "success": False,
        "error": {
            "message": message,
            "code": error_code,
            "timestamp": datetime.now().isoformat()
        }
    }
    
    if details:
        response["error"]["details"] = details
    
    return response