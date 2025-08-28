/**
 * Stock Search Component
 * 
 * A focused, reusable component for searching stock symbols
 * with validation, suggestions, and proper accessibility.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Search, Zap, AlertCircle } from 'lucide-react';
import { useStockSymbolValidator, useDebounce } from '@/hooks';
import type { SearchFormProps, DefaultStockSymbol } from '@/types';

interface StockSearchProps extends SearchFormProps {
  placeholder?: string;
  suggestions?: readonly string[];
  className?: string;
}

const DEFAULT_SUGGESTIONS: readonly DefaultStockSymbol[] = [
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN'
] as const;

export default function StockSearch({
  onSearch,
  isLoading,
  error,
  placeholder = "Enter stock symbol (e.g., AAPL, TSLA, GOOGL)",
  suggestions = DEFAULT_SUGGESTIONS,
  className = ""
}: StockSearchProps) {
  const [symbol, setSymbol] = useState('');
  const [validationError, setValidationError] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { validateSymbol } = useStockSymbolValidator();
  const debouncedSymbol = useDebounce(symbol, 300);

  // Validate symbol on debounced change
  React.useEffect(() => {
    if (debouncedSymbol) {
      const validation = validateSymbol(debouncedSymbol);
      setValidationError(validation.isValid ? '' : validation.error || '');
    } else {
      setValidationError('');
    }
  }, [debouncedSymbol, validateSymbol]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symbol.trim()) {
      setValidationError('Please enter a stock symbol');
      return;
    }

    const validation = validateSymbol(symbol);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid stock symbol');
      return;
    }

    setValidationError('');
    onSearch(symbol.trim().toUpperCase());
  }, [symbol, validateSymbol, onSearch]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSymbol(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  }, [onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSymbol(value);
    setShowSuggestions(value.length > 0);
  }, []);

  const handleInputFocus = useCallback(() => {
    setShowSuggestions(symbol.length > 0);
  }, [symbol]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 150);
  }, []);

  const displayError = validationError || error;
  const hasError = Boolean(displayError);

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <div className="flex space-x-3">
            <div className="relative flex-1">
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" 
                aria-hidden="true"
              />
              <input
                type="text"
                value={symbol}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={placeholder}
                disabled={isLoading}
                aria-invalid={hasError}
                aria-describedby={hasError ? "search-error" : undefined}
                className={`
                  w-full pl-12 pr-4 py-4 
                  bg-white/10 backdrop-blur-xl 
                  border transition-all duration-300 text-lg
                  rounded-2xl text-white placeholder-slate-400 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${hasError 
                    ? 'border-red-500/50 focus:ring-red-500' 
                    : 'border-white/20'
                  }
                `}
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl z-10">
                  <div className="p-2">
                    <div className="text-xs text-slate-400 px-3 py-2 border-b border-white/10">
                      Popular symbols:
                    </div>
                    <div className="flex flex-wrap gap-2 p-3">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-1.5 text-sm rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading || hasError || !symbol.trim()}
              className="
                px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 
                text-white rounded-2xl font-semibold 
                hover:from-blue-600 hover:to-purple-700 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 
                disabled:opacity-50 disabled:cursor-not-allowed 
                transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25
              "
              aria-label={isLoading ? 'Analyzing...' : 'Analyze stock'}
            >
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5" aria-hidden="true" />
                  <span>Analyze Now</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error Message */}
      {displayError && (
        <div 
          id="search-error"
          className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300"
          role="alert"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{displayError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}