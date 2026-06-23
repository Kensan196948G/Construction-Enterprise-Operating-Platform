"""Real-DB CRUD verification for the construction service (WBSItem).

Runs INSERT -> SELECT -> UPDATE -> DELETE against a real PostgreSQL instance
using the service's own SQLAlchemy models. This exercises real SQL, real column
types (UUID / Numeric / Date) and real schema constraints — coverage the
mock-based unit tests do not provide.

Usage:
    DATABASE_URL=postgresql+asyncpg://construction-os:construction-os_dev@localhost:55432/construction-os \
        python verify_db_crud.py
"""

import asyncio
import os
import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from src.models import Base, WBSItem

DB_URL = os.environ["DATABASE_URL"]


async def main() -> None:
    engine = create_async_engine(DB_URL)

    # 1. Prepare schema + tables (the models are schema-qualified "construction").
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS construction"))
        await conn.run_sync(Base.metadata.create_all)
    print("✅ schema + tables created")

    Session = async_sessionmaker(engine, expire_on_commit=False)
    org_id, proj_id = uuid.uuid4(), uuid.uuid4()

    # 2. CREATE
    async with Session() as s:
        item = WBSItem(
            organization_id=org_id,
            project_id=proj_id,
            wbs_code="1.1",
            name="基礎工事",
            level=1,
            progress_percent=0,
            status="pending",
        )
        s.add(item)
        await s.commit()
        await s.refresh(item)
        new_id = item.id
    print(f"✅ CREATE  wbs_id={new_id} name=基礎工事 status=pending")

    # 3. READ
    async with Session() as s:
        row = (await s.execute(select(WBSItem).where(WBSItem.id == new_id))).scalar_one()
        assert row.name == "基礎工事" and row.wbs_code == "1.1"
    print(f"✅ READ    wbs_code={row.wbs_code} name={row.name}")

    # 4. UPDATE
    async with Session() as s:
        row = (await s.execute(select(WBSItem).where(WBSItem.id == new_id))).scalar_one()
        row.progress_percent = 50
        row.status = "in_progress"
        await s.commit()
    async with Session() as s:
        row = (await s.execute(select(WBSItem).where(WBSItem.id == new_id))).scalar_one()
        assert int(row.progress_percent) == 50 and row.status == "in_progress"
    print(f"✅ UPDATE  progress={int(row.progress_percent)}% status={row.status}")

    # 5. DELETE
    async with Session() as s:
        row = (await s.execute(select(WBSItem).where(WBSItem.id == new_id))).scalar_one()
        await s.delete(row)
        await s.commit()
    async with Session() as s:
        gone = (await s.execute(select(WBSItem).where(WBSItem.id == new_id))).scalar_one_or_none()
        assert gone is None
    print("✅ DELETE  row removed (verified absent)")

    await engine.dispose()
    print("\n🟢 DB CRUD round-trip PASSED (real PostgreSQL, construction.wbs_items)")


if __name__ == "__main__":
    asyncio.run(main())
