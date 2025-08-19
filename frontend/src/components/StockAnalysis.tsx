'use client';

import { TrendingUp, TrendingDown, Minus, DollarSign, Activity, Target, BarChart3, TrendingUpIcon } from 'lucide-react';

import type { AnalysisData } from '@/app/page';

interface StockAnalysisProps {
  data: AnalysisData;
}

export default function StockAnalysis({ data }: StockAnalysisProps) {
  const { trend_prediction, stock_data, stock_symbol } = data;

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'bullish':
        return <TrendingUp className="w-8 h-8 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="w-8 h-8 text-red-400" />;
      default:
        return <Minus className="w-8 h-8 text-yellow-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'bullish':
        return 'text-green-400';
      case 'bearish':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-400';
    if (confidence >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendBgColor = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'bullish':
        return 'bg-green-500/20 border-green-500/30';
      case 'bearish':
        return 'bg-red-500/20 border-red-500/30';
      default:
        return 'bg-yellow-500/20 border-yellow-500/30';
    }
  };

  return (
    <div className="glass-effect rounded-3xl border border-white/10 p-10 shadow-2xl">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-blue-400 mr-3" />
          <h2 className="text-4xl font-bold text-white">
            Analysis Results for <span className="gradient-text">{stock_symbol}</span>
          </h2>
        </div>
        <p className="text-xl text-slate-300">
          AI-powered sentiment analysis and trend prediction with confidence scoring
        </p>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {/* Trend Prediction */}
        <div className={`${getTrendBgColor(trend_prediction.trend)} rounded-2xl p-8 border backdrop-blur-xl card-hover`}>
          <div className="flex items-center justify-between mb-6">
            <Target className="w-10 h-10 text-blue-400" />
            <span className="text-sm text-slate-300 font-medium">Trend</span>
          </div>
          <div className="flex items-center space-x-4">
            {getTrendIcon(trend_prediction.trend)}
            <span className={`text-3xl font-bold ${getTrendColor(trend_prediction.trend)}`}>
              {trend_prediction.trend}
            </span>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="glass-effect rounded-2xl p-8 border border-white/10 card-hover">
          <div className="flex items-center justify-between mb-6">
            <Activity className="w-10 h-10 text-purple-400" />
            <span className="text-sm text-slate-300 font-medium">Confidence</span>
          </div>
          <span className={`text-4xl font-bold ${getConfidenceColor(trend_prediction.confidence)}`}>
            {(trend_prediction.confidence * 100).toFixed(1)}%
          </span>
        </div>

        {/* Sentiment Score */}
        <div className="glass-effect rounded-2xl p-8 border border-white/10 card-hover">
          <div className="flex items-center justify-between mb-6">
            <TrendingUpIcon className="w-10 h-10 text-green-400" />
            <span className="text-sm text-slate-300 font-medium">Sentiment</span>
          </div>
          <span className={`text-4xl font-bold ${trend_prediction.sentiment_score > 0 ? 'text-green-400' : trend_prediction.sentiment_score < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
            {(trend_prediction.sentiment_score * 100).toFixed(1)}%
          </span>
        </div>

        {/* Current Price */}
        {stock_data.success && (
          <div className="glass-effect rounded-2xl p-8 border border-white/10 card-hover">
            <div className="flex items-center justify-between mb-6">
              <DollarSign className="w-10 h-10 text-yellow-400" />
              <span className="text-sm text-slate-300 font-medium">Price</span>
            </div>
            <div className="space-y-2">
              <span className="text-4xl font-bold text-white">
                ${stock_data.data.current_price.toFixed(2)}
              </span>
              <div className={`text-lg font-semibold ${stock_data.data.price_change_percent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stock_data.data.price_change_percent > 0 ? '+' : ''}{stock_data.data.price_change_percent.toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Sentiment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Reddit Sentiment */}
        <div className="glass-effect rounded-2xl p-8 border border-white/10 card-hover">
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-3">
            <span className="w-4 h-4 bg-orange-500 rounded-full"></span>
            <span>Reddit Sentiment</span>
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-lg">Sentiment Score:</span>
              <span className={`text-2xl font-bold ${trend_prediction.reddit_sentiment > 0 ? 'text-green-400' : trend_prediction.reddit_sentiment < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {(trend_prediction.reddit_sentiment * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-lg">Posts Analyzed:</span>
              <span className="text-2xl font-bold text-white">{trend_prediction.data_points.reddit_posts}</span>
            </div>
          </div>
        </div>

        {/* X (Twitter) Sentiment */}
        <div className="glass-effect rounded-2xl p-8 border border-white/10 card-hover">
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-3">
            <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
            <span>X (Twitter) Sentiment</span>
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-lg">Sentiment Score:</span>
              <span className={`text-2xl font-bold ${trend_prediction.x_sentiment > 0 ? 'text-green-400' : trend_prediction.x_sentiment < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {(trend_prediction.x_sentiment * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-lg">Posts Analyzed:</span>
              <span className="text-2xl font-bold text-white">{trend_prediction.data_points.x_posts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Indicators */}
      {stock_data.success && stock_data.data.technical_indicators && (
        <div className="glass-effect rounded-2xl p-8 border border-white/10">
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 text-blue-400 mr-3" />
            Technical Indicators
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(stock_data.data.technical_indicators).map(([key, value]) => (
              <div key={key} className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-sm text-slate-400 mb-2 font-medium">
                  {key.replace(/_/g, ' ').toUpperCase()}
                </div>
                <div className="text-xl font-bold text-white">
                  {typeof value === 'number' ? value.toFixed(2) : String(value) || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
