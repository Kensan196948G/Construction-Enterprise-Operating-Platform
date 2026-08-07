"""SHA-256 改ざん検知ユーティリティ."""
from __future__ import annotations

import json
from hashlib import sha256
from typing import Any


def compute_blackboard_hash(metadata: dict[str, Any], image_b64: str | None) -> str:
    """電子黒板メタデータ + 画像 base64 の SHA-256 を返す."""
    canonical = json.dumps(metadata, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    h = sha256()
    h.update(canonical.encode("utf-8"))
    if image_b64:
        h.update(image_b64.encode("ascii"))
    return h.hexdigest()


def compute_bytes_hash(data: bytes) -> str:
    return sha256(data).hexdigest()
