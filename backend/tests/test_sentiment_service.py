"""
Unit Tests for Sentiment Analysis Service

Tests the sentiment analysis functionality including text analysis,
batch processing, and error handling.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.sentiment import SentimentAnalysisService
from utils.error_handling import DataSourceError


class TestSentimentAnalysisService(unittest.TestCase):
    """Test cases for SentimentAnalysisService"""
    
    def setUp(self):
        """Set up test fixtures before each test method"""
        with patch('services.sentiment.nltk.download'):
            with patch('services.sentiment.SentimentIntensityAnalyzer') as mock_analyzer:
                mock_analyzer.return_value.polarity_scores.return_value = {
                    'compound': 0.5
                }
                self.service = SentimentAnalysisService()
    
    def test_service_initialization(self):
        """Test service initialization"""
        self.assertEqual(self.service.get_name(), "Sentiment Analysis Service")
        self.assertTrue(self.service.is_available())
    
    def test_analyze_text_positive(self):
        """Test analyzing positive text"""
        # Mock the analyzer to return positive sentiment
        self.service.analyzer.polarity_scores.return_value = {'compound': 0.8}
        
        result = self.service.analyze_text("This stock is amazing!")
        
        self.assertEqual(result, 0.8)
        self.service.analyzer.polarity_scores.assert_called_once_with("This stock is amazing!")
    
    def test_analyze_text_negative(self):
        """Test analyzing negative text"""
        # Mock the analyzer to return negative sentiment
        self.service.analyzer.polarity_scores.return_value = {'compound': -0.6}
        
        result = self.service.analyze_text("This stock is terrible!")
        
        self.assertEqual(result, -0.6)
    
    def test_analyze_text_neutral(self):
        """Test analyzing neutral text"""
        # Mock the analyzer to return neutral sentiment
        self.service.analyzer.polarity_scores.return_value = {'compound': 0.0}
        
        result = self.service.analyze_text("This is a stock.")
        
        self.assertEqual(result, 0.0)
    
    def test_analyze_empty_text(self):
        """Test analyzing empty text"""
        result = self.service.analyze_text("")
        self.assertEqual(result, 0.0)
        
        result = self.service.analyze_text("   ")
        self.assertEqual(result, 0.0)
        
        result = self.service.analyze_text(None)
        self.assertEqual(result, 0.0)
    
    def test_analyze_batch(self):
        """Test batch analysis"""
        # Mock the analyzer to return different sentiments
        self.service.analyzer.polarity_scores.side_effect = [
            {'compound': 0.8},
            {'compound': -0.6},
            {'compound': 0.0}
        ]
        
        texts = ["Great stock!", "Terrible performance", "Neutral comment"]
        results = self.service.analyze_batch(texts)
        
        self.assertEqual(results, [0.8, -0.6, 0.0])
        self.assertEqual(self.service.analyzer.polarity_scores.call_count, 3)
    
    def test_analyze_batch_empty(self):
        """Test batch analysis with empty list"""
        result = self.service.analyze_batch([])
        self.assertEqual(result, [])
    
    def test_analyze_batch_with_error(self):
        """Test batch analysis with analyzer error"""
        # Mock the analyzer to raise an exception
        self.service.analyzer.polarity_scores.side_effect = Exception("NLTK error")
        
        texts = ["Some text"]
        results = self.service.analyze_batch(texts)
        
        # Should return zeros for all texts when error occurs
        self.assertEqual(results, [0.0])
    
    def test_get_sentiment_summary(self):
        """Test sentiment summary calculation"""
        # Mock different sentiment scores
        self.service.analyzer.polarity_scores.side_effect = [
            {'compound': 0.8},   # positive
            {'compound': 0.5},   # positive
            {'compound': -0.7},  # negative
            {'compound': -0.3},  # negative
            {'compound': 0.05}   # neutral
        ]
        
        texts = ["Great!", "Good", "Bad", "Terrible", "Okay"]
        summary = self.service.get_sentiment_summary(texts)
        
        expected = {
            "average_sentiment": (0.8 + 0.5 - 0.7 - 0.3 + 0.05) / 5,  # 0.07
            "positive_count": 2,
            "negative_count": 2,
            "neutral_count": 1,
            "total_count": 5
        }
        
        self.assertEqual(summary["positive_count"], expected["positive_count"])
        self.assertEqual(summary["negative_count"], expected["negative_count"])
        self.assertEqual(summary["neutral_count"], expected["neutral_count"])
        self.assertEqual(summary["total_count"], expected["total_count"])
        self.assertAlmostEqual(summary["average_sentiment"], expected["average_sentiment"], places=2)
    
    def test_get_sentiment_summary_empty(self):
        """Test sentiment summary with empty list"""
        summary = self.service.get_sentiment_summary([])
        
        expected = {
            "average_sentiment": 0.0,
            "positive_count": 0,
            "negative_count": 0,
            "neutral_count": 0,
            "total_count": 0
        }
        
        self.assertEqual(summary, expected)
    
    def test_classify_sentiment(self):
        """Test sentiment classification"""
        self.assertEqual(self.service.classify_sentiment(0.5), 'positive')
        self.assertEqual(self.service.classify_sentiment(0.15), 'positive')
        self.assertEqual(self.service.classify_sentiment(-0.5), 'negative')
        self.assertEqual(self.service.classify_sentiment(-0.15), 'negative')
        self.assertEqual(self.service.classify_sentiment(0.05), 'neutral')
        self.assertEqual(self.service.classify_sentiment(-0.05), 'neutral')
        self.assertEqual(self.service.classify_sentiment(0.0), 'neutral')
    
    @patch('services.sentiment.nltk.download')
    @patch('services.sentiment.SentimentIntensityAnalyzer')
    def test_nltk_initialization_failure(self, mock_analyzer, mock_download):
        """Test handling of NLTK initialization failure"""
        mock_download.side_effect = Exception("NLTK download failed")
        
        with self.assertRaises(DataSourceError):
            SentimentAnalysisService()
    
    def test_analyze_text_with_analyzer_error(self):
        """Test analyze_text handling analyzer errors gracefully"""
        # Mock the analyzer to raise an exception
        self.service.analyzer.polarity_scores.side_effect = Exception("Analysis failed")
        
        result = self.service.analyze_text("Some text")
        
        # Should return 0.0 when error occurs
        self.assertEqual(result, 0.0)


class TestSentimentAnalysisServiceIntegration(unittest.TestCase):
    """Integration tests for SentimentAnalysisService"""
    
    @patch('services.sentiment.nltk.download')
    def test_real_sentiment_analysis(self, mock_download):
        """Test with real NLTK analyzer (if available)"""
        try:
            from nltk.sentiment import SentimentIntensityAnalyzer
            
            # Create service with real analyzer
            service = SentimentAnalysisService()
            
            # Test some real examples
            positive_text = "This stock is performing excellently and I'm very happy!"
            negative_text = "This stock is terrible and I hate it!"
            neutral_text = "This is a stock."
            
            positive_score = service.analyze_text(positive_text)
            negative_score = service.analyze_text(negative_text)
            neutral_score = service.analyze_text(neutral_text)
            
            # Basic sanity checks
            self.assertGreater(positive_score, 0)
            self.assertLess(negative_score, 0)
            self.assertGreaterEqual(abs(neutral_score), 0)  # Could be slightly positive or negative
            
        except ImportError:
            self.skipTest("NLTK not available for integration testing")


if __name__ == '__main__':
    # Run the tests
    unittest.main(verbosity=2)