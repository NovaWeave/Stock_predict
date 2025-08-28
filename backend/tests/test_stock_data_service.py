"""
Unit Tests for Stock Data Service

Tests the stock data fetching functionality including Yahoo Finance,
Finnhub API integration, mock data generation, and error handling.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os
import pandas as pd
from datetime import datetime, timedelta

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.stock_data import StockDataService
from utils.error_handling import DataSourceError


class TestStockDataService(unittest.TestCase):
    """Test cases for StockDataService"""
    
    def setUp(self):
        """Set up test fixtures before each test method"""
        with patch('services.stock_data.os.getenv') as mock_getenv:
            mock_getenv.return_value = 'test_api_key'
            with patch('services.stock_data.finnhub.Client'):
                self.service = StockDataService()
    
    def test_service_initialization(self):
        """Test service initialization"""
        self.assertEqual(self.service.get_name(), "Stock Data Service")
        self.assertTrue(self.service.is_available())
    
    @patch('services.stock_data.yf.Ticker')
    def test_get_yahoo_data_success(self, mock_ticker_class):
        """Test successful Yahoo Finance data retrieval"""
        # Mock successful Yahoo Finance response
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker
        
        # Create mock historical data
        dates = pd.date_range(start='2023-01-01', periods=30, freq='D')
        mock_hist = pd.DataFrame({
            'Close': [100 + i for i in range(30)],
            'Volume': [1000000 + i * 1000 for i in range(30)]
        }, index=dates)
        
        mock_ticker.history.return_value = mock_hist
        
        result = self.service._get_yahoo_data('AAPL', 30)
        
        self.assertTrue(result['success'])
        self.assertIn('data', result)
        self.assertIn('current_price', result['data'])
        self.assertIn('historical_data', result['data'])
        self.assertIn('technical_indicators', result['data'])
        
        # Verify Yahoo Finance was called correctly
        mock_ticker_class.assert_called_once_with('AAPL')
        mock_ticker.history.assert_called_once_with(period='30d', auto_adjust=True, actions=False)
    
    @patch('services.stock_data.yf.Ticker')
    def test_get_yahoo_data_empty_response(self, mock_ticker_class):
        """Test Yahoo Finance empty response"""
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker
        mock_ticker.history.return_value = pd.DataFrame()  # Empty DataFrame
        
        result = self.service._get_yahoo_data('INVALID', 30)
        
        self.assertFalse(result['success'])
        self.assertIn('error', result)
    
    @patch('services.stock_data.yf.Ticker')
    def test_get_yahoo_data_exception(self, mock_ticker_class):
        """Test Yahoo Finance exception handling"""
        mock_ticker_class.side_effect = Exception("Yahoo Finance error")
        
        result = self.service._get_yahoo_data('AAPL', 30)
        
        self.assertFalse(result['success'])
        self.assertIn('error', result)
    
    def test_calculate_technical_indicators(self):
        """Test technical indicators calculation"""
        # Create test data
        dates = pd.date_range(start='2023-01-01', periods=50, freq='D')
        test_df = pd.DataFrame({
            'Close': [100 + i * 0.5 for i in range(50)],
            'Volume': [1000000] * 50
        }, index=dates)
        
        result_df = self.service._calculate_technical_indicators(test_df)
        
        # Check that indicators were added
        self.assertIn('SMA_20', result_df.columns)
        self.assertIn('SMA_50', result_df.columns)
        self.assertIn('RSI', result_df.columns)
        self.assertIn('MACD', result_df.columns)
        self.assertIn('MACD_Signal', result_df.columns)
        
        # Check that calculations are reasonable
        self.assertFalse(result_df['SMA_20'].isna().all())
        self.assertFalse(result_df['RSI'].isna().all())
    
    def test_calculate_rsi(self):
        """Test RSI calculation"""
        # Create test price series with known pattern
        prices = pd.Series([100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 111, 110, 112, 114, 113])
        
        rsi = self.service._calculate_rsi(prices, period=10)
        
        # RSI should be between 0 and 100
        valid_rsi = rsi.dropna()
        self.assertTrue((valid_rsi >= 0).all())
        self.assertTrue((valid_rsi <= 100).all())
    
    def test_calculate_macd(self):
        """Test MACD calculation"""
        # Create test price series
        prices = pd.Series([100 + i * 0.1 for i in range(50)])
        
        macd, macd_signal = self.service._calculate_macd(prices)
        
        # Check that MACD and signal are calculated
        self.assertEqual(len(macd), len(prices))
        self.assertEqual(len(macd_signal), len(prices))
        
        # Should have some non-NaN values
        self.assertTrue(macd.notna().any())
        self.assertTrue(macd_signal.notna().any())
    
    def test_generate_mock_data(self):
        """Test mock data generation"""
        result = self.service._generate_mock_data('TEST', 30)
        
        self.assertTrue(result['success'])
        self.assertIn('data', result)
        
        data = result['data']
        self.assertIn('current_price', data)
        self.assertIn('price_change', data)
        self.assertIn('price_change_percent', data)
        self.assertIn('volume', data)
        self.assertIn('historical_data', data)
        self.assertIn('technical_indicators', data)
        
        # Validate historical data structure
        hist_data = data['historical_data']
        self.assertEqual(len(hist_data['dates']), 30)
        self.assertEqual(len(hist_data['prices']), 30)
        self.assertEqual(len(hist_data['volumes']), 30)
        
        # Validate price ranges are reasonable
        self.assertGreater(data['current_price'], 0)
        self.assertGreater(data['volume'], 0)
    
    @patch('services.stock_data.yf.Ticker')
    def test_get_stock_data_with_cache(self, mock_ticker_class):
        """Test stock data retrieval with caching"""
        # Mock successful Yahoo Finance response
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker
        
        dates = pd.date_range(start='2023-01-01', periods=30, freq='D')
        mock_hist = pd.DataFrame({
            'Close': [100 + i for i in range(30)],
            'Volume': [1000000] * 30
        }, index=dates)
        mock_ticker.history.return_value = mock_hist
        
        # First call
        result1 = self.service.get_stock_data('AAPL', 30)
        
        # Second call (should use cache)
        result2 = self.service.get_stock_data('AAPL', 30)
        
        # Both should succeed
        self.assertTrue(result1['success'])
        self.assertTrue(result2['success'])
        
        # Yahoo Finance should only be called once due to caching
        mock_ticker_class.assert_called_once()
    
    def test_get_stock_data_invalid_symbol(self):
        """Test stock data retrieval with invalid symbol"""
        # Mock all data sources to fail
        with patch.object(self.service, '_get_yahoo_data', return_value={'success': False}):
            with patch.object(self.service, '_get_finnhub_data', return_value={'success': False}):
                result = self.service.get_stock_data('', 30)
                
                # Should fall back to mock data
                self.assertTrue(result['success'])  # Mock data should work
    
    def test_finnhub_initialization_with_valid_key(self):
        """Test Finnhub client initialization with valid API key"""
        with patch('services.stock_data.os.getenv') as mock_getenv:
            mock_getenv.return_value = 'valid_api_key'
            with patch('services.stock_data.finnhub.Client') as mock_client:
                service = StockDataService()
                
                self.assertTrue(service.finnhub_enabled)
                mock_client.assert_called_once_with(api_key='valid_api_key')
    
    def test_finnhub_initialization_with_invalid_key(self):
        """Test Finnhub client initialization with invalid API key"""
        with patch('services.stock_data.os.getenv') as mock_getenv:
            mock_getenv.return_value = 'placeholder_finnhub_key'
            service = StockDataService()
            
            self.assertFalse(service.finnhub_enabled)
    
    def test_finnhub_initialization_with_exception(self):
        """Test Finnhub client initialization with exception"""
        with patch('services.stock_data.os.getenv') as mock_getenv:
            mock_getenv.return_value = 'valid_api_key'
            with patch('services.stock_data.finnhub.Client') as mock_client:
                mock_client.side_effect = Exception("API initialization failed")
                service = StockDataService()
                
                self.assertFalse(service.finnhub_enabled)
    
    def test_extract_technical_indicators(self):
        """Test technical indicators extraction"""
        # Create test DataFrame with indicators
        test_df = pd.DataFrame({
            'SMA_20': [100.5, 101.0, 101.5],
            'SMA_50': [99.0, 99.5, 100.0],
            'RSI': [55.0, 60.0, 65.0],
            'MACD': [0.5, 0.7, 0.9],
            'MACD_Signal': [0.3, 0.5, 0.7]
        })
        
        indicators = self.service._extract_technical_indicators(test_df)
        
        self.assertAlmostEqual(indicators['sma_20'], 101.5)
        self.assertAlmostEqual(indicators['sma_50'], 100.0)
        self.assertAlmostEqual(indicators['rsi'], 65.0)
        self.assertAlmostEqual(indicators['macd'], 0.9)
        self.assertAlmostEqual(indicators['macd_signal'], 0.7)
    
    def test_extract_technical_indicators_with_nan(self):
        """Test technical indicators extraction with NaN values"""
        import numpy as np
        
        # Create test DataFrame with NaN values
        test_df = pd.DataFrame({
            'SMA_20': [np.nan, np.nan, 101.5],
            'SMA_50': [np.nan, np.nan, np.nan],
            'RSI': [np.nan, 60.0, 65.0],
            'MACD': [np.nan, np.nan, np.nan],
            'MACD_Signal': [0.3, 0.5, 0.7]
        })
        
        indicators = self.service._extract_technical_indicators(test_df)
        
        self.assertAlmostEqual(indicators['sma_20'], 101.5)
        self.assertIsNone(indicators['sma_50'])
        self.assertAlmostEqual(indicators['rsi'], 65.0)
        self.assertIsNone(indicators['macd'])
        self.assertAlmostEqual(indicators['macd_signal'], 0.7)


class TestStockDataServiceIntegration(unittest.TestCase):
    """Integration tests for StockDataService"""
    
    def test_end_to_end_mock_data(self):
        """Test end-to-end functionality with mock data"""
        service = StockDataService(mock_data_enabled=True)
        
        result = service.get_stock_data('TEST_SYMBOL', 30)
        
        self.assertTrue(result['success'])
        self.assertIn('data', result)
        
        data = result['data']
        self.assertIsInstance(data['current_price'], (int, float))
        self.assertIsInstance(data['price_change'], (int, float))
        self.assertIsInstance(data['price_change_percent'], (int, float))
        self.assertIsInstance(data['volume'], int)
        self.assertIsInstance(data['historical_data'], dict)
        self.assertIsInstance(data['technical_indicators'], dict)


if __name__ == '__main__':
    unittest.main(verbosity=2)