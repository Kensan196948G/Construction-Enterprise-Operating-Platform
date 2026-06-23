"""Module entrypoint: allows `python -m cdx_agent ...`."""

from cdx_agent.cli import main

if __name__ == "__main__":
    raise SystemExit(main())
