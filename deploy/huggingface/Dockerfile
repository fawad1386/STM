# Standalone Hugging Face Space — clone this folder into a new HF Docker Space
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl git \
    && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/fawad1386/STM.git
RUN git clone --depth 1 "${REPO_URL}" /tmp/repo \
    && cp /tmp/repo/nlp/app.py /tmp/repo/nlp/transformer_predictor.py /tmp/repo/nlp/download_model.py /app/ \
    && cp /tmp/repo/nlp/requirements-docker.txt /app/requirements.txt \
    && rm -rf /tmp/repo

RUN pip install --no-cache-dir -r requirements.txt huggingface_hub

ENV TRANSFORMER_PATH=/app/transformer_model
ENV MODEL_TYPE=transformer
ENV ML_PORT=7860

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
  CMD curl -f http://localhost:7860/health || exit 1

CMD ["python", "app.py"]
