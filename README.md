# KindleRead — Online Book Reading App

A Kindle-inspired book reading website with progress tracking.

## Tech Stack
- **Frontend**: Next.js 14 + Tailwind CSS (deploy to Vercel)
- **Backend**: FastAPI + SQLite (deploy to Railway / Render)

## Features
- Browse a library of classic books
- Login / Register / Logout
- Track reading progress per book (scroll-based)
- Resume reading from exactly where you left off
- "Continue Reading" section for in-progress books
- Responsive design (mobile, tablet, desktop)

---

## Running Locally

### 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # edit JWT_SECRET
uvicorn main:app --reload --port 8000
```

API will be live at http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.local.example .env.local
# .env.local already points to http://localhost:8000
npm run dev
```

Open http://localhost:3000

---

## Deploying to Production

### Frontend → Vercel

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Set root directory to `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your backend URL (e.g. `https://my-api.railway.app`)
5. Deploy

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Set root directory to `backend`
3. Add environment variable: `JWT_SECRET=<strong-random-string>`
4. Railway auto-detects Python; start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Backend → Render

1. New Web Service → connect GitHub repo
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add env var: `JWT_SECRET=<strong-random-string>`

---

## Project Structure

```
camel-up/
├── backend/
│   ├── main.py          # FastAPI app (auth, books, progress)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── pages/
    │   ├── index.js     # Library homepage
    │   ├── login.js     # Login page
    │   ├── register.js  # Register page
    │   ├── reader/[id].js  # Book reader with progress
    │   └── 404.js
    ├── components/
    │   ├── Navbar.js
    │   ├── BookCard.js
    │   └── ProgressBar.js
    ├── context/
    │   └── AuthContext.js
    ├── lib/
    │   └── api.js       # Axios instance with JWT
    └── styles/
        └── globals.css
```
