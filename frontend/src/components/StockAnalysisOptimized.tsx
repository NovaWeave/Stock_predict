'use client';

import React, { useMemo, memo } from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, Activity, Target, BarChart3, TrendingUpIcon } from 'lucide-react';

import type { AnalysisData } from '@/app/page';

interface StockAnalysisProps {
  data: AnalysisData;
}

// Memoized trend icon component to prevent re-renders
const TrendIcon = memo(({ trend }: { trend: string }) => {
  switch (trend.toLowerCase()) {
    case 'bullish':
      return <TrendingUp className="w-8 h-8 text-green-400" />;
    case 'bearish':
      return <TrendingDown className="w-8 h-8 text-red-400" />;
    default:
      return <Minus className="w-8 h-8 text-yellow-400" />;
  }
});
TrendIcon.displayName = 'TrendIcon';

// Memoized metric card to prevent unnecessary re-renders
const MetricCard = memo(({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  colorClass, 
  bgColorClass 
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  subValue?: string | React.ReactNode;
  colorClass?: string;
  bgColorClass?: string;
}) => (
  <div className={`${bgColorClass || 'glass-effect'} rounded-2xl p-8 border ${bgColorClass ? 'backdrop-blur-xl' : 'border-white/10'} card-hover`}>
    <div className="flex items-center justify-between mb-6">
      <Icon className="w-10 h-10 text-blue-400" />
      <span className="text-sm text-slate-300 font-medium">{label}</span>
    </div>
    <div className="space-y-2">
      <span className={`text-4xl font-bold ${colorClass || 'text-white'}`}>
        {value}
      </span>
      {subValue && (
        <div className="text-lg font-semibold">
          {subValue}
        </div>
      )}
    </div>
  </div>
));
MetricCard.displayName = 'MetricCard';

// Memoized sentiment breakdown component
const SentimentBreakdown = memo(({ 
  title, 
  bgColor, 
  sentiment, 
  postCount 
}: {
  title: string;
  bgColor: string;
  sentiment: number;
  postCount: number;
}) => {
  const sentimentColor = useMemo(() => {
    if (sentiment > 0) return 'text-green-400';
    if (sentiment < 0) return 'text-red-400';
    return 'text-yellow-400';
  }, [sentiment]);

  const sentimentPercentage = useMemo(() => 
    (sentiment * 100).toFixed(1), [sentiment]
  );

  return (
    <div className="glass-effect rounded-2xl p-8 border border-white/10 card-hover">
      <h3 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-3">
        <span className={`w-4 h-4 ${bgColor} rounded-full`}></span>
        <span>{title}</span>
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-300 text-lg">Sentiment Score:</span>
          <span className={`text-2xl font-bold ${sentimentColor}`}>
            {sentimentPercentage}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-300 text-lg">Posts Analyzed:</span>
          <span className="text-2xl font-bold text-white">{postCount}</span>
        </div>
      </div>
    </div>
  );
});
SentimentBreakdown.displayName = 'SentimentBreakdown';

