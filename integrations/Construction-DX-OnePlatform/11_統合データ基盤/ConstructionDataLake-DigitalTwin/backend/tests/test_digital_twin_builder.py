"""Digital twin builder: GeoJSON shaping."""
from __future__ import annotations

from data_api.services.digital_twin_builder import build_scene, object_to_feature


def test_object_to_feature_skips_when_lat_lng_missing() -> None:
    assert object_to_feature({"name": "ghost", "kind": "vessel"}) is None


def test_build_scene_collects_features_and_metadata() -> None:
    objs = [
        {
            "object_id": "00000000-0000-0000-0000-000000000001",
            "name": "横浜港工事",
            "kind": "structure",
            "latitude": 35.45,
            "longitude": 139.65,
            "altitude_m": 0,
            "attributes": {"phase": "construction"},
        },
        {
            "object_id": "00000000-0000-0000-0000-000000000002",
            "name": "ICT バックホー #1",
            "kind": "heavy_equipment",
            "latitude": 35.46,
            "longitude": 139.66,
            "heading_deg": 45.0,
        },
        {"object_id": "00000000-0000-0000-0000-000000000003", "name": "missing-geom", "kind": "building"},
    ]
    devices = [
        {"device_id": "10000000-0000-0000-0000-000000000001", "name": "温湿度センサ", "kind": "sensor",
         "latitude": 35.451, "longitude": 139.651, "status": "online"}
    ]
    fc = build_scene(objs, devices=devices)
    assert fc["type"] == "FeatureCollection"
    # 2 objects with geometry + 1 device = 3 features (the geomless object is skipped)
    assert fc["metadata"]["count"] == 3
    kinds = {f["properties"].get("kind") for f in fc["features"]}
    assert {"structure", "heavy_equipment", "sensor"}.issubset(kinds)
    # First feature should be a Point
    assert fc["features"][0]["geometry"]["type"] == "Point"
    assert fc["features"][0]["geometry"]["coordinates"][:2] == [139.65, 35.45]
