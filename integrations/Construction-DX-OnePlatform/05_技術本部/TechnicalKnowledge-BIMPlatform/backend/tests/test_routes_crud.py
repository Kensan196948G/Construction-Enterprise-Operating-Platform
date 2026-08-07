"""CIM・Dashboard・図面・仕様書・BIM ルートの CRUD テスト (05_技術本部).

dependency_overrides パターンで get_current_user / get_db_session をモック化し、
DB 接続なしにルートの業務ロジックを検証する。
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from cdx_auth.dependencies import get_current_user
from tech_api.db.session import get_db_session
from tech_api.main import create_app

_FAKE_USER = MagicMock(sub="test-user-001", email="test@cdx.example.com", name="テストユーザー")


# ── DB セッションモック ヘルパー ────────────────────────────────────────────


def _scalars_all(rows: list) -> MagicMock:
    """session.execute().scalars().all() → rows を返すモック."""
    r = MagicMock()
    r.scalars.return_value.all.return_value = rows
    return r


def _scalar(value: int) -> MagicMock:
    """session.execute().scalar() → value を返すモック."""
    r = MagicMock()
    r.scalar.return_value = value
    return r


def _all_rows(rows: list) -> MagicMock:
    """session.execute().all() → rows を返すモック."""
    r = MagicMock()
    r.all.return_value = rows
    return r


def _add_defaults(obj: object) -> None:
    """session.add() の副作用: id と version を DB 相当値に設定する."""
    obj.id = 1  # type: ignore[attr-defined]
    try:
        if not getattr(obj, "version", None):
            obj.version = 1  # type: ignore[attr-defined]
    except Exception:
        pass


def _make_client(
    *,
    execute_rv: MagicMock | None = None,
    execute_side_effects: list | None = None,
    get_rv: object = None,
    add_id: int = 1,
) -> TestClient:
    """dependency_overrides 付き TestClient を生成する."""
    _app = create_app()
    _app.dependency_overrides[get_current_user] = lambda: _FAKE_USER

    async def _mock_db():  # type: ignore[return]
        session = AsyncMock()
        if execute_side_effects is not None:
            session.execute = AsyncMock(side_effect=execute_side_effects)
        elif execute_rv is not None:
            session.execute = AsyncMock(return_value=execute_rv)
        session.get = AsyncMock(return_value=get_rv)
        session.add = MagicMock(side_effect=_add_defaults)
        session.flush = AsyncMock()
        yield session

    _app.dependency_overrides[get_db_session] = _mock_db
    return TestClient(_app)


# ── CIM データセット ────────────────────────────────────────────────────────


def _cim_mock(id_val: int = 1, tile_url: str | None = None) -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.dataset_name = "テスト点群データ"
    obj.project_id = None
    obj.data_type = "point_cloud"
    obj.file_format = "LAS"
    obj.storage_url = "s3://cdx-bucket/test.las"
    obj.crs = "JGD2011"
    obj.point_count = 500_000
    obj.attributes = None
    obj.tile_url_template = tile_url
    return obj


def test_cim_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/cim")
    assert r.status_code == 200
    assert r.json() == []


def test_cim_list_returns_dataset() -> None:
    client = _make_client(execute_rv=_scalars_all([_cim_mock()]))
    r = client.get("/api/v1/cim")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["dataset_name"] == "テスト点群データ"
    assert body[0]["data_type"] == "point_cloud"


def test_cim_create_returns_201() -> None:
    client = _make_client()
    payload = {
        "dataset_name": "現場A 点群",
        "data_type": "point_cloud",
        "file_format": "LAS",
        "storage_url": "s3://cdx-bucket/siteA.las",
    }
    r = client.post("/api/v1/cim", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["dataset_name"] == "現場A 点群"
    assert body["id"] == 1


def test_cim_tile_request_sets_template() -> None:
    mock_ds = _cim_mock()
    client = _make_client(get_rv=mock_ds)
    r = client.post("/api/v1/cim/1/tile")
    assert r.status_code == 200
    body = r.json()
    assert body["tile_url_template"] is not None
    assert "tiles/1" in body["tile_url_template"]


def test_cim_tile_not_found() -> None:
    client = _make_client(get_rv=None)
    r = client.post("/api/v1/cim/999/tile")
    assert r.status_code == 404


# ── ダッシュボード ──────────────────────────────────────────────────────────


def test_dashboard_stats_returns_counts() -> None:
    # open_inquiry(1) + article(5) + bim(3) + cim(2) + drawing(7) の順で execute が呼ばれる
    client = _make_client(
        execute_side_effects=[
            _scalar(1),  # open_inquiry_count
            _scalar(5),  # article_count
            _scalar(3),  # bim_count
            _scalar(2),  # cim_count
            _scalar(7),  # drawing_count
        ]
    )
    r = client.get("/api/v1/dashboard/stats")
    assert r.status_code == 200
    body = r.json()
    assert body["article_count"] == 5
    assert body["bim_count"] == 3
    assert body["cim_count"] == 2
    assert body["drawing_count"] == 7
    assert body["open_inquiry_count"] == 1


def test_dashboard_popular_articles_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/dashboard/popular-articles")
    assert r.status_code == 200
    assert r.json() == []


def test_dashboard_popular_articles_returns_data() -> None:
    article = MagicMock()
    article.id = 1
    article.title = "施工技術ノウハウ集"
    article.view_count = 120
    article.like_count = 15
    client = _make_client(execute_rv=_scalars_all([article]))
    r = client.get("/api/v1/dashboard/popular-articles")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["title"] == "施工技術ノウハウ集"
    assert body[0]["view_count"] == 120


def test_dashboard_contributors_empty() -> None:
    client = _make_client(execute_rv=_all_rows([]))
    r = client.get("/api/v1/dashboard/contributors")
    assert r.status_code == 200
    assert r.json() == []


def test_dashboard_contributors_returns_data() -> None:
    rows = [("user-001", "山田太郎", 8, 350)]
    client = _make_client(execute_rv=_all_rows(rows))
    r = client.get("/api/v1/dashboard/contributors")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["author_id"] == "user-001"
    assert body[0]["author_name"] == "山田太郎"
    assert body[0]["article_count"] == 8
    assert body[0]["total_views"] == 350


# ── 標準図 ─────────────────────────────────────────────────────────────────


def _drawing_mock(id_val: int = 1) -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.drawing_code = "STD-001"
    obj.drawing_name = "鉄筋コンクリート基礎断面図"
    obj.category = "構造"
    obj.file_format = "DWG"
    obj.storage_url = "s3://cdx-bucket/STD-001.dwg"
    obj.revision = "A"
    obj.version = 1
    return obj


def test_drawings_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/drawings")
    assert r.status_code == 200
    assert r.json() == []


def test_drawings_create_returns_201() -> None:
    client = _make_client()
    payload = {
        "drawing_code": "STD-999",
        "drawing_name": "テスト標準図",
        "file_format": "DWG",
        "storage_url": "s3://cdx-bucket/STD-999.dwg",
    }
    r = client.post("/api/v1/drawings", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["drawing_code"] == "STD-999"
    assert body["id"] == 1


def test_drawings_get_by_id() -> None:
    mock_drw = _drawing_mock()
    client = _make_client(get_rv=mock_drw)
    r = client.get("/api/v1/drawings/1")
    assert r.status_code == 200
    assert r.json()["drawing_code"] == "STD-001"


def test_drawings_get_not_found() -> None:
    client = _make_client(get_rv=None)
    r = client.get("/api/v1/drawings/999")
    assert r.status_code == 404


def test_drawings_thumbnail_returns_svg_for_non_pdf() -> None:
    mock_drw = _drawing_mock()
    mock_drw.file_format = "DWG"
    client = _make_client(get_rv=mock_drw)
    r = client.get("/api/v1/drawings/1/thumbnail")
    assert r.status_code == 200
    # DWG 形式の場合 SVG プレースホルダが返る
    assert "svg" in r.headers.get("content-type", "")
    assert r.headers.get("x-thumbnail-source") == "placeholder"


# ── 仕様書 ─────────────────────────────────────────────────────────────────


def _spec_mock(id_val: int = 1, revision_note: str | None = None) -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.spec_code = "SPEC-001"
    obj.spec_name = "コンクリート工仕様書"
    obj.work_type = "構造工事"
    obj.body_markdown = None
    obj.related_laws = None
    obj.revision_note = revision_note
    obj.storage_url = None
    obj.version = 1
    obj.ai_summary = None
    return obj


def test_specs_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/specs")
    assert r.status_code == 200
    assert r.json() == []


def test_specs_create_returns_201() -> None:
    client = _make_client()
    payload = {
        "spec_code": "SPEC-TEST-001",
        "spec_name": "試験仕様書",
        "work_type": "土工事",
    }
    r = client.post("/api/v1/specs", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["spec_code"] == "SPEC-TEST-001"
    assert body["id"] == 1


def test_specs_get_by_id() -> None:
    mock_spec = _spec_mock()
    client = _make_client(get_rv=mock_spec)
    r = client.get("/api/v1/specs/1")
    assert r.status_code == 200
    assert r.json()["spec_code"] == "SPEC-001"


def test_specs_get_not_found() -> None:
    client = _make_client(get_rv=None)
    r = client.get("/api/v1/specs/999")
    assert r.status_code == 404


def test_specs_ai_summary_extracted_from_revision_note() -> None:
    """revision_note に [AI_SUMMARY] マーカーがある場合 ai_summary フィールドに展開される."""
    note = "初版 2026-05-01\n[AI_SUMMARY]\n- コンクリート圧縮強度 24N/mm2 以上\n- 養生期間 7 日"
    mock_spec = _spec_mock(revision_note=note)
    client = _make_client(get_rv=mock_spec)
    r = client.get("/api/v1/specs/1")
    assert r.status_code == 200
    body = r.json()
    assert body["ai_summary"] is not None
    assert "コンクリート圧縮強度" in body["ai_summary"]


# ── BIM モデル ─────────────────────────────────────────────────────────────


def _bim_mock(id_val: int = 1, lod: str = "LOD200") -> MagicMock:
    obj = MagicMock()
    obj.id = id_val
    obj.model_name = "橋梁BIMモデル"
    obj.project_id = None
    obj.file_format = "IFC"
    obj.ifc_schema = "IFC4"
    obj.storage_url = "s3://cdx-bucket/bridge.ifc"
    obj.file_size_bytes = 2048
    obj.version = 1
    obj.lod = lod
    obj.crs = None
    obj.attributes = {}
    return obj


def test_bim_list_empty() -> None:
    client = _make_client(execute_rv=_scalars_all([]))
    r = client.get("/api/v1/bim")
    assert r.status_code == 200
    assert r.json() == []


def test_bim_list_returns_models() -> None:
    client = _make_client(execute_rv=_scalars_all([_bim_mock()]))
    r = client.get("/api/v1/bim")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["model_name"] == "橋梁BIMモデル"
    assert body[0]["lod"] == "LOD200"


def test_bim_get_by_id() -> None:
    mock_model = _bim_mock()
    client = _make_client(get_rv=mock_model)
    r = client.get("/api/v1/bim/1")
    assert r.status_code == 200
    assert r.json()["file_format"] == "IFC"


def test_bim_get_not_found() -> None:
    client = _make_client(get_rv=None)
    r = client.get("/api/v1/bim/999")
    assert r.status_code == 404


def test_bim_patch_metadata_updates_lod() -> None:
    mock_model = _bim_mock(lod="LOD200")
    client = _make_client(get_rv=mock_model)
    r = client.patch("/api/v1/bim/1", json={"lod": "LOD300"})
    assert r.status_code == 200
    # route does: model.lod = body.lod, then flush
    assert r.json()["lod"] == "LOD300"
