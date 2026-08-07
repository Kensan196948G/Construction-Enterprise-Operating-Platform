"""Digital Twin scene builder.

Aggregates geometry + metadata from multiple departments (construction sites,
heavy equipment, vessels, IoT devices) into a single GeoJSON
FeatureCollection consumable by Cesium / Leaflet on the frontend.
"""
from __future__ import annotations

import logging
from collections.abc import Iterable, Mapping
from typing import Any

logger = logging.getLogger(__name__)

_KIND_ICON = {
    "building": "building",
    "structure": "structure",
    "heavy_equipment": "tractor",
    "vessel": "ship",
    "site": "site",
}


def object_to_feature(obj: Mapping[str, Any]) -> dict[str, Any] | None:
    """Convert a DigitalTwinObject-like mapping into a GeoJSON Feature.

    Returns ``None`` if no usable geometry (lat/lng) is available.
    """
    lat = obj.get("latitude")
    lng = obj.get("longitude")
    if lat is None or lng is None:
        return None
    alt = obj.get("altitude_m") or 0.0
    coords: list[float] = [float(lng), float(lat), float(alt)]
    kind = obj.get("kind", "site")
    props: dict[str, Any] = {
        "object_id": str(obj.get("object_id")) if obj.get("object_id") is not None else None,
        "name": obj.get("name"),
        "kind": kind,
        "icon": _KIND_ICON.get(kind, "site"),
        "project_id": str(obj.get("project_id")) if obj.get("project_id") else None,
        "asset_3d_uri": obj.get("asset_3d_uri"),
        "heading_deg": obj.get("heading_deg"),
    }
    if isinstance(obj.get("attributes"), Mapping):
        props["attributes"] = dict(obj["attributes"])
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": coords},
        "properties": {k: v for k, v in props.items() if v is not None},
    }


def device_to_feature(device: Mapping[str, Any]) -> dict[str, Any] | None:
    """Project an IoT device row into the same GeoJSON layer."""
    lat = device.get("latitude")
    lng = device.get("longitude")
    if lat is None or lng is None:
        return None
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [float(lng), float(lat), float(device.get("altitude_m") or 0)]},
        "properties": {
            "device_id": str(device.get("device_id")) if device.get("device_id") else None,
            "name": device.get("name"),
            "kind": device.get("kind"),
            "status": device.get("status"),
            "icon": "sensor",
            "feature_layer": "iot",
        },
    }


def build_scene(
    objects: Iterable[Mapping[str, Any]],
    *,
    devices: Iterable[Mapping[str, Any]] | None = None,
    bbox: tuple[float, float, float, float] | None = None,
) -> dict[str, Any]:
    """Build the FeatureCollection for a 3D Cesium scene.

    ``bbox`` is (minLng, minLat, maxLng, maxLat). Returned in metadata for the
    frontend to fit camera bounds.
    """
    features: list[dict[str, Any]] = []
    for obj in objects:
        feat = object_to_feature(obj)
        if feat is not None:
            features.append(feat)
    if devices:
        for dev in devices:
            feat = device_to_feature(dev)
            if feat is not None:
                features.append(feat)
    fc: dict[str, Any] = {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "count": len(features),
            "bbox": list(bbox) if bbox else None,
        },
    }
    return fc
