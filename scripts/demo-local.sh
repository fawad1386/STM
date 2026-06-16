#!/usr/bin/env bash
# Run the full demo without Docker (uses backend/.env → Atlas test DB)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Smart Trust Meter — local demo (no Docker) ==="
echo "Requires: nlp/.venv, backend npm deps, frontend npm deps"
echo ""

# Free ports if something is stuck
for port in 5000 5001 5173; do
  lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
done

cleanup() {
  echo ""
  echo "Stopping services..."
  kill "$ML_PID" "$BACK_PID" "$FRONT_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

# ML service
if [[ ! -d nlp/.venv ]]; then
  echo "ERROR: nlp/.venv not found. Run:"
  echo "  cd nlp && python3 -m venv .venv && source .venv/bin/activate"
  echo "  pip install -r requirements-docker.txt"
  exit 1
fi

echo "[1/3] Starting ML service (port 5001)..."
(
  cd nlp
  source .venv/bin/activate
  export MODEL_TYPE=transformer
  python app.py
) &
ML_PID=$!

echo "[2/3] Starting API (port 5000)..."
(cd backend && npm start) &
BACK_PID=$!

echo "[3/3] Starting frontend (port 5173)..."
(cd frontend && npm run dev) &
FRONT_PID=$!

echo ""
echo "Waiting for services..."
sleep 5

if curl -sf http://localhost:5000/api/health >/dev/null 2>&1; then
  echo "API:  http://localhost:5000/api/health"
else
  echo "API:  still starting (check backend logs)"
fi

echo "App:  http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services."

wait
