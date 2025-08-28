/**
 * TypeScript Interfaces for Stock Sentiment Analyzer
 * 
 * Provides comprehensive type definitions for all data structures
 * used throughout the application.
 */

// Base API Response Types
export interface BaseApiResponse {
  success: boolean;
  timestamp?: string;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
}

export interface SuccessApiResponse<T> extends BaseApiResponse {
  success: true;
  data: T;
}

export interface ErrorApiResponse extends BaseApiResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
}

export type ApiResponse<T> = SuccessApiResponse<T> | ErrorApiResponse;

// Stock Data Types
export interface TechnicalIndicators {
  sma_20?: number | null;
  sma_50?: number | null;
  rsi?: number | null;
  macd?: number | null;
  macd_signal?: number | null;
}

export interface HistoricalData {
  dates: string[];
  prices: number[];
  volumes: number[];
}

export interface StockData {
  current_price: number;
  price_change: number;
  price_change_percent: number;
  volume: number;
  historical_data: HistoricalData;
  technical_indicators?: TechnicalIndicators;
}

export type StockDataResponse = ApiResponse<StockData>;

// Social Media Types
export interface RedditPost {
  title: string;
  text: string;
  score: number;
  created_utc: string | Date;
  url: string;
  author: string;
  subreddit: string;
  sentiment?: number;
}

export interface XPost {
  id: string;
  text: string;
  created_at: string;
  like_count: number;
  retweet_count: number;
  reply_count: number;
  quote_count: number;
  sentiment?: number;
  author?: string;
}

export type RedditPostsResponse = ApiResponse<RedditPost[]>;
export type XPostsResponse = ApiResponse<XPost[]>;

// Company Information Types
export interface CompanyProfile {
  name?: string;
  country?: string;
  exchange?: string;
  industry?: string;
  website?: string;
  market_cap?: number;
  ipo?: string;
  company_description?: string;
}

export type CompanyProfileResponse = ApiResponse<CompanyProfile>;

// News Types
export interface NewsItem {
  headline: string;
  summary?: string;
  url?: string;
  source?: string;
  datetime: number;
  sentiment?: number;
}

export type NewsResponse = ApiResponse<NewsItem[]>;

// Trend Prediction Types
export type TrendType = 'Bullish' | 'Bearish' | 'Neutral';

export interface TrendPrediction {
  trend: TrendType;
  confidence: number;
  sentiment_score: number;
  reddit_sentiment: number;
  x_sentiment: number;
  data_points: {
    reddit_posts: number;
    x_posts: number;
  };
}

export type TrendPredictionResponse = ApiResponse<TrendPrediction>;

// Comprehensive Analysis Types
export interface AnalysisData {
  stock_symbol: string;
  timestamp: string;
  trend_prediction: TrendPredictionResponse;
  stock_data: StockDataResponse;
  company_profile: CompanyProfileResponse;
  news: NewsResponse;
  reddit_posts: RedditPost[];
  x_posts: XPost[];
}

export type AnalysisResponse = ApiResponse<AnalysisData>;

// Health Check Types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    sentiment_analysis: boolean;
    stock_data: boolean;
    social_media: boolean;
    [key: string]: boolean;
  };
}

export type HealthResponse = ApiResponse<HealthStatus>;

// API Version Types
export interface VersionInfo {
  version: string;
  mock_data_enabled: boolean;
  cors_origins: string[];
}

export type VersionResponse = ApiResponse<VersionInfo>;

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

export interface ApiRequestState extends LoadingState, ErrorState {
  isLoading: boolean;
  hasError: boolean;
  message?: string;
  code?: string;
}

// Component Props Types
export interface StockAnalysisProps {
  data: AnalysisData;
  isLoading?: boolean;
}

export interface SentimentChartProps {
  data: AnalysisData;
  height?: number;
}

export interface SocialFeedProps {
  data: AnalysisData;
  maxPosts?: number;
}

export interface CompanyProfileProps {
  data: AnalysisData;
  compact?: boolean;
}

export interface NewsSectionProps {
  data: AnalysisData;
  maxArticles?: number;
}

export interface SearchFormProps {
  onSearch: (symbol: string) => void;
  isLoading: boolean;
  error?: string;
}

// Utility Types
export interface TimeRange {
  start: Date;
  end: Date;
}

export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
}

export interface SentimentStats {
  average: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  total_count: number;
}

// Form Types
export interface SearchFormData {
  symbol: string;
}

export interface FilterOptions {
  timeRange?: TimeRange;
  sources?: string[];
  sentimentThreshold?: number;
}

// Configuration Types
export interface AppConfig {
  apiBaseUrl: string;
  defaultStockSymbol?: string;
  refreshInterval?: number;
  maxCacheAge?: number;
}

// Error Types
export class ApiError extends Error {
  public readonly code?: string;
  public readonly statusCode?: number;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Type Guards
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is SuccessApiResponse<T> {
  return response.success === true;
}

export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ErrorApiResponse {
  return response.success === false;
}

export function isTrendPredictionResponse(
  data: any
): data is TrendPredictionResponse {
  return (
    data &&
    typeof data === 'object' &&
    'success' in data &&
    (data.success === false || 'trend' in data.data)
  );
}

export function isStockDataResponse(data: any): data is StockDataResponse {
  return (
    data &&
    typeof data === 'object' &&
    'success' in data &&
    (data.success === false || 'current_price' in data.data)
  );
}

// Default values
export const DEFAULT_ANALYSIS_DATA: Partial<AnalysisData> = {
  stock_symbol: '',
  timestamp: new Date().toISOString(),
  trend_prediction: {
    success: false,
    error: { message: 'No data available' }
  } as ErrorApiResponse,
  stock_data: {
    success: false,
    error: { message: 'No data available' }
  } as ErrorApiResponse,
  company_profile: {
    success: false,
    error: { message: 'No data available' }
  } as ErrorApiResponse,
  news: {
    success: false,
    error: { message: 'No data available' }
  } as ErrorApiResponse,
  reddit_posts: [],
  x_posts: []
};

export const DEFAULT_API_REQUEST_STATE: ApiRequestState = {
  isLoading: false,
  hasError: false
};

export const DEFAULT_STOCK_SYMBOLS = [
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN'
] as const;

export type DefaultStockSymbol = typeof DEFAULT_STOCK_SYMBOLS[number];