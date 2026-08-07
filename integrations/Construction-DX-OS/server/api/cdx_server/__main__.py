"""Module entrypoint for ``python -m cdx_server`` and the ``cdx-server`` script."""

from __future__ import annotations


def main() -> int:
    import uvicorn

    uvicorn.run(
        "cdx_server.app:app",
        host="0.0.0.0",  # nosec B104
        port=8080,
        reload=False,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
