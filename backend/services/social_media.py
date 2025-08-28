"""
Social Media Service Module

Handles fetching and processing social media data from Reddit and X (Twitter).
"""

import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from .base import BaseDataService
from utils.error_handling import DataSourceError

try:
    import praw
    PRAW_AVAILABLE = True
except ImportError:
    PRAW_AVAILABLE = False
    praw = None

try:
    import tweepy
    TWEEPY_AVAILABLE = True
except ImportError:
    TWEEPY_AVAILABLE = False
    tweepy = None


class SocialMediaService(BaseDataService):
    """
    Service for fetching social media data from Reddit and X (Twitter).
    
    Supports multiple platforms.
    """
    
    def __init__(self):
        super().__init__("social_media")
        self._init_reddit_client()
        self._init_x_client()
    
    def _init_reddit_client(self) -> None:
        """Initialize Reddit API client"""
        try:
            if not PRAW_AVAILABLE:
                self.reddit = None
                self.reddit_enabled = False
                self.logger.warning("PRAW library not available")
                return
                
            client_id = os.getenv("REDDIT_CLIENT_ID", "placeholder")
            client_secret = os.getenv("REDDIT_CLIENT_SECRET", "placeholder")
            user_agent = os.getenv("REDDIT_USER_AGENT", "StockSentimentBot/1.0")
            
            if (client_id and client_id != "placeholder" and 
                client_secret and client_secret != "placeholder" and
                praw is not None):
                
                self.reddit = praw.Reddit(
                    client_id=client_id,
                    client_secret=client_secret,
                    user_agent=user_agent
                )
                self.reddit_enabled = True
                self.logger.info("Reddit API client initialized")
            else:
                self.reddit = None
                self.reddit_enabled = False
                self.logger.warning("Reddit API credentials not configured")
                
        except Exception as e:
            self.reddit = None
            self.reddit_enabled = False
            self.logger.error(f"Failed to initialize Reddit client: {e}")
    
    def _init_x_client(self) -> None:
        """Initialize X (Twitter) API client"""
        try:
            if not TWEEPY_AVAILABLE:
                self.x_client = None
                self.x_enabled = False
                self.logger.warning("Tweepy library not available")
                return
                
            bearer_token = os.getenv('X_BEARER_TOKEN', 'placeholder')
            api_key = os.getenv('X_API_KEY', 'placeholder')
            api_secret = os.getenv('X_API_SECRET', 'placeholder')
            access_token = os.getenv('X_ACCESS_TOKEN', 'placeholder')
            access_token_secret = os.getenv('X_ACCESS_TOKEN_SECRET', 'placeholder')
            
            if (bearer_token and bearer_token != 'placeholder' and
                api_key and api_key != 'placeholder' and
                tweepy is not None):
                
                self.x_client = tweepy.Client(
                    bearer_token=bearer_token,
                    consumer_key=api_key,
                    consumer_secret=api_secret,
                    access_token=access_token,
                    access_token_secret=access_token_secret,
                    wait_on_rate_limit=True
                )
                self.x_enabled = True
                self.logger.info("X API client initialized")
            else:
                self.x_client = None
                self.x_enabled = False
                self.logger.warning("X API credentials not configured")
                
        except Exception as e:
            self.x_client = None
            self.x_enabled = False
            self.logger.error(f"Failed to initialize X client: {e}")
    
    def is_available(self) -> bool:
        """Check if at least one social media platform is available"""
        return self.reddit_enabled or self.x_enabled
    
    def get_name(self) -> str:
        return "Social Media Service"
    
    def get_reddit_posts(self, stock_symbol: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch Reddit posts about a stock symbol.
        
        Args:
            stock_symbol: Stock symbol to search for
            limit: Maximum number of posts to fetch
            
        Returns:
            List of Reddit posts data
        """
        cache_key = f"reddit_posts_{stock_symbol}_{limit}"
        cached_data = self._get_from_cache(cache_key)
        if cached_data is not None:
            return cached_data
        
        try:
            if not self.reddit_enabled:
                self.logger.warning("Reddit API not available")
                return []
            
            posts = self._fetch_reddit_posts(stock_symbol, limit)
            
            self._set_cache(cache_key, posts)
            return posts
            
        except Exception as e:
            self.logger.error(f"Error fetching Reddit posts for {stock_symbol}: {e}")
            return []
    
    def _fetch_reddit_posts(self, stock_symbol: str, limit: int) -> List[Dict[str, Any]]:
        """Fetch posts from Reddit API"""
        subreddit_query = 'stocks+investing+wallstreetbets'
        search_query = f"{stock_symbol} stock"
        posts = []
        
        try:
            for post in self.reddit.subreddit(subreddit_query).search(
                search_query, limit=min(limit, 20), time_filter='week'
            ):
                posts.append({
                    "title": post.title,
                    "text": post.selftext,
                    "score": post.score,
                    "created_utc": datetime.fromtimestamp(post.created_utc),
                    "url": f"https://reddit.com{post.permalink}",
                    "author": str(post.author),
                    "subreddit": str(post.subreddit)
                })
                
            self.logger.info(f"Fetched {len(posts)} Reddit posts for {stock_symbol}")
            return posts
            
        except Exception as e:
            self.logger.error(f"Error in Reddit API request: {e}")
            raise
    
    def get_x_posts(self, stock_symbol: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch X (Twitter) posts about a stock symbol.
        
        Args:
            stock_symbol: Stock symbol to search for
            limit: Maximum number of posts to fetch
            
        Returns:
            List of X posts data
        """
        cache_key = f"x_posts_{stock_symbol}_{limit}"
        cached_data = self._get_from_cache(cache_key)
        if cached_data is not None:
            return cached_data
        
        try:
            # X API not configured
            self.logger.info("X API not configured")
            return []
            
        except Exception as e:
            self.logger.error(f"Error fetching X posts for {stock_symbol}: {e}")
            return []
    

    
