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

    if repo.startswith("http://") or repo.startswith("https://") or ".hf.space" in repo:
        print(
            "ERROR: TRANSFORMER_HF_REPO must be a Hugging Face model id, not a Space URL.\n"
            "  Wrong:  https://fawad1386-stm-sentiment.hf.space\n"
            "  Right:  fawad1386/stm-sentiment\n"
            "  (Space URL goes in ML_SERVICE_URL on the backend, not here.)",
            file=sys.stderr,
        )
        sys.exit(1)

    if "/" not in repo:
        print(
            f"ERROR: TRANSFORMER_HF_REPO should be namespace/repo_name, got: {repo!r}",
            file=sys.stderr,
        )
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
