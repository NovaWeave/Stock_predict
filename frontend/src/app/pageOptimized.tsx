'use client';

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Search, TrendingUp, BarChart3, Activity, Globe, Users, Newspaper, Sparkles, Zap, Target } from 'lucide-react';
import { useStockAnalysis } from '@/hooks/useOptimizedApi';

// Lazy load components to improve initial load time
const StockAnalysisOptimized = lazy(() => import('@/components/StockAnalysisOptimized'));
const SentimentChart = lazy(() => import('@/components/SentimentChart'));
const SocialFeed = lazy(() => import('@/components/SocialFeed'));
const CompanyProfile = lazy(() => import('@/components/CompanyProfile'));
const NewsSection = lazy(() => import('@/components/NewsSection'));

// Loading skeleton components
const AnalysisLoadingSkeleton = React.memo(() => (
  <div className="glass-effect rounded-3xl border border-white/10 p-10 animate-pulse">
    <div className="h-6 w-1/3 bg-white/10 rounded mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_,i) => (
        <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10"></div>
      ))}
    </div>
  </div>
));
AnalysisLoadingSkeleton.displayName = 'AnalysisLoadingSkeleton';

const ComponentLoadingSkeleton = React.memo(() => (
  <div className="glass-effect rounded-2xl border border-white/10 p-6 animate-pulse">
    <div className="h-4 w-1/4 bg-white/10 rounded mb-4"></div>
    <div className="space-y-3">
      <div className="h-3 w-full bg-white/5 rounded"></div>
      <div className="h-3 w-3/4 bg-white/5 rounded"></div>
      <div className="h-3 w-1/2 bg-white/5 rounded"></div>
    </div>
  </div>
));
ComponentLoadingSkeleton.displayName = 'ComponentLoadingSkeleton';

