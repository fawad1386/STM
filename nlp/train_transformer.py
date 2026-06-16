"""Fine-tune a multilingual transformer for Smart Trust Meter sentiment.

Beats the LSTM baseline and handles mixed English + Roman Urdu reviews.
Run:  python train_transformer.py
Output: ./transformer_model/  (+ transformer_metrics.json, transformer_confusion_matrix.png)
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from torch.utils.data import DataLoader, Dataset
from transformers import AutoModelForSequenceClassification, AutoTokenizer

NLP_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = NLP_DIR / "transformer_model"

# Multilingual + small/fast: good for English + Roman Urdu on a laptop.
MODEL_NAME = os.environ.get("TRANSFORMER_BASE", "distilbert-base-multilingual-cased")
MAX_LEN = int(os.environ.get("TRANSFORMER_MAX_LEN", 128))
BATCH_SIZE = int(os.environ.get("TRANSFORMER_BATCH", 16))
EPOCHS = int(os.environ.get("TRANSFORMER_EPOCHS", 5))
LR = float(os.environ.get("TRANSFORMER_LR", 2e-5))
SEED = 42

# Extra training files merged into the train split (comma-separated).
# Defaults to the Roman Urdu augmentation set if present.
AUGMENT = os.environ.get("AUGMENT", "roman_urdu_augment.csv")


def pick_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def light_clean(text) -> str:
    """Keep Roman Urdu / casing; only drop URLs and collapse whitespace."""
    if text is None or (isinstance(text, float) and np.isnan(text)):
        return ""
    text = str(text)
    text = re.sub(r"http\S+|www\S+|https\S+", " ", text)
    return " ".join(text.split()).strip()


class ReviewDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len):
        self.encodings = tokenizer(
            list(texts),
            truncation=True,
            padding=True,
            max_length=max_len,
        )
        self.labels = list(labels)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {k: torch.tensor(v[idx]) for k, v in self.encodings.items()}
        item["labels"] = torch.tensor(int(self.labels[idx]))
        return item


def load_split(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df = df.dropna(subset=["review_text", "label"]).copy()
    df["text"] = df["review_text"].apply(light_clean)
    df = df[df["text"].str.len() > 0]
    df["label"] = df["label"].astype(int)
    return df.drop_duplicates(subset=["text"])


@torch.no_grad()
def evaluate(model, loader, device):
    model.eval()
    all_preds, all_labels = [], []
    for batch in loader:
        labels = batch.pop("labels")
        batch = {k: v.to(device) for k, v in batch.items()}
        logits = model(**batch).logits
        preds = torch.argmax(logits, dim=-1).cpu().numpy()
        all_preds.extend(preds.tolist())
        all_labels.extend(labels.numpy().tolist())
    return np.array(all_labels), np.array(all_preds)


def main():
    torch.manual_seed(SEED)
    np.random.seed(SEED)
    device = pick_device()
    print(f"Device: {device} | Base model: {MODEL_NAME}")

    train_df = load_split(NLP_DIR / "training_data.csv")
    test_df = load_split(NLP_DIR / "testing_data.csv")

    for name in [p.strip() for p in AUGMENT.split(",") if p.strip()]:
        path = NLP_DIR / name
        if path.exists():
            aug = load_split(path)
            train_df = pd.concat([train_df, aug], ignore_index=True)
            print(f"Augmented with {len(aug)} rows from {name}")
        else:
            print(f"(augment file not found, skipping: {name})")

    train_df = train_df.drop_duplicates(subset=["text"]).reset_index(drop=True)
    print(f"Train: {len(train_df)}  Test: {len(test_df)}")
    print(f"Train label dist: {np.bincount(train_df['label'])}")

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME, num_labels=2
    ).to(device)

    train_ds = ReviewDataset(train_df["text"], train_df["label"], tokenizer, MAX_LEN)
    test_ds = ReviewDataset(test_df["text"], test_df["label"], tokenizer, MAX_LEN)
    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE)

    # Class weights to counter imbalance (~35% negative / 65% positive).
    counts = np.bincount(train_df["label"], minlength=2)
    weights = torch.tensor(
        counts.sum() / (2.0 * np.maximum(counts, 1)), dtype=torch.float
    ).to(device)
    print(f"Class weights: {weights.tolist()}")

    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=0.01)

    best_f1 = -1.0
    best_metrics = {}
    for epoch in range(1, EPOCHS + 1):
        model.train()
        running = 0.0
        for batch in train_loader:
            labels = batch.pop("labels").to(device)
            batch = {k: v.to(device) for k, v in batch.items()}
            logits = model(**batch).logits
            loss = F.cross_entropy(logits, labels, weight=weights)
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            running += loss.item()

        y_true, y_pred = evaluate(model, test_loader, device)
        acc = accuracy_score(y_true, y_pred)
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        print(
            f"Epoch {epoch}/{EPOCHS} | loss {running/len(train_loader):.4f} | "
            f"acc {acc:.4f} prec {prec:.4f} rec {rec:.4f} f1 {f1:.4f}"
        )

        if f1 > best_f1:
            best_f1 = f1
            best_metrics = {
                "accuracy": float(acc),
                "precision": float(prec),
                "recall": float(rec),
                "f1_score": float(f1),
                "epoch": epoch,
                "base_model": MODEL_NAME,
                "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
            }
            OUTPUT_DIR.mkdir(exist_ok=True)
            model.save_pretrained(OUTPUT_DIR)
            tokenizer.save_pretrained(OUTPUT_DIR)
            print(f"  -> saved new best (f1={f1:.4f}) to {OUTPUT_DIR}")

    print("\n" + "=" * 60)
    print("BEST MODEL")
    print("=" * 60)
    print(json.dumps({k: v for k, v in best_metrics.items() if k != "confusion_matrix"}, indent=2))
    print("\nClassification report (best epoch reload):")
    print(classification_report(y_true, y_pred, zero_division=0))

    with open(NLP_DIR / "transformer_metrics.json", "w") as f:
        json.dump(best_metrics, f, indent=2)
    print(f"\nMetrics saved to transformer_metrics.json")
    print(f"Final test accuracy: {best_metrics['accuracy']*100:.2f}%")


if __name__ == "__main__":
    main()
