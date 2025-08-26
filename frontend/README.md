# Stock Sentiment Analyzer - Frontend

Modern Next.js frontend for the Stock Sentiment Analyzer application.

## Features

- **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Real-time Analysis**: Live stock sentiment analysis from multiple sources
- **Interactive Charts**: Chart.js integration for data visualization
- **Responsive Design**: Mobile-first design that works on all devices
- **Dark Theme**: Beautiful dark theme optimized for financial data

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **UI Components**: Headless UI

## Getting Started (Development)

### Prerequisites

- Node.js 18+ 
- Backend service running on `http://localhost:5000`
- Create `.env.local` with:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production

Set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL. Then:

```bash
npm run build
npm start
```

## Usage

1. Enter a stock symbol (e.g., AAPL, TSLA, GOOGL)
2. Click "Analyze" to get comprehensive sentiment analysis
3. View sentiment scores, trends, and social media insights
4. Explore company profile and latest news
5. Analyze technical indicators and price trends

## API Integration

The frontend connects to the backend API endpoints:

- `/api/analyze/<symbol>` - Comprehensive stock analysis
- `/api/trend/<symbol>` - Trend prediction
- `/api/reddit/<symbol>` - Reddit sentiment data
- `/api/x/<symbol>` - X (Twitter) sentiment data
- `/api/stock/<symbol>` - Stock data and indicators
- `/api/finnhub/profile/<symbol>` - Company profile
- `/api/finnhub/news/<symbol>` - Company news

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/          # React components
│   ├── StockAnalysis.tsx
│   ├── SentimentChart.tsx
│   ├── CompanyProfile.tsx
│   ├── SocialFeed.tsx
│   └── NewsSection.tsx
```

## Customization

- Modify colors in `tailwind.config.js`
- Update component styles in individual component files
- Add new features by extending the existing components
- Customize chart appearance in chart components

## Deployment

The frontend is ready for deployment on:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Any static hosting service

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new components
3. Maintain responsive design principles
4. Test on multiple screen sizes