// Memoized technical indicators component
const TechnicalIndicators = memo(({ indicators }: { 
  indicators: Record<string, any> 
}) => {
  const indicatorEntries = useMemo(() => 
    Object.entries(indicators), [indicators]
  );

  return (
    <div className="glass-effect rounded-2xl p-8 border border-white/10">
      <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
        <TrendingUp className="w-6 h-6 text-blue-400 mr-3" />
        Technical Indicators
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {indicatorEntries.map(([key, value]) => (
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
  );
});
TechnicalIndicators.displayName = 'TechnicalIndicators';

// Main optimized StockAnalysis component
const StockAnalysis = memo(({ data }: StockAnalysisProps) => {
  const { trend_prediction, stock_data, stock_symbol } = data;

  // Memoize computed values to prevent recalculation
  const trendColorClass = useMemo(() => {
    switch (trend_prediction.trend.toLowerCase()) {
      case 'bullish':
        return 'text-green-400';
      case 'bearish':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  }, [trend_prediction.trend]);

  const trendBgColorClass = useMemo(() => {
    switch (trend_prediction.trend.toLowerCase()) {
      case 'bullish':
        return 'bg-green-500/20 border-green-500/30';
      case 'bearish':
        return 'bg-red-500/20 border-red-500/30';
      default:
        return 'bg-yellow-500/20 border-yellow-500/30';
    }
  }, [trend_prediction.trend]);

  const confidenceColorClass = useMemo(() => {
    if (trend_prediction.confidence >= 0.7) return 'text-green-400';
    if (trend_prediction.confidence >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  }, [trend_prediction.confidence]);

  const sentimentColorClass = useMemo(() => {
    if (trend_prediction.sentiment_score > 0) return 'text-green-400';
    if (trend_prediction.sentiment_score < 0) return 'text-red-400';
    return 'text-yellow-400';
  }, [trend_prediction.sentiment_score]);

  // Memoize formatted values
  const formattedValues = useMemo(() => ({
    confidence: (trend_prediction.confidence * 100).toFixed(1),
    sentiment: (trend_prediction.sentiment_score * 100).toFixed(1),
    currentPrice: stock_data.success ? stock_data.data.current_price.toFixed(2) : null,
    priceChange: stock_data.success ? stock_data.data.price_change_percent.toFixed(2) : null,
    priceChangePrefix: stock_data.success && stock_data.data.price_change_percent > 0 ? '+' : ''
  }), [
    trend_prediction.confidence,
    trend_prediction.sentiment_score,
    stock_data
  ]);

  const priceChangeColorClass = useMemo(() => {
    if (!stock_data.success) return '';
    return stock_data.data.price_change_percent > 0 ? 'text-green-400' : 'text-red-400';
  }, [stock_data]);

  return (
    <div className="glass-effect rounded-3xl border border-white/10 p-10 shadow-2xl">
      {/* Header */}
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
        <div className={`${trendBgColorClass} rounded-2xl p-8 border backdrop-blur-xl card-hover`}>
          <div className="flex items-center justify-between mb-6">
            <Target className="w-10 h-10 text-blue-400" />
            <span className="text-sm text-slate-300 font-medium">Trend</span>
          </div>
          <div className="flex items-center space-x-4">
            <TrendIcon trend={trend_prediction.trend} />
            <span className={`text-3xl font-bold ${trendColorClass}`}>
              {trend_prediction.trend}
            </span>
          </div>
        </div>

        {/* Confidence Score */}
        <MetricCard
          icon={Activity}
          label="Confidence"
          value={`${formattedValues.confidence}%`}
          colorClass={confidenceColorClass}
        />

        {/* Sentiment Score */}
        <MetricCard
          icon={TrendingUpIcon}
          label="Sentiment"
          value={`${formattedValues.sentiment}%`}
          colorClass={sentimentColorClass}
        />

        {/* Current Price */}
        {stock_data.success && formattedValues.currentPrice && (
          <MetricCard
            icon={DollarSign}
            label="Price"
            value={`$${formattedValues.currentPrice}`}
            subValue={
              <div className={`text-lg font-semibold ${priceChangeColorClass}`}>
                {formattedValues.priceChangePrefix}{formattedValues.priceChange}%
              </div>
            }
          />
        )}
      </div>

      {/* Detailed Sentiment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <SentimentBreakdown
          title="Reddit Sentiment"
          bgColor="bg-orange-500"
          sentiment={trend_prediction.reddit_sentiment}
          postCount={trend_prediction.data_points.reddit_posts}
        />

        <SentimentBreakdown
          title="X (Twitter) Sentiment"
          bgColor="bg-blue-500"
          sentiment={trend_prediction.x_sentiment}
          postCount={trend_prediction.data_points.x_posts}
        />
      </div>

      {/* Technical Indicators */}
      {stock_data.success && stock_data.data.technical_indicators && (
        <TechnicalIndicators indicators={stock_data.data.technical_indicators} />
      )}
    </div>
  );
});

StockAnalysis.displayName = 'StockAnalysis';

export default StockAnalysis;