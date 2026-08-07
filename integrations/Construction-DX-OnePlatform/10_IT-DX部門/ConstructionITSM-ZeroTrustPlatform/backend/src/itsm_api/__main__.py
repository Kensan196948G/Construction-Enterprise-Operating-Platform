"""`python -m itsm_api` entrypoint.

Launches the FastAPI app via uvicorn. Background collectors (syslog/snmp)
are intentionally run as separate processes (see ``backend/scripts/``).
"""
from __future__ import annotations

import uvicorn

from itsm_api.config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "itsm_api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )


if __name__ == "__main__":
    main()
