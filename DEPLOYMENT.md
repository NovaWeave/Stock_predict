# 🚀 Stock Sentiment Analyzer - Deployment Guide

## Quick Start

### 1. Docker Compose (Recommended)

```bash
# Clone the repository
git clone <your-repository-url>
cd Stock_predict

# Copy environment template
cp .env.production.template .env.production

# Edit with your API keys (optional)
nano .env.production

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# API Health: http://localhost:5000/api/health
```

### 2. Kubernetes (Production)

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=stock-sentiment

# Get service URL
kubectl get service stock-sentiment-frontend
```

## Production Deployment Options

### 🐳 Docker Deployment

#### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ RAM
- 10GB+ storage

#### Environment Setup

1. **Copy environment template:**

   ```bash
   cp .env.production.template .env.production
   ```

2. **Configure API keys** (optional but recommended):

   ```bash
   # Reddit API
   REDDIT_CLIENT_ID=your_reddit_client_id
   REDDIT_CLIENT_SECRET=your_reddit_client_secret

   # X (Twitter) API
   X_BEARER_TOKEN=your_x_bearer_token

   # Finnhub API
   FINNHUB_API_KEY=your_finnhub_api_key
   ```

3. **Set security settings:**
   ```bash
   SECRET_KEY=your-super-secure-32-character-secret-key
   CORS_ORIGINS=https://yourdomain.com
   ```

#### Deployment Commands

```bash
# Production deployment
docker-compose --env-file .env.production up -d

# Development deployment
docker-compose -f docker-compose.dev.yml up -d

# With monitoring
docker-compose --profile monitoring up -d

# Scale services
docker-compose up -d --scale backend=3 --scale frontend=2
```

### ☁️ Cloud Platform Deployment

#### Render.com

```bash
# Use the included render.yaml
# 1. Connect your GitHub repository to Render
# 2. Deploy using the blueprint
# 3. Set environment variables in dashboard
```

#### Vercel (Frontend Only)

```bash
npm i -g vercel
cd frontend
vercel --prod
```

#### Heroku

```bash
# Backend
heroku create your-app-backend
heroku config:set FLASK_ENV=production
git subtree push --prefix=backend heroku main

# Frontend
heroku create your-app-frontend
heroku config:set NODE_ENV=production
git subtree push --prefix=frontend heroku main
```

#### AWS/GCP/Azure

- Use provided Kubernetes manifests in `k8s/` directory
- Configure load balancer and SSL certificates
- Set up monitoring and logging

## Configuration

### Environment Variables

| Variable           | Required | Default   | Description                       |
| ------------------ | -------- | --------- | --------------------------------- |
| `SECRET_KEY`       | ✅       | -         | Flask secret key (32+ characters) |
| `CORS_ORIGINS`     | ✅       | localhost | Allowed origins for CORS          |
| `FINNHUB_API_KEY`  | ⚠️       | -         | Finnhub API key for stock data    |
| `REDDIT_CLIENT_ID` | ⚠️       | -         | Reddit API client ID              |
| `X_BEARER_TOKEN`   | ⚠️       | -         | X (Twitter) API bearer token      |

⚠️ = Optional but recommended for full functionality

### Security Checklist

- [ ] Set strong `SECRET_KEY` (32+ characters)
- [ ] Configure proper `CORS_ORIGINS`
- [ ] Enable SSL/TLS certificates
- [ ] Set up rate limiting
- [ ] Configure firewall rules
- [ ] Enable container security scanning
- [ ] Set up monitoring and alerting

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend health
curl http://localhost:3000

# Redis health
docker exec stock-sentiment-redis redis-cli ping
```

### Logs

```bash
# Application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# All services
docker-compose logs -f
```

### Metrics (Optional)

Access monitoring dashboards:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

## Scaling

### Horizontal Scaling

```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Scale with load balancer
docker-compose --profile production up -d
```

### Vertical Scaling

Update resource limits in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
```

## Backup & Recovery

### Database Backup (Redis)

```bash
# Backup Redis data
docker exec stock-sentiment-redis redis-cli BGSAVE
docker cp stock-sentiment-redis:/data/dump.rdb ./backup/

# Restore Redis data
docker cp ./backup/dump.rdb stock-sentiment-redis:/data/
docker restart stock-sentiment-redis
```

### Application Data

```bash
# Backup logs and cache
docker run --rm -v stock-sentiment_backend_logs:/data alpine tar czf - /data > backup_logs.tar.gz
```

## Troubleshooting

### Common Issues

1. **API Keys Not Working**

   ```bash
   # Check environment variables
   docker exec stock-sentiment-backend env | grep API

   # Test API endpoints
   curl http://localhost:5000/api/health
   ```

2. **CORS Errors**

   ```bash
   # Update CORS_ORIGINS
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

3. **Performance Issues**

   ```bash
   # Enable Redis caching
   CACHE_TYPE=redis
   CACHE_REDIS_URL=redis://redis:6379/0
   ```

4. **Memory Issues**
   ```bash
   # Increase Docker memory limit
   docker update --memory 2g stock-sentiment-backend
   ```

### Debug Mode

```bash
# Enable debug logging
FLASK_DEBUG=true
LOG_LEVEL=DEBUG

# Restart services
docker-compose restart
```

## Maintenance

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Cleanup

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

## Support

- 📚 **Documentation**: [README.md](./README.md)
- 🐛 **Issues**: Create GitHub issue
- 💬 **Discussions**: GitHub discussions
- 📧 **Email**: your-email@domain.com
