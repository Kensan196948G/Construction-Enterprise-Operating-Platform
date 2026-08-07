"""海象データ取得サービス.

気象庁海上予報 / 民間 API を `httpx` で取得し、主要観測点 5 ヶ所の
風向風速・波高・視程をデータベース (`t_marine_weather`) に upsert する。

API 未設定・取得失敗時は固定サンプル (フォールバック値) を返す。
"""
from __future__ import annotations

import logging
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx

LOG = logging.getLogger(__name__)


@dataclass(frozen=True)
class MarineForecast:
    area_code: str
    area_name: str
    issued_at: datetime
    wind_speed_mps: float | None
    wind_direction_deg: float | None
    wave_height_m: float | None
    visibility_km: float | None
    source: str


# 主要観測点 5 ヶ所 (要件): 気象庁 areacode は便宜的なもので、実 API に合わせ調整想定。
DEFAULT_STATIONS: tuple[tuple[str, str], ...] = (
    ("130000", "東京湾"),
    ("270000", "大阪湾"),
    ("230000", "伊勢湾"),
    ("400000", "関門海峡"),
    ("016010", "苫小牧沖"),
)


def _fallback(area_code: str, area_name: str) -> MarineForecast:
    """API 未設定 / 失敗時のフォールバック (穏やかな海象)."""
    # 観測点ごとに少しだけ違いをつけて UI 上の見栄えを担保
    h = (sum(ord(c) for c in area_code) % 7) / 10.0  # 0.0..0.6
    return MarineForecast(
        area_code=area_code,
        area_name=area_name,
        issued_at=datetime.now(timezone.utc),
        wind_speed_mps=5.0 + h * 2,
        wind_direction_deg=180.0,
        wave_height_m=1.0 + h,
        visibility_km=10.0,
        source="STUB",
    )


def _parse_jma_payload(
    payload: Any, area_code: str, area_name: str
) -> MarineForecast | None:
    """気象庁 JSON から主要値を抽出する (簡易・防御的).

    気象庁の `forecast/<area>.json` は配列ベースの複雑なスキーマだが、
    本実装は風 / 波 / 視程の数値が拾えれば拾い、なければ None を返す。
    """
    try:
        wind_speed = None
        wind_dir = None
        wave = None
        vis = None

        # 配列の先頭オブジェクトを走査して気象要素を浅く拾う
        items: list[Any]
        if isinstance(payload, list):
            items = payload
        elif isinstance(payload, dict):
            items = [payload]
        else:
            return None

        def _to_float(x: Any) -> float | None:
            try:
                return float(x)
            except (TypeError, ValueError):
                return None

        for it in items:
            if not isinstance(it, dict):
                continue
            # 風速
            if "wind" in it and isinstance(it["wind"], dict):
                w = it["wind"]
                wind_speed = _to_float(w.get("speed_mps") or w.get("speed"))
                wind_dir = _to_float(w.get("direction_deg") or w.get("direction"))
            # 波高
            if "wave" in it and isinstance(it["wave"], dict):
                wave = _to_float(it["wave"].get("height_m") or it["wave"].get("height"))
            # 視程
            if "visibility_km" in it:
                vis = _to_float(it["visibility_km"])

        if wind_speed is None and wave is None and vis is None:
            return None

        return MarineForecast(
            area_code=area_code,
            area_name=area_name,
            issued_at=datetime.now(timezone.utc),
            wind_speed_mps=wind_speed,
            wind_direction_deg=wind_dir,
            wave_height_m=wave,
            visibility_km=vis,
            source="JMA",
        )
    except Exception as e:  # pragma: no cover
        LOG.debug("JMA parse failed: %s", e)
        return None


async def fetch_marine_forecast(
    area_code: str,
    *,
    area_name: str | None = None,
    base_url: str = "https://www.jma.go.jp/bosai/forecast/data/forecast/",
    timeout_s: float = 5.0,
    client: httpx.AsyncClient | None = None,
) -> MarineForecast:
    """単一観測点の海上予報を取得する (失敗時は fallback)."""
    name = area_name or area_code
    url = f"{base_url}{area_code}.json"
    try:
        owned: httpx.AsyncClient | None = None
        if client is None:
            owned = httpx.AsyncClient(timeout=timeout_s)
            client = owned
        try:
            r = await client.get(url)
            r.raise_for_status()
            data = r.json()
        finally:
            if owned is not None:
                await owned.aclose()
        forecast = _parse_jma_payload(data, area_code, name)
        if forecast is not None:
            return forecast
        # データはあるが解析不能 → 拾えたフィールドのみ詰めた最小レコード
        return MarineForecast(
            area_code=area_code,
            area_name=name,
            issued_at=datetime.now(timezone.utc),
            wind_speed_mps=None,
            wind_direction_deg=None,
            wave_height_m=None,
            visibility_km=None,
            source="JMA",
        )
    except Exception as e:
        LOG.info("fetch_marine_forecast fallback for %s: %s", area_code, e)
        return _fallback(area_code, name)


async def fetch_all_stations(
    stations: Sequence[tuple[str, str]] = DEFAULT_STATIONS,
    *,
    base_url: str = "https://www.jma.go.jp/bosai/forecast/data/forecast/",
    timeout_s: float = 5.0,
) -> list[MarineForecast]:
    """主要観測点 5 ヶ所をまとめて取得する."""
    async with httpx.AsyncClient(timeout=timeout_s) as client:
        results: list[MarineForecast] = []
        for code, name in stations:
            f = await fetch_marine_forecast(
                code, area_name=name, base_url=base_url, client=client
            )
            results.append(f)
        return results


async def upsert_forecasts(
    forecasts: Iterable[MarineForecast],
) -> int:
    """取得した forecast を `t_marine_weather` に upsert する.

    依存が揃わない (テスト時 DB なし等) 場合は no-op で 0 を返す。
    """
    rows = list(forecasts)
    if not rows:
        return 0
    try:
        from sqlalchemy.dialects.postgresql import insert as pg_insert

        from cdx_db.session import get_sessionmaker
        from marine_api.models import MarineWeather
    except Exception as e:  # pragma: no cover
        LOG.warning("upsert deps unavailable: %s", e)
        return 0

    sm = get_sessionmaker()
    async with sm() as session:
        payload = [
            {
                "time": f.issued_at,
                "station_code": f.area_code,
                "station_name": f.area_name,
                "wind_speed_mps": f.wind_speed_mps,
                "wind_direction_deg": f.wind_direction_deg,
                "wave_height_m": f.wave_height_m,
                "visibility_km": f.visibility_km,
                "source": f.source,
            }
            for f in rows
        ]
        stmt = pg_insert(MarineWeather).values(payload)
        stmt = stmt.on_conflict_do_update(
            index_elements=["time", "station_code"],
            set_={
                "wind_speed_mps": stmt.excluded.wind_speed_mps,
                "wind_direction_deg": stmt.excluded.wind_direction_deg,
                "wave_height_m": stmt.excluded.wave_height_m,
                "visibility_km": stmt.excluded.visibility_km,
                "source": stmt.excluded.source,
            },
        )
        await session.execute(stmt)
        await session.commit()
        return len(payload)
