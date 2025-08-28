"""
Sentiment Analysis Service Module

Handles sentiment analysis using NLTK VADER and provides
text processing utilities for social media and news content.
"""

import logging
from typing import Dict, List, Union

import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

from .base import BaseDataService
from utils.error_handling import DataSourceError


class SentimentAnalysisService(BaseDataService):
    """
    Service for analyzing sentiment of text content.
    
    Uses NLTK's VADER (Valence Aware Dictionary and sEntiment Reasoner)
    sentiment analysis tool optimized for social media text.
    """
    
    def __init__(self):
        super().__init__("sentiment_analysis")
        self._init_nltk()
    
    def _init_nltk(self) -> None:
        """Initialize NLTK components"""
        try:
            # Download required NLTK data
            nltk.download('vader_lexicon', quiet=True)
            self.analyzer = SentimentIntensityAnalyzer()
            self.logger.info("NLTK VADER sentiment analyzer initialized")
        except Exception as e:
            self.logger.error(f"Failed to initialize NLTK: {e}")
            raise DataSourceError(f"Failed to initialize sentiment analyzer: {e}", "NLTK")
    
    def is_available(self) -> bool:
        """Check if sentiment analyzer is available"""
        return hasattr(self, 'analyzer') and self.analyzer is not None
    
    def get_name(self) -> str:
        return "Sentiment Analysis Service"
    
    def analyze_text(self, text: str) -> float:
        """
        Analyze sentiment of a single text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Compound sentiment score between -1 (negative) and 1 (positive)
        """
        if not text or not text.strip():
            return 0.0
        
        try:
            scores = self.analyzer.polarity_scores(text.strip())
            return scores['compound']
        except Exception as e:
            self.logger.error(f"Error analyzing text sentiment: {e}")
            return 0.0
    
    def analyze_batch(self, texts: List[str]) -> List[float]:
        """
        Analyze sentiment of multiple texts.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of sentiment scores
        """
        if not texts:
            return []
        
        try:
            scores = []
            for text in texts:
                score = self.analyze_text(text)
                scores.append(score)
            
            self.logger.debug(f"Analyzed {len(texts)} texts")
            return scores
        except Exception as e:
            self.logger.error(f"Error in batch sentiment analysis: {e}")
            return [0.0] * len(texts)
    
    def get_sentiment_summary(self, texts: List[str]) -> Dict[str, Union[float, int]]:
        """
        Get sentiment summary statistics for a list of texts.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            Dictionary with sentiment statistics
        """
        if not texts:
            return {
                "average_sentiment": 0.0,
                "positive_count": 0,
                "negative_count": 0,
                "neutral_count": 0,
                "total_count": 0
            }
        
        try:
            scores = self.analyze_batch(texts)
            
            positive_count = sum(1 for score in scores if score > 0.1)
            negative_count = sum(1 for score in scores if score < -0.1)
            neutral_count = len(scores) - positive_count - negative_count
            average_sentiment = sum(scores) / len(scores) if scores else 0.0
            
            return {
                "average_sentiment": average_sentiment,
                "positive_count": positive_count,
                "negative_count": negative_count,
                "neutral_count": neutral_count,
                "total_count": len(scores)
            }
        except Exception as e:
            self.logger.error(f"Error calculating sentiment summary: {e}")
            return {
                "average_sentiment": 0.0,
                "positive_count": 0,
                "negative_count": 0,
                "neutral_count": 0,
                "total_count": len(texts)
            }
    
    def classify_sentiment(self, score: float) -> str:
        """
        Classify sentiment score into categories.
        
        Args:
            score: Sentiment score between -1 and 1
            
        Returns:
            Sentiment classification: 'positive', 'negative', or 'neutral'
        """
        if score > 0.1:
            return 'positive'
        elif score < -0.1:
            return 'negative'
        else:
            return 'neutral'