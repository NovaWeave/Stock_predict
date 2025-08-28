"""
Unit Tests for Social Media Service

Tests the social media data fetching functionality including Reddit and X integration,
mock data generation, and error handling.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.social_media import SocialMediaService
from utils.error_handling import DataSourceError


class TestSocialMediaService(unittest.TestCase):
    """Test cases for SocialMediaService"""
    
    def setUp(self):
        """Set up test fixtures before each test method"""
        self.service = SocialMediaService()
    
    def test_service_initialization(self):
        """Test service initialization"""
        self.assertEqual(self.service.get_name(), "Social Media Service")
        # Should not be available as no API credentials are configured
        self.assertFalse(self.service.is_available())
    
    def test_service_initialization_without_apis(self):
        """Test service initialization without APIs"""
        service = SocialMediaService()
        self.assertEqual(service.get_name(), "Social Media Service")
        # Should not be available as no API credentials
        self.assertFalse(service.is_available())
    
    def test_get_reddit_posts_no_api(self):
        """Test fetching Reddit posts without API configured"""
        posts = self.service.get_reddit_posts("AAPL", limit=5)
        
        self.assertIsInstance(posts, list)
        self.assertEqual(len(posts), 0)  # No posts without API
    
    def test_get_reddit_posts_zero_limit(self):
        """Test fetching Reddit posts with zero limit"""
        posts = self.service.get_reddit_posts("AAPL", limit=0)
        self.assertEqual(posts, [])
    
    def test_get_reddit_posts_negative_limit(self):
        """Test fetching Reddit posts with negative limit"""
        posts = self.service.get_reddit_posts("AAPL", limit=-5)
        self.assertEqual(posts, [])
    
    def test_get_x_posts_no_api(self):
        """Test fetching X posts without API configured"""
        posts = self.service.get_x_posts("AAPL", limit=3)
        
        self.assertIsInstance(posts, list)
        self.assertEqual(len(posts), 0)  # No posts without API
    
    def test_get_x_posts_zero_limit(self):
        """Test fetching X posts with zero limit"""
        posts = self.service.get_x_posts("AAPL", limit=0)
        self.assertEqual(posts, [])
    
    def test_get_x_posts_negative_limit(self):
        """Test fetching X posts with negative limit"""
        posts = self.service.get_x_posts("AAPL", limit=-3)
        self.assertEqual(posts, [])
    

    
    def test_reddit_client_not_initialized(self):
        """Test Reddit functionality when client is not initialized"""
        service = SocialMediaService()
        service.reddit_enabled = False
        
        posts = service.get_reddit_posts("AAPL", limit=5)
        
        # Should return empty list when Reddit is disabled
        self.assertEqual(posts, [])
    
    def test_x_client_not_initialized(self):
        """Test X functionality when client is not initialized"""
        service = SocialMediaService()
        service.x_enabled = False
        
        posts = service.get_x_posts("AAPL", limit=5)
        
        # Should return empty list when X is disabled
        self.assertEqual(posts, [])


class TestSocialMediaServiceIntegration(unittest.TestCase):
    """Integration tests for SocialMediaService"""
    
    def test_combined_social_media_data(self):
        """Test fetching combined social media data"""
        service = SocialMediaService()
        
        reddit_posts = service.get_reddit_posts("GOOGL", limit=3)
        x_posts = service.get_x_posts("GOOGL", limit=2)
        
        # Without API keys, both should return empty lists
        self.assertEqual(len(reddit_posts), 0)
        self.assertEqual(len(x_posts), 0)
    
    def test_service_with_different_symbols(self):
        """Test service with various stock symbols"""
        service = SocialMediaService()
        
        symbols = ["AAPL", "TSLA", "MSFT", "AMZN", "NVDA"]
        
        for symbol in symbols:
            reddit_posts = service.get_reddit_posts(symbol, limit=2)
            x_posts = service.get_x_posts(symbol, limit=2)
            
            # Without API keys, should return empty lists
            self.assertEqual(len(reddit_posts), 0)
            self.assertEqual(len(x_posts), 0)


if __name__ == "__main__":
    unittest.main()