"""
Unit Tests for Error Handling Utilities

Tests the custom exception classes, error context manager,
and error response formatting utilities.
"""

import unittest
from unittest.mock import Mock, patch
import sys
import os
import logging

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils.error_handling import (
    StockSentimentError, APIError, DataSourceError, ValidationError, RateLimitError,
    validate_stock_symbol, validate_limit, setup_logging
)


class TestCustomExceptions(unittest.TestCase):
    """Test cases for custom exception classes"""
    
    def test_stock_sentiment_error(self):
        """Test StockSentimentError exception"""
        error = StockSentimentError("Test error message")
        self.assertEqual(str(error), "Test error message")
        self.assertEqual(error.message, "Test error message")
        self.assertEqual(error.error_code, "GENERAL_ERROR")
        self.assertEqual(error.status_code, 500)
        self.assertIsInstance(error, Exception)
    
    def test_api_error_with_status_code(self):
        """Test APIError with status code"""
        error = APIError("API failed", 404)
        self.assertEqual(str(error), "API failed")
        self.assertEqual(error.message, "API failed")
        self.assertEqual(error.error_code, "API_ERROR")
        self.assertEqual(error.status_code, 404)
    
    def test_api_error_default_status_code(self):
        """Test APIError with default status code"""
        error = APIError("API failed")
        self.assertEqual(str(error), "API failed")
        self.assertEqual(error.status_code, 400)  # Default
    
    def test_data_source_error(self):
        """Test DataSourceError"""
        error = DataSourceError("Data fetch failed", "yahoo_finance")
        self.assertEqual(str(error), "Data fetch failed")
        self.assertEqual(error.source, "yahoo_finance")
        self.assertEqual(error.error_code, "DATA_SOURCE_ERROR_YAHOO_FINANCE")
        self.assertEqual(error.status_code, 503)
    
    def test_validation_error(self):
        """Test ValidationError"""
        error = ValidationError("Invalid stock symbol", "stock_symbol")
        self.assertEqual(str(error), "Invalid stock symbol")
        self.assertEqual(error.field, "stock_symbol")
        self.assertEqual(error.error_code, "VALIDATION_ERROR")
        self.assertEqual(error.status_code, 400)
    
    def test_rate_limit_error(self):
        """Test RateLimitError"""
        error = RateLimitError()
        self.assertEqual(str(error), "Rate limit exceeded")
        self.assertEqual(error.error_code, "RATE_LIMIT_ERROR")
        self.assertEqual(error.status_code, 429)
        
        # Test with custom message
        error_custom = RateLimitError("API quota exceeded")
        self.assertEqual(str(error_custom), "API quota exceeded")


class TestValidationFunctions(unittest.TestCase):
    """Test cases for validation functions"""
    
    def test_validate_stock_symbol_valid(self):
        """Test validation of valid stock symbols"""
        self.assertEqual(validate_stock_symbol("AAPL"), "AAPL")
        self.assertEqual(validate_stock_symbol("  tsla  "), "TSLA")
        self.assertEqual(validate_stock_symbol("msft"), "MSFT")
        self.assertEqual(validate_stock_symbol("ABC123"), "ABC123")
    
    def test_validate_stock_symbol_invalid(self):
        """Test validation of invalid stock symbols"""
        with self.assertRaises(ValidationError) as cm:
            validate_stock_symbol("")
        self.assertEqual(cm.exception.field, "symbol")
        
        with self.assertRaises(ValidationError) as cm:
            validate_stock_symbol("TOOLONGSTOCKSYMBOL")
        self.assertEqual(cm.exception.field, "symbol")
        
        with self.assertRaises(ValidationError) as cm:
            validate_stock_symbol("ABC-DEF")  # Non-alphanumeric
        self.assertEqual(cm.exception.field, "symbol")
        
        with self.assertRaises(ValidationError) as cm:
            validate_stock_symbol(None)
        self.assertEqual(cm.exception.field, "symbol")
    
    def test_validate_limit_valid(self):
        """Test validation of valid limit values"""
        self.assertEqual(validate_limit(10), 10)
        self.assertEqual(validate_limit(50), 50)
        self.assertEqual(validate_limit(100), 100)
        self.assertEqual(validate_limit(None), 50)  # Default
    
    def test_validate_limit_invalid(self):
        """Test validation of invalid limit values"""
        with self.assertRaises(ValidationError) as cm:
            validate_limit(0)
        self.assertEqual(cm.exception.field, "limit")
        
        with self.assertRaises(ValidationError) as cm:
            validate_limit(-5)
        self.assertEqual(cm.exception.field, "limit")
        
        with self.assertRaises(ValidationError) as cm:
            validate_limit(150)  # Exceeds max
        self.assertEqual(cm.exception.field, "limit")
    
    def test_validate_limit_custom_max(self):
        """Test validation with custom maximum limit"""
        self.assertEqual(validate_limit(200, max_limit=300), 200)
        
        with self.assertRaises(ValidationError):
            validate_limit(200, max_limit=100)


class TestLoggingSetup(unittest.TestCase):
    """Test cases for logging configuration"""
    
    def test_setup_logging_default(self):
        """Test default logging setup"""
        logger = setup_logging()
        self.assertIsInstance(logger, logging.Logger)
        self.assertEqual(logger.name, "stock_sentiment")
        self.assertEqual(logger.level, logging.INFO)
    
    def test_setup_logging_custom(self):
        """Test custom logging setup"""
        logger = setup_logging("test_app", "DEBUG")
        self.assertEqual(logger.name, "test_app")
        self.assertEqual(logger.level, logging.DEBUG)
    
    def test_setup_logging_invalid_level(self):
        """Test logging setup with invalid level"""
        logger = setup_logging("test_app", "INVALID")
        self.assertEqual(logger.level, logging.INFO)  # Should fall back to INFO


if __name__ == "__main__":
    unittest.main()