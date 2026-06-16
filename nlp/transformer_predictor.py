"""Inference for the fine-tuned transformer sentiment model."""

from __future__ import annotations

import os
import re
from pathlib import Path

import torch
import torch.nn.functional as F
from transformers import AutoModelForSequenceClassification, AutoTokenizer

NLP_DIR = Path(__file__).resolve().parent
DEFAULT_DIR = NLP_DIR / "transformer_model"


def _light_clean(text) -> str:
    if text is None:
        return ""
    text = str(text)
    text = re.sub(r"http\S+|www\S+|https\S+", " ", text)
    return " ".join(text.split()).strip()


def _pick_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


class TransformerPredictor:
    def __init__(self, model_dir=None):
        model_dir = str(model_dir or os.environ.get("TRANSFORMER_PATH", DEFAULT_DIR))
        self.device = _pick_device()
        self.max_len = int(os.environ.get("TRANSFORMER_MAX_LEN", 128))
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_dir)
        self.model.to(self.device)
        self.model.eval()

    @torch.no_grad()
    def predict_batch(self, texts):
        clean = [_light_clean(t) for t in texts]
        enc = self.tokenizer(
            clean,
            truncation=True,
            padding=True,
            max_length=self.max_len,
            return_tensors="pt",
        ).to(self.device)
        logits = self.model(**enc).logits
        probs = F.softmax(logits, dim=-1)[:, 1].cpu().tolist()
        return [
            {
                "sentiment": float(p),
                "label": 1 if p > 0.5 else 0,
                "source": "transformer",
            }
            for p in probs
        ]

    def predict_one(self, text: str) -> dict:
        return self.predict_batch([text])[0]
