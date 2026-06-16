"""Download fine-tuned transformer weights from Hugging Face Hub (cloud deploy)."""

from __future__ import annotations

import os
import sys
from pathlib import Path


def main() -> None:
    repo = os.environ.get("TRANSFORMER_HF_REPO", "").strip()
    dest = Path(os.environ.get("TRANSFORMER_PATH", "/app/transformer_model"))

    if not repo:
        print("ERROR: Set TRANSFORMER_HF_REPO (e.g. your-username/stm-sentiment)", file=sys.stderr)
        sys.exit(1)

    if dest.exists() and any(dest.iterdir()):
        print(f"Model already present at {dest}, skipping download")
        return

    from huggingface_hub import snapshot_download

    print(f"Downloading {repo} → {dest}")
    snapshot_download(repo_id=repo, local_dir=str(dest))
    print("Model ready.")


if __name__ == "__main__":
    main()
