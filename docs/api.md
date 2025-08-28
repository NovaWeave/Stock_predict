# API Documentation

## Stock Sentiment Analyzer API v1.0

The Stock Sentiment Analyzer API provides comprehensive stock analysis combining social media sentiment, technical indicators, and financial data.

### Base URL

```
Production: https://your-api-domain.com/api
Development: http://localhost:5000/api
```

### Authentication

Currently, no authentication is required. Rate limiting may apply based on IP address.

### Response Format

All API responses follow a consistent format:

```json
{
  \"success\": true,
  \"data\": {
    // Response data
  },
  \"error\": null,
  \"timestamp\": \"2024-01-15T10:30:00Z\",
  \"request_id\": \"req_1234567890\"
}
```

Error responses:

```json
{
  \"success\": false,
  \"data\": null,
  \"error\": {
    \"code\": \"INVALID_SYMBOL\",
    \"message\": \"Invalid stock symbol provided\",
    \"details\": {
      \"symbol\": \"INVALID\",
      \"valid_format\": \"1-5 uppercase letters\"
    }
  },
  \"timestamp\": \"2024-01-15T10:30:00Z\",
  \"request_id\": \"req_1234567890\"
}
```

## Endpoints

### Health Check

#### `GET /health`

Health check endpoint for monitoring service status.

**Response:**

```json
{
  \"success\": true,
  \"data\": {
    \"status\": \"healthy\",
    \"version\": \"1.0.0\",
    \"timestamp\": \"2024-01-15T10:30:00Z\",
    \"services\": {
      \"sentiment_service\": \"operational\",
      \"social_media_service\": \"operational\",
      \"stock_data_service\": \"operational\"
    }
  }
}
```

---

### Stock Analysis

#### `GET /analyze/{symbol}`

Comprehensive stock analysis including sentiment, technical indicators, and predictions.

**Parameters:**

- `symbol` (path, required): Stock symbol (e.g., AAPL, TSLA)
- `days` (query, optional): Number of days for historical data (default: 30)
- `include_social` (query, optional): Include social media data (default: true)
- `include_news` (query, optional): Include news data (default: true)

**Example Request:**

```http
GET /api/analyze/AAPL?days=30&include_social=true
```

**Example Response:**

