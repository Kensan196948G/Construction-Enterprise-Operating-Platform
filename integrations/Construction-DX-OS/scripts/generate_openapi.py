#!/usr/bin/env python3
"""Generate OpenAPI JSON spec from the cdx-server FastAPI application.

Outputs ``server/api/openapi.json`` (relative to the repository root).
Run from the repository root::

    python scripts/generate_openapi.py

Or via CI::

    python scripts/generate_openapi.py --check

``--check`` mode exits non-zero if the file on disk differs from the generated
spec (useful to enforce that ``openapi.json`` is kept up to date in CI).

Phase 4c (Issue 0010): this script is the first step toward automated SDK
generation.  The next step (Phase 5) will pipe the JSON into
``openapi-generator-cli`` to produce TypeScript and Rust client libraries.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Repository root is one level above this script's directory.
_REPO_ROOT = Path(__file__).resolve().parent.parent
_OUTPUT = _REPO_ROOT / "server" / "api" / "openapi.json"


def _generate() -> dict:
    # Add server/api to sys.path so we can import cdx_server without install.
    server_api = str(_REPO_ROOT / "server" / "api")
    if server_api not in sys.path:
        sys.path.insert(0, server_api)

    from cdx_server.app import create_app  # noqa: PLC0415

    app = create_app()
    return app.openapi()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit non-zero if the on-disk file differs from the generated spec.",
    )
    args = parser.parse_args()

    schema = _generate()
    generated = json.dumps(schema, indent=2, ensure_ascii=False) + "\n"

    if args.check:
        if not _OUTPUT.exists():
            print(f"ERROR: {_OUTPUT} does not exist. Run without --check to generate it.")
            sys.exit(1)
        on_disk = _OUTPUT.read_text(encoding="utf-8")
        if on_disk != generated:
            print(
                f"ERROR: {_OUTPUT} is stale.\n"
                "Run `python scripts/generate_openapi.py` and commit the result."
            )
            sys.exit(1)
        print(f"OK: {_OUTPUT} is up to date.")
    else:
        _OUTPUT.write_text(generated, encoding="utf-8")
        schema_info = schema.get("info", {})
        n_paths = len(schema.get("paths", {}))
        print(
            f"Generated {_OUTPUT} "
            f"(title={schema_info.get('title')!r}, "
            f"version={schema_info.get('version')!r}, "
            f"paths={n_paths})"
        )


if __name__ == "__main__":
    main()
