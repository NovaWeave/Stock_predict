'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, BarChart3, Activity, Globe, Users, Newspaper, Sparkles, Zap, Target } from 'lucide-react';
import StockAnalysis from '@/components/StockAnalysis';
import SentimentChart from '@/components/SentimentChart';
import SocialFeed from '@/components/SocialFeed';
import CompanyProfile from '@/components/CompanyProfile';
import NewsSection from '@/components/NewsSection';

type TrendType = 'Bullish' | 'Bearish' | 'Neutral';

interface TrendPrediction {
  success: boolean;
  trend: TrendType;
  confidence: number;
  sentiment_score: number;
  reddit_sentiment: number;
  x_sentiment: number;
  data_points: { reddit_posts: number; x_posts: number };
}

interface TechnicalIndicators {
  sma_20?: number | null;
  sma_50?: number | null;
  rsi?: number | null;
  macd?: number | null;
  macd_signal?: number | null;
}

interface HistoricalData {
  dates: string[];
  prices: number[];
  volumes: number[];
}

interface StockDataSuccess {
  success: true;
  data: {
    current_price: number;
    price_change: number;
    price_change_percent: number;
    volume: number;
    historical_data: HistoricalData;
    technical_indicators?: TechnicalIndicators;
  };
}

interface StockDataError {
  success: false;
  error: string;
}

type StockData = StockDataSuccess | StockDataError;

interface CompanyProfileData {
  name?: string;
  country?: string;
  exchange?: string;
  industry?: string;
  website?: string;
  market_cap?: number;
  ipo?: string;
  company_description?: string;
}

interface CompanyProfileResult {
  success: boolean;
  data?: CompanyProfileData;
  error?: string;
}

interface NewsItem {
  headline: string;
  summary?: string;
  url?: string;
  source?: string;
  datetime: number;
  sentiment?: number;
}

interface NewsResult {
  success: boolean;
  data?: NewsItem[];
  error?: string;
}

interface RedditPost {
  title: string;
  text: string;
  score: number;
  created_utc: string;
  url: string;
  author: string;
  subreddit: string;
  sentiment?: number;
}

interface XPost {
  text: string;
  created_at: string;
  like_count: number;
  retweet_count: number;
  reply_count: number;
  quote_count: number;
  id: string;
  sentiment?: number;
  author?: string;
}

export interface AnalysisData {
  stock_symbol: string;
  success: boolean;
  trend_prediction: TrendPrediction;
  stock_data: StockData;
  company_profile: CompanyProfileResult;
  news: NewsResult;
  reddit_posts: RedditPost[];
  x_posts: XPost[];
}

export default function Home() {
  const [stockSymbol, setStockSymbol] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleAnalyze = async () => {
    if (!stockSymbol.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/analyze/${stockSymbol.toUpperCase()}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalysisData(data);
      } else {
        setError(data.error || 'Failed to analyze stock');
      }
    } catch {
      setError('Network error. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden">
      {/* Animated Background Elements */}
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
                      onChange={(e) => setStockSymbol(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                      className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-lg"
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
                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-left">
                    <p className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></span>
                      {error}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Quick Stats */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-effect rounded-2xl p-6 card-hover">
                  <div className="text-3xl font-bold gradient-text mb-2">30.0%</div>
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
      {analysisData && (
        <section className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Analysis Results for <span className="gradient-text">{analysisData.stock_symbol}</span>
              </h2>
              <p className="text-xl text-slate-300">Comprehensive insights and predictions</p>
            </div>
            
            <StockAnalysis data={analysisData} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
              <SentimentChart data={analysisData} />
              <CompanyProfile data={analysisData} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
              <SocialFeed data={analysisData} />
              <NewsSection data={analysisData} />
            </div>
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
              <div
                key={index}
                className={`glass-effect p-8 rounded-2xl border border-white/10 card-hover group`}
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
              </div>
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
