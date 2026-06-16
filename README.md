# Smart Trust Meter

AI-powered car dealership trust evaluation using transformer sentiment analysis.

## Quick demo (one command)

### Option A — Docker (recommended once Docker Desktop is running)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) **to be open and running** (whale icon in the menu bar — not spinning).

```bash
npm run demo
```

**"Cannot connect to the Docker daemon"?**

1. Open **Docker Desktop** from Applications (or run `open -a Docker`).
2. Wait until the menu bar icon is steady (not "Starting…").
3. Verify: `docker info` (should show Server Version, not an error).
4. Run again: `npm run demo`

```bash
npm run demo:restart  # after changing backend/.env
npm run demo:down     # stop
npm run demo:logs     # follow logs
```

Open **http://localhost:3000** once all services are healthy (ML startup can take 2–3 minutes on first run).

### Option B — No Docker

If Docker is unavailable, run everything natively (uses your Atlas `test` DB from `backend/.env`):

```bash
npm run demo:local
```

Open **http://localhost:5173**

Uses **MongoDB Atlas** from `backend/.env`. Your data should be in the database named in the URI (e.g. `...mongodb.net/test`).

**Check backend connected to the right DB** — in logs you should see:
```
MongoDB Connected → database: test (10 dealerships)
```

If you see `(0 dealerships)`, your URI points at an empty database. Update `MONGODB_URI` in `backend/.env` and run `npm run demo:restart`.

**Atlas network access:** Docker containers use a different outbound IP. In MongoDB Atlas → Network Access, allow `0.0.0.0/0` (or your current IP) so containers can connect.

| Service   | URL |
|-----------|-----|
| Frontend  | http://localhost:3000 |
| API       | http://localhost:5000/api |
| ML        | http://localhost:5001/health |
| Database  | MongoDB Atlas (see `backend/.env`) |

Stop: `npm run demo:down`

---

## Run locally (without Docker)

Three terminals: ML service, API, frontend.

### 1. ML inference (port 5001)

```bash
cd nlp
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-transformer.txt
python -m textblob.download_corpora   # LSTM only
MODEL_TYPE=transformer python app.py
```

### 2. Backend (port 5000)

Uses `MONGODB_URI` from `backend/.env` (your Atlas cluster).

```bash
cd backend
cp .env.example .env   # or use your existing .env
npm install && npm start
```

### 3. Frontend (port 5173)

```bash
cd frontend
cp .env.example .env
npm install && npm run dev
```

Open http://localhost:5173

---

## Deploy to the cloud (public demo URL)

### Frontend → Vercel

1. Push repo to GitHub.
2. Import project in [Vercel](https://vercel.com) → root: `frontend`.
3. Set env: `VITE_API_URL=https://YOUR-BACKEND.onrender.com/api`
4. Deploy.

### Backend → Render

1. New **Web Service** → root: `backend`, build: `npm install`, start: `node server.js`.
2. Env vars:
   - `MONGODB_URI` — [MongoDB Atlas](https://www.mongodb.com/atlas) connection string
   - `ML_SERVICE_URL` — URL of ML service below
   - `CORS_ORIGIN` — your Vercel URL (e.g. `https://smart-trust-meter.vercel.app`)
   - `ADMIN_API_KEY` — random secret for admin routes

### ML service → Render

1. New **Web Service** → root: `nlp`, Dockerfile path: `Dockerfile`.
2. Env: `MODEL_TYPE=transformer`, `ML_PORT=10000` (Render sets `PORT`; update `app.py` if needed).
3. Plan: at least **512 MB RAM**; model image ~600 MB.

> **Tip:** For a class demo, Docker on your laptop is often enough. Cloud deploy is optional but impressive.

---

## How sentiment works

- Feedback is scored by the **transformer** (DistilBERT multilingual, ~90% English, ~79% Roman Urdu).
- Fallback: keyword lexicon if ML is down.
- View live stats: **AI Model** page in the app.

## Model comparison

| Model | English | Roman Urdu | F1 |
|-------|---------|------------|-----|
| LSTM | 82.2% | — | 0.86 |
| **DistilBERT + RU aug** | **90.0%** | **79.2%** | **0.92** |

Retrain: `cd nlp && python train_transformer.py`  
Roman Urdu eval: `python eval_roman_urdu.py`

## Environment

| Variable | Service | Default |
|----------|---------|---------|
| `MODEL_TYPE` | ML | `transformer` in Docker |
| `ML_SERVICE_URL` | Backend | `http://localhost:5001` |
| `CORS_ORIGIN` | Backend | open (dev) |
| `ADMIN_API_KEY` | Backend | unset = admin open (dev only) |
| `VITE_API_URL` | Frontend | `http://localhost:5000/api` |
