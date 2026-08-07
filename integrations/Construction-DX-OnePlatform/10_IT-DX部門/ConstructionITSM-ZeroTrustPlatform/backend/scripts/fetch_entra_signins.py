"""Cron-driven Entra ID risk sign-in fetcher.

Usage::

    python -m scripts.fetch_entra_signins
"""
from __future__ import annotations

import logging
import sys

from itsm_api.db.session import SessionLocal
from itsm_api.services.entra_log_fetcher import fetch_signin_logs, upsert_signins

logger = logging.getLogger(__name__)


def main() -> int:
    logging.basicConfig(level=logging.INFO)
    items = fetch_signin_logs()
    logger.info("Fetched %d sign-in events from Microsoft Graph", len(items))
    with SessionLocal() as db:
        n = upsert_signins(db, items)
    logger.info("Upserted %d sign-in rows", n)
    return 0


if __name__ == "__main__":
    sys.exit(main())
