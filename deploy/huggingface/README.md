---
title: STM Sentiment
emoji: 🤖
colorFrom: indigo
colorTo: violet
sdk: docker
app_port: 7860
pinned: false
---

# Smart Trust Meter — ML inference

DistilBERT multilingual sentiment API for [Smart Trust Meter](https://github.com/fawad1386/STM).

**Space secrets** (Settings → Repository secrets):

| Secret | Example |
|--------|---------|
| `TRANSFORMER_HF_REPO` | `your-username/stm-sentiment` |

Endpoints: `GET /health`, `POST /predict` with `{ "text": "..." }`.
