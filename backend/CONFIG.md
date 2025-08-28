# Configuration Management Guide

## Overview

The Stock Sentiment Analyzer uses a comprehensive configuration management system with validation, environment detection, and security best practices.

## Configuration Files

### Enhanced Configuration System

- **`config_enhanced.py`**: Main configuration module with validation
- **`.env.sample`**: Template environment file with all options
- **`config.py`**: Legacy configuration (maintained for compatibility)

## Environment Variables

### Core Flask Configuration

| Variable      | Type    | Default        | Required | Description                                       |
| ------------- | ------- | -------------- | -------- | ------------------------------------------------- |
| `SECRET_KEY`  | string  | auto-generated | No\*     | Flask secret key for sessions                     |
| `FLASK_ENV`   | string  | `production`   | No       | Environment mode (development/production/testing) |
| `FLASK_DEBUG` | boolean | `false`        | No       | Enable debug mode (development only)              |

\*Note: SECRET_KEY is auto-generated for development but should be set in production.

### Server Configuration

| Variable | Type    | Default   | Required | Description           |
| -------- | ------- | --------- | -------- | --------------------- |
| `HOST`   | string  | `0.0.0.0` | No       | Server bind address   |
| `PORT`   | integer | `5000`    | No       | Server port (1-65535) |

### API Configuration

| Variable      | Type   | Default  | Required | Description                                       |
| ------------- | ------ | -------- | -------- | ------------------------------------------------- |
| `API_VERSION` | string | `v1.0.0` | No       | API version identifier                            |
| `LOG_LEVEL`   | string | `INFO`   | No       | Logging level (DEBUG/INFO/WARNING/ERROR/CRITICAL) |

### Security Configuration

| Variable                | Type    | Default                 | Required | Description                            |
| ----------------------- | ------- | ----------------------- | -------- | -------------------------------------- |
| `SESSION_COOKIE_SECURE` | boolean | `true`                  | No       | Require HTTPS for cookies              |
| `CORS_ORIGINS`          | string  | `http://localhost:3000` | No       | Allowed CORS origins (comma-separated) |

### Rate Limiting

| Variable                | Type    | Default          | Required | Description                |
| ----------------------- | ------- | ---------------- | -------- | -------------------------- |
| `RATELIMIT_ENABLED`     | boolean | `true`           | No       | Enable API rate limiting   |
| `RATELIMIT_DEFAULT`     | string  | `100 per minute` | No       | Default rate limit         |
| `RATELIMIT_STORAGE_URL` | string  | `memory://`      | No       | Rate limit storage backend |

### Performance Configuration

| Variable                | Type    | Default    | Required | Description                      |
| ----------------------- | ------- | ---------- | -------- | -------------------------------- |
| `MAX_CONTENT_LENGTH`    | integer | `16777216` | No       | Max request size in bytes (16MB) |
| `REQUEST_TIMEOUT`       | integer | `30`       | No       | Request timeout in seconds       |
| `CACHE_DEFAULT_TIMEOUT` | integer | `300`      | No       | Cache timeout in seconds         |

### External API Keys (Optional)

All external API keys are optional. The system will use mock data when keys are not provided.

#### Reddit API

| Variable               | Required | Description                  |
| ---------------------- | -------- | ---------------------------- |
| `REDDIT_CLIENT_ID`     | No       | Reddit API client ID         |
| `REDDIT_CLIENT_SECRET` | No       | Reddit API client secret     |
| `REDDIT_USER_AGENT`    | No       | Reddit API user agent string |

#### X (Twitter) API

| Variable                | Required | Description           |
| ----------------------- | -------- | --------------------- |
| `X_BEARER_TOKEN`        | No       | X API v2 bearer token |
| `X_API_KEY`             | No       | X API key             |
| `X_API_SECRET`          | No       | X API secret          |
| `X_ACCESS_TOKEN`        | No       | X access token        |
| `X_ACCESS_TOKEN_SECRET` | No       | X access token secret |

#### Finnhub API

| Variable          | Required | Description                    |
| ----------------- | -------- | ------------------------------ |
| `FINNHUB_API_KEY` | No       | Finnhub API key for stock data |

### Performance Configuration

### 1. Copy Sample Environment File

```bash
cp .env.sample .env
```

### 2. Configure Required Settings

Edit the `.env` file with your specific values:

```bash
# Minimum production setup
SECRET_KEY=your-secure-secret-key-here-32-chars-minimum
FLASK_ENV=production
CORS_ORIGINS=https://yourdomain.com

# Optional: Add API keys for live data
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
FINNHUB_API_KEY=your_finnhub_api_key
```

### 3. Validate Configuration

```bash
python config_enhanced.py validate
```

### 4. View Configuration Summary

```bash
python config_enhanced.py summary
```

## Configuration Validation

The enhanced configuration system includes:

- **Type validation**: Ensures correct data types
- **Range validation**: Validates numeric ranges
- **Custom validators**: Business logic validation
- **Required field checking**: Ensures critical settings exist
- **Warning system**: Alerts for missing optional but important settings

### Running Validation

```bash
# Validate current configuration
python config_enhanced.py validate

# Output example:
✅ Configuration validation passed
Environment: production
API Keys available: {'reddit': False, 'x_twitter': False, 'finnhub': False}
```

## Security Best Practices

### 1. Secret Key Management

- Use a strong, random SECRET_KEY in production
- Never commit secrets to version control
- Rotate keys periodically

### 2. Environment Variables

- Store all sensitive data in environment variables
- Use different configurations for each environment
- Validate configuration on startup

### 3. CORS Configuration

- Specify exact origins in production
- Avoid using wildcards (`*`) in production
- Include both HTTP and HTTPS if needed

### 4. Session Security

- Enable `SESSION_COOKIE_SECURE` in production
- Use `SESSION_COOKIE_HTTPONLY` (always enabled)
- Set appropriate `SESSION_COOKIE_SAMESITE`

## API Key Setup

### Reddit API Setup

1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps/)
2. Create a new application
3. Set type to "script"
4. Copy client ID and secret

### X (Twitter) API Setup

1. Apply for [Twitter Developer Account](https://developer.twitter.com/)
2. Create a new app
3. Generate bearer token or API keys
4. Copy credentials

### Finnhub API Setup

1. Sign up at [Finnhub](https://finnhub.io/)
2. Get free API key from dashboard
3. Copy API key

## Troubleshooting

### Common Issues

1. **Configuration Validation Failed**

   - Check environment variable syntax
   - Verify required fields are set
   - Run validation for detailed errors

2. **API Keys Not Working**

   - Verify credentials are correct
   - Check API quotas and limits
   - Ensure environment variables are loaded

3. **CORS Errors**

   - Check CORS_ORIGINS configuration
   - Verify frontend URL matches exactly
   - Include protocol (http/https)

4. **Session Issues**
   - Set SECRET_KEY for persistent sessions
   - Check cookie security settings
   - Verify HTTPS in production

### Debug Commands

```bash
# Validate configuration
python config_enhanced.py validate

# Show configuration summary
python config_enhanced.py summary

# Create new sample file
python config_enhanced.py sample

# Check API key availability
python -c "from config_enhanced import get_config; print(get_config().validate_api_keys())"
```

## Migration Guide

### From Legacy config.py

The enhanced configuration system is backward compatible. To migrate:

1. Replace `from config import get_config` with `from config_enhanced import get_config`
2. Update environment variables according to this guide
3. Run validation to ensure compatibility
4. Test thoroughly in staging environment

### Environment Variable Changes

No breaking changes to environment variables. All existing variables continue to work with the enhanced system.