```json
{
  \"success\": true,
  \"data\": {
    \"stock_symbol\": \"AAPL\",
    \"analysis_timestamp\": \"2024-01-15T10:30:00Z\",
    \"trend_prediction\": {
      \"trend\": \"Bullish\",
      \"confidence\": 0.85,
      \"sentiment_score\": 0.72,
      \"reddit_sentiment\": 0.68,
      \"x_sentiment\": 0.76,
      \"data_points\": {
        \"reddit_posts\": 150,
        \"x_posts\": 89
      }
    },
    \"stock_data\": {
      \"current_price\": 150.25,
      \"price_change\": 2.50,
      \"price_change_percent\": 1.69,
      \"volume\": 1234567,
      \"market_cap\": 2500000000000,
      \"historical_data\": {
        \"dates\": [\"2024-01-01\", \"2024-01-02\", \"2024-01-15\"],
        \"prices\": [148.50, 149.75, 150.25],
        \"volumes\": [1200000, 1150000, 1234567]
      },
      \"technical_indicators\": {
        \"sma_20\": 149.85,
        \"sma_50\": 147.32,
        \"rsi\": 62.5,
        \"macd\": 1.25,
        \"macd_signal\": 1.15,
        \"bollinger_upper\": 155.20,
        \"bollinger_lower\": 144.80
      }
    },
    \"company_profile\": {
      \"name\": \"Apple Inc.\",
      \"country\": \"United States\",
      \"exchange\": \"NASDAQ\",
      \"industry\": \"Technology\",
      \"website\": \"https://www.apple.com\",
      \"market_cap\": 2800000000000,
      \"ipo\": \"1980-12-12\",
      \"company_description\": \"Apple Inc. designs, manufactures...\"
    },
    \"news\": {
      \"articles\": [
        {
          \"headline\": \"Apple Reports Strong Q4 Earnings\",
          \"summary\": \"Apple Inc. reported better-than-expected...\",
          \"url\": \"https://example.com/news/1\",
          \"source\": \"Financial Times\",
          \"datetime\": 1705320600,
          \"sentiment\": 0.8
        }
      ],
      \"overall_sentiment\": 0.75,
      \"sentiment_breakdown\": {
        \"positive\": 12,
        \"neutral\": 5,
        \"negative\": 3
      }
    },
    \"reddit_posts\": [
      {
        \"title\": \"AAPL looking strong this quarter\",
        \"text\": \"Great earnings report and positive outlook...\",
        \"score\": 125,
        \"created_utc\": \"2024-01-15T10:30:00Z\",
        \"url\": \"https://reddit.com/r/stocks/post1\",
        \"author\": \"investor123\",
        \"subreddit\": \"stocks\",
        \"sentiment\": 0.7
      }
    ],
    \"x_posts\": [
      {
        \"text\": \"$AAPL breaking out of resistance levels!\",
        \"created_at\": \"2024-01-15T14:20:00Z\",
        \"like_count\": 45,
        \"retweet_count\": 12,
        \"reply_count\": 8,
        \"quote_count\": 3,
        \"id\": \"tweet_123\",
        \"sentiment\": 0.9,
        \"author\": \"trader_expert\"
      }
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid stock symbol format
- `404 Not Found`: Stock symbol not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Service unavailable

---

### Trend Prediction

#### `GET /trend/{symbol}`

Get trend prediction for a specific stock symbol.

**Parameters:**

- `symbol` (path, required): Stock symbol
- `timeframe` (query, optional): Prediction timeframe (1d, 7d, 30d, default: 7d)

**Example Request:**

```http
GET /api/trend/AAPL?timeframe=7d
```

**Example Response:**

```json
{
  \"success\": true,
  \"data\": {
    \"symbol\": \"AAPL\",
    \"trend\": \"Bullish\",
    \"confidence\": 0.85,
    \"timeframe\": \"7d\",
    \"prediction_date\": \"2024-01-22T00:00:00Z\",
    \"factors\": {
      \"sentiment_score\": 0.72,
      \"technical_score\": 0.68,
      \"volume_score\": 0.81,
      \"news_score\": 0.75
    },
    \"price_targets\": {
      \"conservative\": 152.00,
      \"moderate\": 155.50,
      \"aggressive\": 158.75
    },
    \"risk_assessment\": {
      \"level\": \"Medium\",
      \"factors\": [\"Market volatility\", \"Earnings uncertainty\"]
    }
  }
}
```

---

### Social Media Data

#### `GET /reddit/{symbol}`

Get Reddit sentiment data for a stock symbol.

**Parameters:**

- `symbol` (path, required): Stock symbol
- `limit` (query, optional): Number of posts to return (default: 50, max: 100)
- `sort` (query, optional): Sort order (hot, new, top, default: hot)
- `timeframe` (query, optional): Time period (hour, day, week, month, year, all, default: day)

**Example Request:**

```http
GET /api/reddit/AAPL?limit=25&sort=top&timeframe=week
```

**Example Response:**

```json
{
  \"success\": true,
  \"data\": {
    \"symbol\": \"AAPL\",
    \"total_posts\": 25,
    \"overall_sentiment\": 0.72,
    \"sentiment_breakdown\": {
      \"positive\": 18,
      \"neutral\": 5,
      \"negative\": 2
    },
    \"posts\": [
      {
        \"title\": \"AAPL analysis - strong buy signal\",
        \"text\": \"Technical analysis shows strong support levels...\",
        \"score\": 125,
        \"created_utc\": \"2024-01-15T10:30:00Z\",
        \"url\": \"https://reddit.com/r/stocks/post1\",
        \"author\": \"investor123\",
        \"subreddit\": \"stocks\",
        \"sentiment\": 0.8,
        \"upvote_ratio\": 0.95,
        \"num_comments\": 23
      }
    ],
    \"subreddit_breakdown\": {
      \"stocks\": 12,
      \"investing\": 8,
      \"SecurityAnalysis\": 3,
      \"ValueInvesting\": 2
    }
  }
}
```

#### `GET /x/{symbol}`

Get X (Twitter) sentiment data for a stock symbol.

**Parameters:**

- `symbol` (path, required): Stock symbol
- `limit` (query, optional): Number of tweets to return (default: 50, max: 100)
- `lang` (query, optional): Language filter (en, es, fr, etc., default: en)

**Example Request:**

```http
GET /api/x/AAPL?limit=30&lang=en
```

**Example Response:**

```json
{
  \"success\": true,
  \"data\": {
    \"symbol\": \"AAPL\",
    \"total_tweets\": 30,
    \"overall_sentiment\": 0.76,
    \"sentiment_breakdown\": {
      \"positive\": 22,
      \"neutral\": 6,
      \"negative\": 2
    },
    \"tweets\": [
      {
        \"text\": \"$AAPL breaking resistance! \ud83d\ude80\",
        \"created_at\": \"2024-01-15T14:20:00Z\",
        \"like_count\": 45,
        \"retweet_count\": 12,
        \"reply_count\": 8,
        \"quote_count\": 3,
        \"id\": \"tweet_123\",
        \"sentiment\": 0.9,
        \"author\": \"trader_expert\",
        \"verified\": true,
        \"follower_count\": 15000
      }
    ],
    \"engagement_metrics\": {
      \"total_likes\": 1250,
      \"total_retweets\": 340,
      \"average_engagement\": 0.045
    }
  }
}
```

---

### Stock Data

#### `GET /stock/{symbol}`

Get detailed stock data and technical indicators.

**Parameters:**

- `symbol` (path, required): Stock symbol
- `days` (query, optional): Number of days for historical data (default: 30)
- `interval` (query, optional): Data interval (1m, 5m, 15m, 30m, 1h, 1d, default: 1d)
- `indicators` (query, optional): Comma-separated list of indicators (rsi,macd,sma,ema,bollinger)

**Example Request:**

```http
GET /api/stock/AAPL?days=90&indicators=rsi,macd,sma
```

**Example Response:**

```json
{
  \"success\": true,
  \"data\": {
    \"symbol\": \"AAPL\",
    \"current_price\": 150.25,
    \"price_change\": 2.50,
    \"price_change_percent\": 1.69,
    \"volume\": 1234567,
    \"average_volume\": 1150000,
    \"market_cap\": 2500000000000,
    \"pe_ratio\": 28.5,
    \"eps\": 5.28,
    \"dividend_yield\": 0.015,
    \"52_week_high\": 195.89,
    \"52_week_low\": 124.17,
    \"historical_data\": {
      \"dates\": [\"2024-01-01\", \"2024-01-02\", \"...\"],
      \"open\": [148.20, 149.30, \"...\"],
      \"high\": [149.80, 150.45, \"...\"],
      \"low\": [147.90, 148.75, \"...\"],
      \"close\": [148.50, 149.75, \"...\"],
      \"volume\": [1200000, 1150000, \"...\"]
    },
    \"technical_indicators\": {
      \"rsi\": {
        \"current\": 62.5,
        \"signal\": \"Neutral\",
        \"description\": \"RSI indicates neutral momentum\"
      },
      \"macd\": {
        \"macd\": 1.25,
        \"signal\": 1.15,
        \"histogram\": 0.10,
        \"signal\": \"Bullish\",
        \"description\": \"MACD line above signal line\"
      },
      \"sma\": {
        \"sma_20\": 149.85,
        \"sma_50\": 147.32,
        \"sma_200\": 142.18,
        \"signal\": \"Bullish\",
        \"description\": \"Price above all SMAs\"
      }
    },
    \"support_resistance\": {
      \"support_levels\": [145.00, 142.50, 138.75],
      \"resistance_levels\": [152.00, 155.50, 158.25]
    }
  }
}
```

---

### Company Information

#### `GET /finnhub/profile/{symbol}`

Get detailed company profile information.

**Parameters:**

- `symbol` (path, required): Stock symbol

**Example Response:**

```json
{
  \"success\": true,
  \"data\": {
    \"symbol\": \"AAPL\",
    \"name\": \"Apple Inc.\",
    \"country\": \"United States\",
    \"currency\": \"USD\",
    \"exchange\": \"NASDAQ\",
    \"ipo\": \"1980-12-12\",
    \"market_capitalization\": 2800000,
    \"share_outstanding\": 15550000,
    \"industry\": \"Technology\",
    \"sector\": \"Consumer Electronics\",
    \"website\": \"https://www.apple.com\",
    \"phone\": \"+1-408-996-1010\",
    \"address\": \"One Apple Park Way, Cupertino, CA 95014\",
    \"city\": \"Cupertino\",
    \"state\": \"California\",
    \"country\": \"United States\",
    \"employees\": 154000,
    \"logo\": \"https://static.finnhub.io/logo/87cb30d8-80df-11ea-8951-00155d64f8a3.png\",
    \"finnhub_industry\": \"Technology\",
    \"description\": \"Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.\"
  }
}
```

#### `GET /finnhub/news/{symbol}`

Get latest news articles for a company.

**Parameters:**

- `symbol` (path, required): Stock symbol
- `from` (query, optional): Start date (YYYY-MM-DD)
- `to` (query, optional): End date (YYYY-MM-DD)
- `limit` (query, optional): Number of articles (default: 20, max: 50)

**Example Response:**

```json
{
  \"success\": true,
  \"data\": {
    \"symbol\": \"AAPL\",
    \"total_articles\": 15,
    \"overall_sentiment\": 0.75,
    \"articles\": [
      {
        \"id\": \"article_123\",
        \"headline\": \"Apple Reports Strong Q4 Earnings\",
        \"summary\": \"Apple Inc. reported better-than-expected quarterly earnings...\",
        \"url\": \"https://example.com/news/1\",
        \"source\": \"Financial Times\",
        \"datetime\": 1705320600,
        \"image\": \"https://example.com/image.jpg\",
        \"sentiment\": 0.8,
        \"category\": \"earnings\",
        \"related_symbols\": [\"AAPL\"]
      }
    ],
    \"sentiment_breakdown\": {
      \"positive\": 12,
      \"neutral\": 2,
      \"negative\": 1
    },
    \"category_breakdown\": {
      \"earnings\": 5,
      \"product\": 4,
      \"general\": 3,
      \"analysis\": 3
    }
  }
}
```

---

## Error Codes

| Code                  | Description                  | HTTP Status |
| --------------------- | ---------------------------- | ----------- |
| `INVALID_SYMBOL`      | Invalid stock symbol format  | 400         |
| `SYMBOL_NOT_FOUND`    | Stock symbol not found       | 404         |
| `INVALID_PARAMETER`   | Invalid query parameter      | 400         |
| `RATE_LIMIT_EXCEEDED` | Too many requests            | 429         |
| `SERVICE_UNAVAILABLE` | External service unavailable | 503         |
| `INTERNAL_ERROR`      | Internal server error        | 500         |
| `TIMEOUT_ERROR`       | Request timeout              | 408         |
| `VALIDATION_ERROR`    | Data validation failed       | 422         |

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Burst**: Up to 20 requests in 10 seconds
- **Headers**: Rate limit information included in response headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705320660
```

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require("axios");

