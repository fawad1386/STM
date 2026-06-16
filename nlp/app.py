"""Flask API for sentiment inference (LSTM or transformer)."""

from __future__ import annotations

import os

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# "lstm" (default) or "transformer"
MODEL_TYPE = os.environ.get("MODEL_TYPE", "lstm").lower()

predictor = None


def _build_predictor():
    if MODEL_TYPE == "transformer":
        from transformer_predictor import TransformerPredictor

        return TransformerPredictor()
    from predictor import TrustMeterPredictor

    return TrustMeterPredictor()


def get_predictor():
    global predictor
    if predictor is None:
        predictor = _build_predictor()
    return predictor


@app.get("/health")
def health():
    try:
        get_predictor()
        return jsonify({"status": "ok", "model": MODEL_TYPE})
    except Exception as exc:
        return jsonify({"status": "error", "model": MODEL_TYPE, "error": str(exc)}), 503


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}

    if "text" in payload:
        texts = [payload["text"]]
    elif "texts" in payload:
        texts = payload["texts"]
    else:
        return jsonify({"success": False, "error": "Provide 'text' or 'texts'"}), 400

    if not texts or not all(isinstance(t, str) for t in texts):
        return jsonify({"success": False, "error": "Invalid text input"}), 400

    try:
        model = get_predictor()
        results = model.predict_batch(texts)
        if len(results) == 1 and "text" in payload:
            return jsonify({"success": True, "data": results[0]})
        return jsonify({"success": True, "data": results})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT") or os.environ.get("PORT", 5001))
    get_predictor()
    print(f"{MODEL_TYPE} inference service on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
