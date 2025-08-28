"""
Stock Data Service Module

Handles fetching and processing stock market data from multiple sources
including Yahoo Finance and Finnhub API.
"""

import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

try:
    import finnhub
except ImportError:
    finnhub = None

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    import yfinance as yf
except ImportError:
    yf = None

from .base import BaseDataService
from utils.error_handling import DataSourceError


class StockDataService(BaseDataService):
    """
    Service for fetching stock market data and technical indicators.
    
    Supports multiple data sources with automatic fallback:
    - Yahoo Finance (primary)
    - Finnhub API (secondary)
    """
    
    def __init__(self):
        super().__init__("stock_data")
        self._init_finnhub_client()
    
    def _init_finnhub_client(self) -> None:
        """Initialize Finnhub API client"""
        try:
            api_key = os.getenv('FINNHUB_API_KEY', 'placeholder_finnhub_key')
            if api_key and api_key not in ['placeholder_finnhub_key', 'placeholder', 'your_finnhub_api_key_here']:
                self.finnhub_client = finnhub.Client(api_key=api_key)
                self.finnhub_enabled = True
                self.logger.info("Finnhub client initialized successfully")
            else:
                self.finnhub_client = None
                self.finnhub_enabled = False
                self.logger.warning("Finnhub API key not configured, service disabled")
        except Exception as e:
            self.finnhub_client = None
            self.finnhub_enabled = False
            self.logger.error(f"Failed to initialize Finnhub client: {e}")
    
    def is_available(self) -> bool:
        """Check if at least one data source is available"""
        return True  # Yahoo Finance is always available as fallback
    
    def get_name(self) -> str:
        return "Stock Data Service"
    
    def get_stock_data(self, symbol: str, days: int = 30) -> Dict[str, Any]:
        """
        Get comprehensive stock data including technical indicators.
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
            days: Number of days of historical data
            
        Returns:
            Dictionary containing stock data and technical indicators
        """
        cache_key = f"stock_data_{symbol}_{days}"
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data
        
        try:
            self.logger.info(f"Fetching stock data for {symbol}")
            
            # Try Yahoo Finance first
            yahoo_data = self._get_yahoo_data(symbol, days)
            if yahoo_data and yahoo_data.get('success'):
                self._set_cache(cache_key, yahoo_data)
                return yahoo_data
            
            # Fallback to Finnhub
            self.logger.info(f"Yahoo Finance failed, trying Finnhub for {symbol}")
            finnhub_data = self._get_finnhub_data(symbol, days)
            if finnhub_data and finnhub_data.get('success'):
                self._set_cache(cache_key, finnhub_data)
                return finnhub_data
            
            return {"success": False, "error": "No data sources available"}
            
        except Exception as e:
            self._handle_error(e, f"get_stock_data for {symbol}")
    
    def _get_yahoo_data(self, symbol: str, days: int) -> Dict[str, Any]:
        """Fetch data from Yahoo Finance"""
        if yf is None:
            return {"success": False, "error": "yfinance not available"}
            
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period=f"{days}d", auto_adjust=True, actions=False)
            
            if hist.empty:
                self.logger.warning(f"No Yahoo Finance data for {symbol}")
                return {"success": False, "error": "No data available"}
            
            return self._process_yahoo_data(hist)
            
        except Exception as e:
            self.logger.error(f"Yahoo Finance error for {symbol}: {e}")
            return {"success": False, "error": str(e)}
    
    def _process_yahoo_data(self, hist: pd.DataFrame) -> Dict[str, Any]:
        """Process Yahoo Finance data and calculate technical indicators"""
        try:
            # Ensure proper column names and index
            if 'Close' not in hist.columns and 'close' in hist.columns:
                hist = hist.rename(columns={'close': 'Close'})
            if not hasattr(hist.index, 'strftime'):
                hist.index = pd.to_datetime(hist.index)
            
            # Calculate technical indicators
            hist = self._calculate_technical_indicators(hist)
            
            current_price = float(hist['Close'].iloc[-1])
            previous_price = float(hist['Close'].iloc[-2]) if len(hist) > 1 else current_price
            price_change = current_price - previous_price
            price_change_percent = (price_change / previous_price) * 100 if previous_price != 0 else 0
            
            return {
                "success": True,
                "data": {
                    "current_price": current_price,
                    "price_change": price_change,
                    "price_change_percent": price_change_percent,
                    "volume": int(hist['Volume'].iloc[-1]),
                    "historical_data": {
                        "dates": [d.strftime('%Y-%m-%d') for d in hist.index],
                        "prices": hist['Close'].tolist(),
                        "volumes": hist['Volume'].tolist()
                    },
                    "technical_indicators": self._extract_technical_indicators(hist)
                }
            }
        except Exception as e:
            self.logger.error(f"Error processing Yahoo data: {e}")
            return {"success": False, "error": str(e)}
    
    def _get_finnhub_data(self, symbol: str, days: int) -> Dict[str, Any]:
        """Fetch data from Finnhub API"""
        if not self.finnhub_enabled or finnhub is None:
            return {"success": False, "error": "Finnhub not available"}
        
        if self.finnhub_client is None:
            return {"success": False, "error": "Finnhub client not initialized"}
            
        try:
            # Get current quote
            quote = self.finnhub_client.quote(symbol=symbol)
            if not quote or 'c' not in quote:
                return {"success": False, "error": "No quote data available"}
            
            current_price = quote['c']
            
            # Get historical data
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            candles = self.finnhub_client.stock_candles(
                symbol=symbol,
                resolution='D',
                _from=int(start_date.timestamp()),
                to=int(end_date.timestamp())
            )
            
            if not candles or candles.get('s') != 'ok':
                return {"success": False, "error": "No historical data available"}
            
            return self._process_finnhub_data(candles, current_price)
            
        except Exception as e:
            self.logger.error(f"Finnhub error for {symbol}: {e}")
            return {"success": False, "error": str(e)}
    
    def _process_finnhub_data(self, candles: Dict, current_price: float) -> Dict[str, Any]:
        """Process Finnhub data and calculate indicators"""
        try:
            closes = candles.get('c', [])
            volumes = candles.get('v', [])
            timestamps = candles.get('t', [])
            
            if not closes:
                return {"success": False, "error": "No price data"}
            
            # Create DataFrame for technical indicators
            hist_df = pd.DataFrame({
                'Close': closes,
                'Volume': volumes
            })
            
            hist_df = self._calculate_technical_indicators(hist_df)
            
            price_change = current_price - closes[-2] if len(closes) > 1 else 0
            price_change_percent = (price_change / closes[-2]) * 100 if len(closes) > 1 else 0
            
            dates = [datetime.fromtimestamp(ts).strftime('%Y-%m-%d') for ts in timestamps]
            
            return {
                "success": True,
                "data": {
                    "current_price": current_price,
                    "price_change": price_change,
                    "price_change_percent": price_change_percent,
                    "volume": int(volumes[-1]) if volumes else 0,
                    "historical_data": {
                        "dates": dates,
                        "prices": closes,
                        "volumes": volumes
                    },
                    "technical_indicators": self._extract_technical_indicators(hist_df)
                }
            }
        except Exception as e:
            self.logger.error(f"Error processing Finnhub data: {e}")
            return {"success": False, "error": str(e)}
    
    def _calculate_technical_indicators(self, df) -> Any:  # Type Any for pandas DataFrame
        """Calculate technical indicators for the DataFrame"""
        if pd is None:
            return df
            
        try:
            # Moving averages
            df['SMA_20'] = df['Close'].rolling(window=min(20, len(df))).mean()
            df['SMA_50'] = df['Close'].rolling(window=min(50, len(df))).mean()
            
            # RSI
            df['RSI'] = self._calculate_rsi(df['Close'])
            
            # MACD
            df['MACD'], df['MACD_Signal'] = self._calculate_macd(df['Close'])
            
            return df
        except Exception as e:
            self.logger.error(f"Error calculating technical indicators: {e}")
            return df
    
    def _calculate_rsi(self, prices, period: int = 14):  # Flexible type for pandas Series
        """Calculate RSI (Relative Strength Index)"""
        if pd is None:
            return None
            
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
    
    def _calculate_macd(self, prices, fast: int = 12, slow: int = 26, signal: int = 9):  # Flexible type
        """Calculate MACD (Moving Average Convergence Divergence)"""
        if pd is None:
            return None, None
            
        ema_fast = prices.ewm(span=fast).mean()
        ema_slow = prices.ewm(span=slow).mean()
        macd = ema_fast - ema_slow
        macd_signal = macd.ewm(span=signal).mean()
        return macd, macd_signal
    
    def _extract_technical_indicators(self, df) -> Dict[str, Any]:  # Flexible type
        """Extract technical indicators from DataFrame"""
        if pd is None:
            return {}
            
        try:
            result = {}
            
            # Safe extraction with null checks
            if hasattr(df, 'SMA_20') and len(df) > 0:
                sma_20_val = df['SMA_20'].iloc[-1] if 'SMA_20' in df.columns else None
                result['sma_20'] = float(sma_20_val) if sma_20_val is not None and not pd.isna(sma_20_val) else None
            
            if hasattr(df, 'SMA_50') and len(df) > 0:
                sma_50_val = df['SMA_50'].iloc[-1] if 'SMA_50' in df.columns else None
                result['sma_50'] = float(sma_50_val) if sma_50_val is not None and not pd.isna(sma_50_val) else None
            
            if hasattr(df, 'RSI') and len(df) > 0:
                rsi_val = df['RSI'].iloc[-1] if 'RSI' in df.columns else None
                result['rsi'] = float(rsi_val) if rsi_val is not None and not pd.isna(rsi_val) else None
            
            if hasattr(df, 'MACD') and len(df) > 0:
                macd_val = df['MACD'].iloc[-1] if 'MACD' in df.columns else None
                result['macd'] = float(macd_val) if macd_val is not None and not pd.isna(macd_val) else None
            
            if hasattr(df, 'MACD_Signal') and len(df) > 0:
                signal_val = df['MACD_Signal'].iloc[-1] if 'MACD_Signal' in df.columns else None
                result['macd_signal'] = float(signal_val) if signal_val is not None and not pd.isna(signal_val) else None
            
            return result
        except Exception as e:
            self.logger.error(f"Error extracting technical indicators: {e}")
            return {}
    
