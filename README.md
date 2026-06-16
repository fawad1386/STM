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

Full step-by-step guide: **[deploy/DEPLOY.md](deploy/DEPLOY.md)**

### Quick overview (all free)

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | **Vercel** | Root: `frontend`, env: `VITE_API_URL` |
| Backend | **Render** | Root: `backend`, use `render-backend.yaml` |
| ML | **Hugging Face Spaces** | 16 GB RAM free — Render 512 MB is too small |
| Database | **MongoDB Atlas** | Your existing M0 cluster |

### Before you deploy

Upload the fine-tuned model (gitignored, ~532 MB):

```bash
python3 -m pip install huggingface_hub
export PATH="$HOME/Library/Python/3.9/bin:$PATH"
hf auth login
bash scripts/upload-model-to-hf.sh YOUR_USERNAME/stm-sentiment
```

### Deploy order

1. **HF Space** — upload `deploy/huggingface/Dockerfile` + `README.md`, set secret `TRANSFORMER_HF_REPO`
2. **Render backend** — Blueprint from `render-backend.yaml`, set `MONGODB_URI`, `ML_SERVICE_URL`, `CORS_ORIGIN`
3. **Vercel frontend** — root `frontend`, set `VITE_API_URL=https://YOUR-BACKEND.onrender.com/api`

> Render free tier sleeps after 15 min idle (first load ~30–60s). HF Spaces also sleep when idle.

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