const api = axios.create({
  baseURL: "https://your-api-domain.com/api",
  timeout: 10000,
});

// Get stock analysis
async function analyzeStock(symbol) {
  try {
    const response = await api.get(`/analyze/${symbol}`);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.data?.error);
    throw error;
  }
}

// Usage
analyzeStock("AAPL")
  .then((data) => console.log(data))
  .catch((error) => console.error(error));
```

### Python

```python
import requests
from typing import Dict, Any

class StockSentimentAPI:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.timeout = 10

    def analyze_stock(self, symbol: str, **params) -> Dict[str, Any]:
        \"\"\"Get comprehensive stock analysis.\"\"\"
        response = self.session.get(
            f\"{self.base_url}/analyze/{symbol}\",
            params=params
        )
        response.raise_for_status()
        return response.json()

    def get_reddit_sentiment(self, symbol: str, limit: int = 50) -> Dict[str, Any]:
        \"\"\"Get Reddit sentiment data.\"\"\"
        response = self.session.get(
            f\"{self.base_url}/reddit/{symbol}\",
            params={'limit': limit}
        )
        response.raise_for_status()
        return response.json()

# Usage
api = StockSentimentAPI('https://your-api-domain.com/api')
result = api.analyze_stock('AAPL')
print(result)
```

### cURL

```bash
# Get stock analysis
curl -X GET \"https://your-api-domain.com/api/analyze/AAPL\" \\n  -H \"Accept: application/json\"

# Get Reddit sentiment with parameters
curl -X GET \"https://your-api-domain.com/api/reddit/AAPL?limit=25&sort=top\" \\n  -H \"Accept: application/json\"
```

## Webhooks (Coming Soon)

Webhook support for real-time notifications:

- **Price alerts**: Get notified when stock price crosses thresholds
- **Sentiment changes**: Alerts for significant sentiment shifts
- **News updates**: Real-time news article notifications

## Support

- **API Issues**: [GitHub Issues](https://github.com/yourusername/stock-sentiment-analyzer/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/stock-sentiment-analyzer/discussions)
- **Documentation**: [Full Documentation](../README.md)

---

_Last updated: January 15, 2024_
