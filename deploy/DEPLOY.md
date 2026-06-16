# Deploy Smart Trust Meter (100% free tier)

Live stack:

| Layer | Platform | Free tier |
|-------|----------|-----------|
| Frontend | [Vercel](https://vercel.com) | Unlimited hobby |
| API | [Render](https://render.com) | 750 hrs/mo, cold starts |
| ML model | [Hugging Face Spaces](https://huggingface.co/spaces) | 2 vCPU, 16 GB RAM |
| Database | [MongoDB Atlas](https://mongodb.com/atlas) | M0 cluster (you already have this) |

> **Why not ML on Render free?** Render free gives 512 MB RAM — DistilBERT + PyTorch needs ~1 GB and will OOM. Hugging Face Spaces is the right free home for the model.

---

## Step 0 — One-time: upload model to Hugging Face

The fine-tuned model (~532 MB) is gitignored. Cloud hosts download it from Hugging Face Hub.

```bash
pip install huggingface_hub
huggingface-cli login          # create free account at huggingface.co

bash scripts/upload-model-to-hf.sh YOUR_USERNAME/stm-sentiment
```

Note your repo id, e.g. `fawad1386/stm-sentiment`.

---

## Step 1 — Deploy ML on Hugging Face Spaces (recommended)

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. Name: `stm-sentiment`, SDK: **Docker**, visibility: Public
3. After creation, upload these two files from `deploy/huggingface/`:
   - `Dockerfile`
   - `README.md` (replace the auto-generated one)
4. **Settings → Repository secrets** → add:
   - `TRANSFORMER_HF_REPO` = `YOUR_USERNAME/stm-sentiment`
5. Wait for build (~5–10 min first time). Open the Space URL.
6. Test: `https://YOUR_USERNAME-stm-sentiment.hf.space/health`

First request after idle may take ~30s (Space waking up).

---

## Step 2 — Deploy backend on Render

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**
2. Connect GitHub repo `fawad1386/STM`
3. Use **`render-backend.yaml`** (recommended) or full `render.yaml` if you want ML on Render too
4. Set environment variables when prompted:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your Atlas URI (`...mongodb.net/test`) |
| `ML_SERVICE_URL` | `https://YOUR_USERNAME-stm-sentiment.hf.space` |
| `CORS_ORIGIN` | Set after Step 3 — your Vercel URL |

5. Deploy. Note backend URL: `https://stm-backend-xxxx.onrender.com`

**Atlas:** Network Access → allow `0.0.0.0/0` so Render can connect.

**Verify:** `https://stm-backend-xxxx.onrender.com/api/health` — `ml.status` should be `"ok"`.

> Render free services **sleep after 15 min idle**. First request takes ~30–60s.

---

## Step 3 — Deploy frontend on Vercel

1. [vercel.com/new](https://vercel.com/new) → Import `fawad1386/STM`
2. **Root Directory:** `frontend`
3. Framework: Vite (auto-detected)
4. Environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://stm-backend-xxxx.onrender.com/api` |

5. Deploy → you get `https://stm-xxxx.vercel.app`

6. Go back to **Render** → update `CORS_ORIGIN` to your Vercel URL (no trailing slash):

```
CORS_ORIGIN=https://stm-xxxx.vercel.app
```

Redeploy backend (or it picks up env changes automatically).

---

## Step 4 — Smoke test

1. Open Vercel URL → home page loads with dealership stats
2. **AI Model** page → ML service shows online
3. **Submit Feedback** → sentiment shows `transformer` source (not `lexicon`)
4. **Dealership detail** → trust score chart renders

---

## Alternative: all-in-one Render (`render.yaml`)

Deploys backend + ML on Render from one blueprint. Set `TRANSFORMER_HF_REPO` for the ML service.

⚠️ ML may fail on free 512 MB RAM. If `/api/health` shows `ml.status: error`, switch to Hugging Face Spaces (Step 1) and use `render-backend.yaml` instead.

---

## Environment reference

| Variable | Where | Example |
|----------|-------|---------|
| `VITE_API_URL` | Vercel | `https://stm-backend.onrender.com/api` |
| `MONGODB_URI` | Render | `mongodb+srv://...@cluster.mongodb.net/test` |
| `ML_SERVICE_URL` | Render | `https://user-stm-sentiment.hf.space` |
| `CORS_ORIGIN` | Render | `https://stm.vercel.app` |
| `TRANSFORMER_HF_REPO` | HF Space / Render ML | `user/stm-sentiment` |
| `ADMIN_API_KEY` | Render | auto-generated — keep secret |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `(0 dealerships)` on backend | Wrong Atlas DB in URI — use `/test` not empty DB |
| CORS error in browser | Set `CORS_ORIGIN` to exact Vercel URL, redeploy backend |
| ML offline / lexicon fallback | Wake HF Space (visit `/health`), check `ML_SERVICE_URL` has `https://` |
| Render 502 on first load | Normal cold start — wait 60s, refresh |
| HF Space build fails | Check `TRANSFORMER_HF_REPO` secret is set and model repo is public |
| Atlas connection refused | Add `0.0.0.0/0` in Atlas Network Access |

---

## Custom domains (optional, still free)

- **Vercel:** Project → Settings → Domains
- **Render:** Service → Settings → Custom Domain

Update `CORS_ORIGIN` and `VITE_API_URL` if you add domains.
