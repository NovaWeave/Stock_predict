## Stock Sentiment Analyzer

Production-ready, full-stack app for AI-powered stock sentiment analysis from Reddit and X, combined with financial data and technical indicators.

### Monorepo Structure

- `backend/` Flask API (served via WSGI/ASGI)
- `frontend/` Next.js 15 app

### Quick Start (Local)

1. Backend
   - cd backend
   - python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
   - Copy `env.template` to `.env` and fill values
   - Run: `.venv/Scripts/python stock_sentiment.py --web`

2. Frontend
   - cd frontend
   - npm install
   - npm run dev
   - Open http://localhost:3000

### Production

- Backend
  - Use gunicorn/uvicorn behind Nginx/Render/Fly/Heroku
  - Set env `FLASK_ENV=production` and `SECRET_KEY`
- Frontend
  - Build with `npm run build` and host on Vercel/Netlify, or serve statically
  - Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL

### Security

- SECRET_KEY must be set in environment (never commit secrets)
- CORS origins controlled via `CORS_ORIGINS`

### License

MIT

