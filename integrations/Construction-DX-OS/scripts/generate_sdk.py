#!/usr/bin/env python3
"""Generate TypeScript and Python client SDKs from openapi.json.

Uses @openapitools/openapi-generator-cli (Java-based, via npx).

Usage::

    python scripts/generate_sdk.py            # generate both SDKs
    python scripts/generate_sdk.py --check    # verify SDKs are up to date
    python scripts/generate_sdk.py --lang ts  # TypeScript only
    python scripts/generate_sdk.py --lang py  # Python only

Phase 5a (Issue 0011): this script is the automated SDK generation step.
The generated SDKs live under sdk/typescript/ and sdk/python/.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent
_OPENAPI_JSON = _REPO_ROOT / "server" / "api" / "openapi.json"
_SDK_ROOT = _REPO_ROOT / "sdk"
_TS_OUT = _SDK_ROOT / "typescript"
_PY_OUT = _SDK_ROOT / "python"

_GENERATOR = "npx"
_GENERATOR_ARGS = ["--yes", "@openapitools/openapi-generator-cli", "generate"]

_CONFIGS: dict[str, dict] = {
    "ts": {
        "generator": "typescript-fetch",
        "output": _TS_OUT,
        "extra_args": [
            "--additional-properties=supportsES6=true,npmName=cdx-client,npmVersion=0.1.0",
        ],
    },
    "py": {
        "generator": "python",
        "output": _PY_OUT,
        "extra_args": [
            "--additional-properties=packageName=cdx_client,projectName=cdx-client,packageVersion=0.1.0",
        ],
    },
}


_HASH_SKIP = {".openapi-generator"}  # metadata dir with non-deterministic content


def _hash_dir(path: Path) -> str:
    """Return SHA-256 of all source file contents under path, for diff detection.

    Skips .openapi-generator/ which contains generator metadata (FILES, VERSION)
    that changes between generator CLI releases without affecting API behaviour.
    """
    h = hashlib.sha256()
    if not path.exists():
        return ""
    for f in sorted(path.rglob("*")):
        if f.is_file():
            rel = f.relative_to(path)
            if rel.parts[0] in _HASH_SKIP:
                continue
            h.update(str(rel).encode())
            h.update(f.read_bytes())
    return h.hexdigest()


def _generate(lang: str) -> None:
    cfg = _CONFIGS[lang]
    out: Path = cfg["output"]
    # Clean before regen for deterministic output (avoids stale files skewing --check).
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True, exist_ok=True)
    cmd = [
        _GENERATOR,
        *_GENERATOR_ARGS,
        "-i", str(_OPENAPI_JSON),
        "-g", cfg["generator"],
        "-o", str(out),
        *cfg["extra_args"],
    ]
    print(f"[sdk] generating {lang}: {' '.join(cmd)}", flush=True)
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)
    print(f"[sdk] {lang} done → {out}", flush=True)


def _check(lang: str) -> bool:
    """Return True if SDK is up to date with openapi.json."""
    cfg = _CONFIGS[lang]
    out: Path = cfg["output"]
    if not out.exists() or not any(out.iterdir()):
        print(f"[sdk-check] {lang}: output directory missing or empty", flush=True)
        return False

    # Regenerate to tmp, compare hashes
    tmp = out.parent / f"{out.name}_check_tmp"
    if tmp.exists():
        shutil.rmtree(tmp)
    cfg_tmp = dict(cfg)
    cfg_tmp["output"] = tmp
    _CONFIGS[f"{lang}_tmp"] = cfg_tmp

    tmp.mkdir(parents=True, exist_ok=True)
    cmd = [
        _GENERATOR,
        *_GENERATOR_ARGS,
        "-i", str(_OPENAPI_JSON),
        "-g", cfg["generator"],
        "-o", str(tmp),
        *cfg["extra_args"],
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        shutil.rmtree(tmp, ignore_errors=True)
        print(result.stderr, file=sys.stderr)
        return False

    current = _hash_dir(out)
    fresh = _hash_dir(tmp)
    shutil.rmtree(tmp, ignore_errors=True)

    if current != fresh:
        print(
            f"[sdk-check] {lang}: SDK is out of date — run `make sdk` to regenerate",
            flush=True,
        )
        return False

    print(f"[sdk-check] {lang}: up to date", flush=True)
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate client SDKs from openapi.json")
    parser.add_argument("--lang", choices=["ts", "py"], help="Generate one language only")
    parser.add_argument("--check", action="store_true", help="Check SDKs are up to date")
    args = parser.parse_args()

    if not _OPENAPI_JSON.exists():
        print(f"ERROR: {_OPENAPI_JSON} not found — run `python scripts/generate_openapi.py` first", file=sys.stderr)
        sys.exit(1)

    langs = [args.lang] if args.lang else list(_CONFIGS.keys())

    if args.check:
        ok = all(_check(lang) for lang in langs)
        sys.exit(0 if ok else 1)
    else:
        for lang in langs:
            _generate(lang)


if __name__ == "__main__":
    main()
