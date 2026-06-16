"""Load trained Smart Trust Meter LSTM and run inference."""

from __future__ import annotations

import os

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import pickle
import re
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
from textblob import TextBlob

NLP_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL_PREFIX = NLP_DIR / "smart_trust_meter_model"
MAX_WORDS = 5000
MAX_LEN = 100
FEATURE_COLUMNS = [
    "polarity",
    "subjectivity",
    "text_length",
    "word_count",
    "exclamation_count",
    "question_count",
]


def preprocess_text(text) -> str:
    if text is None or (isinstance(text, float) and np.isnan(text)):
        return ""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"@\w+|#\w+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    return " ".join(text.split())


def extract_sentiment_features(text: str) -> dict:
    try:
        blob = TextBlob(str(text))
        return {
            "polarity": blob.sentiment.polarity,
            "subjectivity": blob.sentiment.subjectivity,
            "text_length": len(text),
            "word_count": len(text.split()),
            "exclamation_count": text.count("!"),
            "question_count": text.count("?"),
        }
    except Exception:
        return {
            "polarity": 0.0,
            "subjectivity": 0.0,
            "text_length": 0,
            "word_count": 0,
            "exclamation_count": 0,
            "question_count": 0,
        }


class TrustMeterPredictor:
    def __init__(self, model_prefix=None):
        prefix = Path(model_prefix or os.environ.get("MODEL_PATH", DEFAULT_MODEL_PREFIX))
        if prefix.suffix == ".h5":
            prefix = prefix.with_suffix("")

        self.max_len = MAX_LEN
        self.model = tf.keras.models.load_model(f"{prefix}.h5")

        with open(f"{prefix}_tokenizer.pickle", "rb") as handle:
            self.tokenizer = pickle.load(handle)

        with open(f"{prefix}_scaler.pickle", "rb") as handle:
            self.scaler = pickle.load(handle)

    def predict_proba(self, texts: list[str]) -> np.ndarray:
        clean_texts = [preprocess_text(t) for t in texts]
        sequences = self.tokenizer.texts_to_sequences(clean_texts)
        x_text = pad_sequences(sequences, maxlen=self.max_len)

        feature_rows = [extract_sentiment_features(t) for t in clean_texts]
        x_features = self.scaler.transform(
            [[row[col] for col in FEATURE_COLUMNS] for row in feature_rows]
        )

        probs = self.model.predict([x_text, x_features], verbose=0).flatten()
        return probs

    def predict_one(self, text: str) -> dict:
        prob = float(self.predict_proba([text])[0])
        label = 1 if prob > 0.5 else 0
        return {
            "sentiment": prob,
            "label": label,
            "source": "lstm",
        }

    def predict_batch(self, texts: list[str]) -> list[dict]:
        probs = self.predict_proba(texts)
        results = []
        for prob in probs:
            prob = float(prob)
            results.append(
                {
                    "sentiment": prob,
                    "label": 1 if prob > 0.5 else 0,
                    "source": "lstm",
                }
            )
        return results
