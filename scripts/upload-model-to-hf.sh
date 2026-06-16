#!/usr/bin/env bash
# Upload fine-tuned transformer to Hugging Face Hub (free, required for cloud ML deploy).
#
# Usage:
#   bash scripts/upload-model-to-hf.sh YOUR_USERNAME/stm-sentiment
#
# Prerequisites:
#   pip install huggingface_hub
#   huggingface-cli login

set -euo pipefail

REPO_ID="${1:-}"
MODEL_DIR="$(cd "$(dirname "$0")/.." && pwd)/nlp/transformer_model"

if [[ -z "$REPO_ID" ]]; then
  echo "Usage: bash scripts/upload-model-to-hf.sh YOUR_USERNAME/stm-sentiment"
  exit 1
fi

if [[ ! -f "$MODEL_DIR/model.safetensors" ]]; then
  echo "Model not found at $MODEL_DIR"
  echo "Train first: cd nlp && python train_transformer.py"
  exit 1
fi

if ! command -v hf &>/dev/null && ! command -v huggingface-cli &>/dev/null; then
  export PATH="$HOME/Library/Python/3.9/bin:$HOME/.local/bin:$PATH"
fi

HF="$(command -v hf || command -v huggingface-cli || true)"
if [[ -z "$HF" ]]; then
  echo "Install: python3 -m pip install huggingface_hub"
  echo "Then add Python scripts to PATH:"
  echo "  export PATH=\"\$HOME/Library/Python/3.9/bin:\$PATH\""
  exit 1
fi

echo "Uploading $MODEL_DIR → hf.co/$REPO_ID"
if [[ "$HF" == *hf ]]; then
  hf upload "$REPO_ID" "$MODEL_DIR" . --repo-type model
else
  huggingface-cli upload "$REPO_ID" "$MODEL_DIR" . --repo-type model
fi
echo ""
echo "Done. Set TRANSFORMER_HF_REPO=$REPO_ID in Render / Hugging Face Space secrets."
