"""開発用シードスクリプト。

実行:
    python -m seeds.seed_master

事前に Alembic マイグレーション (`alembic upgrade head`) を完了している
こと。データが既に存在する場合は冪等にスキップする。
"""

from __future__ import annotations

import asyncio
from datetime import UTC, date, datetime
from decimal import Decimal

from cdx_db import (
    Branch,
    ClientOrg,
    Department,
    Employee,
    Material,
    Project,
    session_scope,
)
from sqlalchemy import select

# ---------- サンプルデータ定義 ----------

DEPARTMENTS = [
    {"dept_code": "D001", "dept_name": "経営企画部", "sort_order": 10},
    {"dept_code": "D002", "dept_name": "施工本部", "sort_order": 20},
    {"dept_code": "D003", "dept_name": "技術本部", "sort_order": 30},
]

BRANCHES = [
    {"branch_code": "B001", "branch_name": "東京本店", "address": "東京都千代田区", "lon": 139.7671, "lat": 35.6812, "dept_code": "D002"},
    {"branch_code": "B002", "branch_name": "大阪支店", "address": "大阪市北区", "lon": 135.4959, "lat": 34.7024, "dept_code": "D002"},
    {"branch_code": "B003", "branch_name": "名古屋支店", "address": "名古屋市中区", "lon": 136.9066, "lat": 35.1815, "dept_code": "D002"},
    {"branch_code": "B004", "branch_name": "福岡支店", "address": "福岡市博多区", "lon": 130.4017, "lat": 33.5904, "dept_code": "D002"},
    {"branch_code": "B005", "branch_name": "札幌支店", "address": "札幌市中央区", "lon": 141.3545, "lat": 43.0618, "dept_code": "D002"},
]

EMPLOYEES = [
    {"employee_code": f"E{i:04d}",
     "name": f"社員{i:02d}",
     "name_kana": f"シャイン{i:02d}",
     "email": f"emp{i:02d}@example.co.jp",
     "entra_oid": f"00000000-0000-0000-0000-{i:012d}",
     "dept_code": "D002" if i % 2 == 0 else "D003",
     "branch_code": f"B00{((i - 1) % 5) + 1}",
     "position": "主任" if i <= 3 else "担当",
     "hire_date": date(2020, 4, 1)}
    for i in range(1, 11)
]

CLIENTS = [
    {"client_code": "C001", "client_name": "国土交通省 関東地方整備局", "client_type": "public", "address": "さいたま市", "contact_name": "山田太郎", "contact_email": "yamada@mlit.go.jp", "contact_phone": "048-000-0000"},
    {"client_code": "C002", "client_name": "東京都 建設局", "client_type": "public", "address": "東京都新宿区", "contact_name": "佐藤花子", "contact_email": "sato@metro.tokyo.lg.jp", "contact_phone": "03-0000-0000"},
    {"client_code": "C003", "client_name": "三井不動産株式会社", "client_type": "private", "address": "東京都中央区", "contact_name": "鈴木一郎", "contact_email": "suzuki@mitsui.example", "contact_phone": "03-1111-1111"},
    {"client_code": "C004", "client_name": "JR東日本", "client_type": "private", "address": "東京都渋谷区", "contact_name": "田中次郎", "contact_email": "tanaka@jreast.example", "contact_phone": "03-2222-2222"},
    {"client_code": "C005", "client_name": "横浜市", "client_type": "public", "address": "横浜市中区", "contact_name": "高橋三郎", "contact_email": "takahashi@city.yokohama.example", "contact_phone": "045-000-0000"},
]

PROJECTS = [
    {"project_code": "P2026-001", "project_name": "国道〇号線改良工事", "client_code": "C001", "dept_code": "D002", "branch_code": "B001", "contract_amount": Decimal("450000000"), "start_date": date(2026, 4, 1), "end_date": date(2027, 3, 31), "status": "ongoing"},
    {"project_code": "P2026-002", "project_name": "△△駅前再開発ビル新築", "client_code": "C003", "dept_code": "D002", "branch_code": "B001", "contract_amount": Decimal("1280000000"), "start_date": date(2026, 6, 1), "end_date": date(2028, 9, 30), "status": "planned"},
    {"project_code": "P2026-003", "project_name": "□□線高架橋耐震補強", "client_code": "C004", "dept_code": "D002", "branch_code": "B002", "contract_amount": Decimal("320000000"), "start_date": date(2026, 5, 15), "end_date": date(2027, 1, 31), "status": "ongoing"},
]

