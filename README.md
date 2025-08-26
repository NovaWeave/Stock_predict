## Stock Sentiment Analyzer

Production-ready monorepo with a Flask backend and Next.js frontend.

### Structure
- `backend/`: Flask API (WSGI via Gunicorn). Endpoints under `/api/*`.
- `frontend/`: Next.js app with Tailwind UI.

### Quick Start (Local)
1) Backend
   - cd backend
   - python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
   - Optional: copy `env.template` → `.env` (or set env vars)
   - Set env (PowerShell):
     - `$env:FLASK_ENV='production'`
     - `$env:MOCK_DATA_ENABLED='true'`
   - Run: `.venv/Scripts/python stock_sentiment.py --web` or `python stock_sentiment.py --web`
   - API: http://localhost:5000/api/health

2) Frontend
   - cd frontend
   - npm install
   - Create `.env.local` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`
   - npm run dev → http://localhost:3000

### Deploy (Render)
Option A: Blueprint
- New → Blueprint on Render, select this repo. Uses `render.yaml` to provision the backend.

Option B: Manual
- Root: `backend`
- Build: `pip install -r requirements.txt`
- Start: `gunicorn -w 2 -b 0.0.0.0:${PORT} wsgi:application`
- Health: `/api/health`
- Env: `FLASK_ENV=production`, `SECRET_KEY`, `CORS_ORIGINS`, optional `MOCK_DATA_ENABLED=true`, `FINNHUB_API_KEY`, `REDDIT_CLIENT_ID/_SECRET/_USER_AGENT`

Frontend (Vercel/Render/Netlify)
- Set `NEXT_PUBLIC_API_BASE_URL` to the backend URL (e.g., `https://<service>.onrender.com`).

### Notes
- Without keys, backend uses Yahoo Finance fallback and mock data where needed.