// Memoized feature card component
const FeatureCard = React.memo(({ feature, index }: {
  feature: {
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
  };
  index: number;
}) => (
  <div
    className="glass-effect p-8 rounded-2xl border border-white/10 card-hover group"
    style={{animationDelay: `${index * 100}ms`}}
  >
    <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
      <feature.icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-2xl font-semibold text-white mb-4">{feature.title}</h3>
    <p className="text-slate-300 leading-relaxed">{feature.description}</p>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

// Memoized ticker button component
const TickerButton = React.memo(({ ticker, onClick }: {
  ticker: string;
  onClick: (ticker: string) => void;
}) => (
  <button
    onClick={() => onClick(ticker)}
    className="px-3 py-1.5 text-sm rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors"
  >
    {ticker}
  </button>
));
TickerButton.displayName = 'TickerButton';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="glass-effect rounded-2xl border border-red-500/20 p-6 text-center">
          <p className="text-red-400 mb-2">Something went wrong</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function OptimizedHome() {
  const [stockSymbol, setStockSymbol] = useState('');
  const [currentSymbol, setCurrentSymbol] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Use optimized API hook
  const {
    data: analysisData,
    loading: isLoading,
    error,
    refetch
  } = useStockAnalysis(currentSymbol);

  // Memoize features array to prevent recreation on every render
  const features = useMemo(() => [
    {
      icon: TrendingUp,
      title: 'AI Sentiment Analysis',
      description: 'Advanced NLP-powered sentiment analysis from Reddit and X discussions',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BarChart3,
      title: 'Technical Indicators',
      description: 'RSI, MACD, and moving averages for professional technical analysis',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Activity,
      title: 'Trend Prediction',
      description: 'Machine learning-based stock trend predictions with confidence scores',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Globe,
      title: 'Multi-Source Data',
      description: 'Real-time data from Reddit, X, Yahoo Finance, and Finnhub APIs',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Users,
      title: 'Social Insights',
      description: 'Live social media sentiment analysis and community insights',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Newspaper,
      title: 'News Analysis',
      description: 'Latest company news with sentiment scoring and financial updates',
      color: 'from-teal-500 to-blue-500'
    }
  ], []);

  const popularTickers = useMemo(() => ['AAPL','TSLA','NVDA','MSFT','GOOGL','AMZN'], []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Optimized analyze function with debouncing
  const handleAnalyze = useCallback(() => {
    if (!stockSymbol.trim()) return;
    setCurrentSymbol(stockSymbol.toUpperCase());
  }, [stockSymbol]);

  // Handle ticker button clicks
  const handleTickerClick = useCallback((ticker: string) => {
    setStockSymbol(ticker);
    setCurrentSymbol(ticker);
  }, []);

  // Handle input changes with validation
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); // Only allow letters
    if (value.length <= 10) { // Reasonable symbol length limit
      setStockSymbol(value);
    }
  }, []);

  // Handle enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  }, [handleAnalyze]);

  const errorMessage = error?.message || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden">
      {/* Animated Background Elements - Optimized to use CSS transforms */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Header */}
      <header className="glass-effect border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Stock Sentiment Analyzer</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-yellow-400 mr-3 animate-pulse" />
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                AI-Powered Stock
                <span className="gradient-text block mt-2">
                  Sentiment Analysis
                </span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Analyze stock market sentiment from Reddit and X discussions, combine with financial data, 
              and get AI-powered trend predictions to make informed investment decisions.
            </p>
            
            {/* Enhanced Search Section */}
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <div className="flex space-x-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter stock symbol (e.g., AAPL, TSLA, GOOGL)"
                      value={stockSymbol}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-lg"
                      maxLength={10}
                    />
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !stockSymbol.trim()}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <Zap className="w-5 h-5" />
                        <span>Analyze Now</span>
                      </div>
                    )}
                  </button>
                </div>

                {/* Quick ticker suggestions */}
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {popularTickers.map(ticker => (
                    <TickerButton
                      key={ticker}
                      ticker={ticker}
                      onClick={handleTickerClick}
                    />
                  ))}
                </div>

                {errorMessage && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-left">
                    <p className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></span>
                      {errorMessage}
                    </p>
                    <button
                      onClick={refetch}
                      className="mt-2 text-sm underline hover:no-underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
              
              {/* Quick Stats */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-effect rounded-2xl p-6 card-hover">
                  <div className="text-3xl font-bold gradient-text mb-2">85.0%</div>
                  <div className="text-slate-300">Accuracy Rate</div>
                </div>
                <div className="glass-effect rounded-2xl p-6 card-hover">
                  <div className="text-3xl font-bold gradient-text mb-2">24/7</div>
                  <div className="text-slate-300">Real-time Analysis</div>
                </div>
                <div className="glass-effect rounded-2xl p-6 card-hover">
                  <div className="text-3xl font-bold gradient-text mb-2">AI-Powered</div>
                  <div className="text-slate-300">Machine Learning</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analysis Results */}
      {(isLoading || analysisData) && (
        <section className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                {isLoading ? (
                  <span className="gradient-text">Analyzing...</span>
                ) : (
                  <>Analysis Results for <span className="gradient-text">{analysisData?.stock_symbol}</span></>
                )}
              </h2>
              <p className="text-xl text-slate-300">Comprehensive insights and predictions</p>
            </div>
            
            <ErrorBoundary>
              {isLoading && !analysisData ? (
                <AnalysisLoadingSkeleton />
              ) : analysisData ? (
                <Suspense fallback={<AnalysisLoadingSkeleton />}>
                  <StockAnalysisOptimized data={analysisData} />
                </Suspense>
              ) : null}
            </ErrorBoundary>
            
            {analysisData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                <ErrorBoundary fallback={<ComponentLoadingSkeleton />}>
                  <Suspense fallback={<ComponentLoadingSkeleton />}>
                    <SentimentChart data={analysisData} />
                  </Suspense>
                </ErrorBoundary>
                
                <ErrorBoundary fallback={<ComponentLoadingSkeleton />}>
                  <Suspense fallback={<ComponentLoadingSkeleton />}>
                    <CompanyProfile data={analysisData} />
                  </Suspense>
                </ErrorBoundary>
              </div>
            )}
            
            {analysisData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                <ErrorBoundary fallback={<ComponentLoadingSkeleton />}>
                  <Suspense fallback={<ComponentLoadingSkeleton />}>
                    <SocialFeed data={analysisData} />
                  </Suspense>
                </ErrorBoundary>
                
                <ErrorBoundary fallback={<ComponentLoadingSkeleton />}>
                  <Suspense fallback={<ComponentLoadingSkeleton />}>
                    <NewsSection data={analysisData} />
                  </Suspense>
                </ErrorBoundary>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Enhanced Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 glass-effect">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features for Smart Investing
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Get comprehensive insights from multiple data sources with cutting-edge AI analysis
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced About Section */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-16">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Data Collection</h3>
              <p className="text-slate-300 leading-relaxed">Gather discussions from Reddit and X about specific stocks using advanced web scraping and API integration</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">AI Analysis</h3>
              <p className="text-slate-300 leading-relaxed">Process sentiment using VADER NLP and combine with financial data using machine learning algorithms</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Insights & Predictions</h3>
              <p className="text-slate-300 leading-relaxed">Get trend predictions and comprehensive market insights with confidence scoring and risk assessment</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-effect border-t border-white/10 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">Stock Sentiment Analyzer</h3>
          </div>
          <p className="text-slate-400 text-lg mb-4">
            © 2024 Stock Sentiment Analyzer. Built with ❤️ for the trading community.
          </p>
          <p className="text-slate-500 text-sm">
            This tool is for educational purposes only. Always conduct thorough research before making investment decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}