_MATERIAL_TEMPLATES = [
    ("生コンクリート 24-15-20", "コンクリート", "m3", "15000"),
    ("普通ポルトランドセメント", "セメント", "袋", "650"),
    ("鉄筋 SD345 D13", "鉄筋", "本", "1200"),
    ("鉄筋 SD345 D16", "鉄筋", "本", "1800"),
    ("鉄筋 SD345 D19", "鉄筋", "本", "2600"),
    ("H形鋼 200x200", "鋼材", "m", "5400"),
    ("H形鋼 300x300", "鋼材", "m", "9800"),
    ("型枠合板 12mm", "型枠", "枚", "2200"),
    ("足場板 4m", "仮設", "枚", "3500"),
    ("単管パイプ 2m", "仮設", "本", "1100"),
    ("クランプ 直交", "仮設", "個", "240"),
    ("アスファルト合材", "舗装", "t", "11000"),
    ("再生砕石 RC-40", "土工", "m3", "2300"),
    ("山砂", "土工", "m3", "3800"),
    ("発電機 25kVA", "機械", "日", "12000"),
    ("バックホウ 0.45m3", "機械", "日", "35000"),
    ("ダンプトラック 10t", "機械", "日", "45000"),
    ("安全帯 フルハーネス", "安全用品", "個", "18000"),
    ("ヘルメット", "安全用品", "個", "3200"),
    ("コーン (赤)", "安全用品", "個", "450"),
]

MATERIALS = [
    {
        "material_code": f"M{i:04d}",
        "name": name,
        "category": category,
        "unit": unit,
        "unit_price": Decimal(price),
    }
    for i, (name, category, unit, price) in enumerate(_MATERIAL_TEMPLATES, start=1)
]


# ---------- シード処理 ----------

async def _seed_departments(session) -> dict[str, int]:
    code_to_id: dict[str, int] = {}
    for row in DEPARTMENTS:
        existing = (
            await session.execute(
                select(Department).where(Department.dept_code == row["dept_code"])
            )
        ).scalar_one_or_none()
        if existing:
            code_to_id[row["dept_code"]] = existing.id
            continue
        obj = Department(**row, valid_from=date(2020, 4, 1))
        session.add(obj)
        await session.flush()
        code_to_id[row["dept_code"]] = obj.id
    return code_to_id


async def _seed_branches(session, dept_map: dict[str, int]) -> dict[str, int]:
    code_to_id: dict[str, int] = {}
    for row in BRANCHES:
        existing = (
            await session.execute(
                select(Branch).where(Branch.branch_code == row["branch_code"])
            )
        ).scalar_one_or_none()
        if existing:
            code_to_id[row["branch_code"]] = existing.id
            continue
        obj = Branch(
            branch_code=row["branch_code"],
            branch_name=row["branch_name"],
            address=row["address"],
            geom=f"SRID=4326;POINT({row['lon']} {row['lat']})",
            dept_id=dept_map.get(row["dept_code"]),
        )
        session.add(obj)
        await session.flush()
        code_to_id[row["branch_code"]] = obj.id
    return code_to_id


async def _seed_employees(
    session, dept_map: dict[str, int], branch_map: dict[str, int]
) -> None:
    for row in EMPLOYEES:
        existing = (
            await session.execute(
                select(Employee).where(Employee.employee_code == row["employee_code"])
            )
        ).scalar_one_or_none()
        if existing:
            continue
        obj = Employee(
            employee_code=row["employee_code"],
            name=row["name"],
            name_kana=row["name_kana"],
            email=row["email"],
            entra_oid=row["entra_oid"],
            dept_id=dept_map.get(row["dept_code"]),
            branch_id=branch_map.get(row["branch_code"]),
            position=row["position"],
            hire_date=row["hire_date"],
        )
        session.add(obj)


async def _seed_clients(session) -> dict[str, int]:
    code_to_id: dict[str, int] = {}
    for row in CLIENTS:
        existing = (
            await session.execute(
                select(ClientOrg).where(ClientOrg.client_code == row["client_code"])
            )
        ).scalar_one_or_none()
        if existing:
            code_to_id[row["client_code"]] = existing.id
            continue
        obj = ClientOrg(**row)
        session.add(obj)
        await session.flush()
        code_to_id[row["client_code"]] = obj.id
    return code_to_id


async def _seed_projects(
    session,
    client_map: dict[str, int],
    dept_map: dict[str, int],
    branch_map: dict[str, int],
) -> None:
    for row in PROJECTS:
        existing = (
            await session.execute(
                select(Project).where(Project.project_code == row["project_code"])
            )
        ).scalar_one_or_none()
        if existing:
            continue
        obj = Project(
            project_code=row["project_code"],
            project_name=row["project_name"],
            client_id=client_map.get(row["client_code"]),
            dept_id=dept_map.get(row["dept_code"]),
            branch_id=branch_map.get(row["branch_code"]),
            contract_amount=row["contract_amount"],
            start_date=row["start_date"],
            end_date=row["end_date"],
            status=row["status"],
        )
        session.add(obj)


async def _seed_materials(session) -> None:
    now = datetime.now(tz=UTC)
    for row in MATERIALS:
        existing = (
            await session.execute(
                select(Material).where(Material.material_code == row["material_code"])
            )
        ).scalar_one_or_none()
        if existing:
            continue
        obj = Material(**row, latest_price_at=now)
        session.add(obj)


async def main() -> None:
    async with session_scope() as session:
        dept_map = await _seed_departments(session)
        branch_map = await _seed_branches(session, dept_map)
        await _seed_employees(session, dept_map, branch_map)
        client_map = await _seed_clients(session)
        await _seed_projects(session, client_map, dept_map, branch_map)
        await _seed_materials(session)
    print("[seed] master data seeded.")


if __name__ == "__main__":
    asyncio.run(main())
