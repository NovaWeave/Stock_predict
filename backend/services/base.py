"""
Base Data Service Module

This module provides a base class for all data services with common functionality
including error handling, logging, and caching.
"""

import logging
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from utils.error_handling import DataSourceError, ErrorContext


class BaseDataService(ABC):
    """
    Abstract base class for all data services.
    
    Provides common functionality like logging, error handling,
    and caching mechanisms.
    """
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"services.{name}")
        self.cache: Dict[str, tuple[float, Any]] = {}
        self.cache_duration = 300  # 5 minutes default
        
    def _get_from_cache(self, key: str) -> Optional[Any]:
        """Get data from cache if available and not expired"""
        if key in self.cache:
            timestamp, data = self.cache[key]
            if datetime.now().timestamp() - timestamp < self.cache_duration:
                self.logger.debug(f"Cache hit for key: {key}")
                return data
            else:
                # Remove expired entry
                del self.cache[key]
                self.logger.debug(f"Cache expired for key: {key}")
        return None
    
    def _set_cache(self, key: str, data: Any) -> None:
        """Store data in cache with timestamp"""
        self.cache[key] = (datetime.now().timestamp(), data)
        self.logger.debug(f"Cached data for key: {key}")
    
    def _handle_error(self, error: Exception, context: str) -> None:
        """Standardized error handling"""
        self.logger.error(f"Error in {context}: {str(error)}", exc_info=True)
        raise DataSourceError(f"{self.name} service error in {context}: {str(error)}", self.name)
    
    def error_context(self, operation: str) -> ErrorContext:
        """Create error context for operations"""
        return ErrorContext(f"{self.name}.{operation}", self.logger)
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if the service is available"""
        pass
    
    @abstractmethod
    def get_name(self) -> str:
        """Get service name"""
        pass