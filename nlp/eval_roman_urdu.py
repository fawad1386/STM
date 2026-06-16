"""Evaluate the current transformer on the held-out Roman Urdu set."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
from sklearn.metrics import accuracy_score, classification_report

from transformer_predictor import TransformerPredictor

NLP_DIR = Path(__file__).resolve().parent


def main(eval_file: str = "roman_urdu_eval.csv"):
    df = pd.read_csv(NLP_DIR / eval_file).dropna(subset=["review_text", "label"])
    df["label"] = df["label"].astype(int)

    predictor = TransformerPredictor()
    preds = [r["label"] for r in predictor.predict_batch(df["review_text"].tolist())]

    acc = accuracy_score(df["label"], preds)
    print(f"Roman Urdu eval ({len(df)} samples)")
    print(f"Accuracy: {acc*100:.2f}%")
    print(classification_report(df["label"], preds, zero_division=0))

    df = df.assign(pred=preds)
    wrong = df[df["label"] != df["pred"]]
    if len(wrong):
        print(f"Misclassified ({len(wrong)}):")
        for _, row in wrong.iterrows():
            print(f"  true={row['label']} pred={row['pred']} | {row['review_text'][:80]}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "roman_urdu_eval.csv")
