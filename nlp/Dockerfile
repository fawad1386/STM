FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-docker.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py transformer_predictor.py ./
COPY transformer_model/ ./transformer_model/

ENV MODEL_TYPE=transformer
ENV TRANSFORMER_PATH=/app/transformer_model
ENV ML_PORT=5001

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD curl -f http://localhost:5001/health || exit 1

CMD ["python", "app.py"]
