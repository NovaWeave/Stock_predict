# Vercel Deployment Guide for StockSentiment Pro

This guide will walk you through deploying your StockSentiment Pro application to Vercel.

## 🚀 Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [Git](https://git-scm.com/) installed
- [Node.js](https://nodejs.org/) (for Vercel CLI)
- Your API credentials ready

## 📋 Step-by-Step Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Prepare Your Project

Ensure your project structure looks like this:
```
stock-main/
├── src/
│   ├── enhanced_app.py
│   ├── x_sentiment.py
│   ├── reddit_sentiment.py
│   ├── enhanced_stock_data.py
│   └── templates/
│       └── enhanced_index.html
├── requirements.txt
├── vercel.json
├── runtime.txt
└── README.md
```

### 4. Deploy to Vercel

Navigate to your project directory and run:
```bash
vercel
```

Follow the prompts:
- Set up and deploy? `Y`
- Which scope? `Select your account`
- Link to existing project? `N`
- Project name? `stocksentiment-pro` (or your preferred name)
- Directory? `./` (current directory)
- Override settings? `N`

### 5. Configure Environment Variables

After deployment, go to your Vercel dashboard:

1. Select your project
2. Go to **Settings** → **Environment Variables**
3. Add the following variables:

```env
X_BEARER_TOKEN=your_actual_bearer_token
X_API_KEY=your_actual_api_key
X_API_SECRET=your_actual_api_secret
X_ACCESS_TOKEN=your_actual_access_token
X_ACCESS_TOKEN_SECRET=your_actual_access_token_secret
REDDIT_CLIENT_ID=your_actual_client_id
REDDIT_CLIENT_SECRET=your_actual_client_secret
REDDIT_USER_AGENT=your_actual_user_agent
```

4. Set the environment to **Production** for all variables
5. Click **Save**

### 6. Redeploy with Environment Variables

```bash
vercel --prod
```

## 🔧 Configuration Files

### vercel.json
This file tells Vercel how to build and route your application:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/enhanced_app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/enhanced_app.py"
    }
  ],
  "env": {
    "PYTHONPATH": "src"
  },
  "functions": {
    "src/enhanced_app.py": {
      "maxDuration": 30
    }
  }
}
```

### runtime.txt
Specifies the Python version:
```
python-3.9
```

## 🌐 Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Follow the DNS configuration instructions

## 📊 Monitoring and Analytics

### Vercel Analytics
- **Functions**: Monitor serverless function performance
- **Edge Network**: Check global performance
- **Real-time**: Live user analytics

### Performance Monitoring
- Function execution time
- Cold start latency
- Memory usage
- Error rates

## 🚨 Troubleshooting

### Common Issues

#### 1. Import Errors
**Problem**: Module not found errors
**Solution**: Ensure all dependencies are in `requirements.txt`

#### 2. Environment Variables Not Loading
**Problem**: API calls failing
**Solution**: 
- Check environment variables in Vercel dashboard
- Ensure variables are set to **Production** environment
- Redeploy after adding variables

#### 3. Function Timeout
**Problem**: 30-second timeout errors
**Solution**: 
- Optimize your code for faster execution
- Implement caching strategies
- Consider breaking large operations into smaller functions

#### 4. API Rate Limits
**Problem**: Twitter/Reddit API rate limit errors
**Solution**:
- Implement exponential backoff
- Add request caching
- Monitor API usage

### Debug Mode

For local debugging, you can run:
```bash
vercel dev
```

This will run your app locally with Vercel's development environment.

## 🔄 Continuous Deployment

### Automatic Deployments
- Connect your GitHub repository to Vercel
- Every push to main branch triggers automatic deployment
- Preview deployments for pull requests

### Manual Deployments
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy specific branch
vercel --prod --target production
```

## 📈 Scaling Considerations

### Serverless Functions
- **Cold Starts**: First request may be slower
- **Concurrent Limits**: Vercel handles scaling automatically
- **Memory**: Each function gets up to 3008MB RAM

### Performance Optimization
- Implement caching strategies
- Use async/await for I/O operations
- Minimize dependencies
- Optimize image sizes

## 🔒 Security Best Practices

### Environment Variables
- Never commit API keys to Git
- Use Vercel's environment variable system
- Rotate keys regularly

### API Security
- Implement rate limiting
- Validate user inputs
- Use HTTPS for all external calls

## 📱 Mobile Optimization

Your app is already mobile-responsive, but consider:
- Touch-friendly interactions
- Optimized loading times
- Progressive Web App features

## 🎯 Next Steps

After successful deployment:

1. **Test all features** on the live site
2. **Monitor performance** in Vercel dashboard
3. **Set up alerts** for errors and performance issues
4. **Optimize** based on real user data
5. **Scale** as your user base grows

## 📞 Support

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

**Happy Deploying! 🚀**
