"""Pydantic schemas for the Data Lake & Digital Twin API."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class _Read(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---- DataSource ---------------------------------------------------------
class DataSourceCreate(BaseModel):
    department_id: str
    system_name: str
    source_type: str
    connection_info: dict | None = None
    schedule_cron: str | None = None
    description: str | None = None
    is_active: bool = True


class DataSourceRead(_Read):
    source_id: uuid.UUID
    department_id: str
    system_name: str
    source_type: str
    connection_info: dict | None
    schedule_cron: str | None
    description: str | None
    is_active: bool
    last_ingested_at: datetime | None
    created_at: datetime


# ---- ETL ---------------------------------------------------------------
class EtlJobCreate(BaseModel):
    name: str
    source_id: uuid.UUID | None = None
    airflow_dag_id: str | None = None
    transform_steps: list[dict] | None = None
    output_table: str
    schedule_cron: str | None = None


class EtlJobRead(_Read):
    job_id: uuid.UUID
    name: str
    source_id: uuid.UUID | None
    airflow_dag_id: str | None
    output_table: str
    schedule_cron: str | None
    status: str
    last_run_at: datetime | None
    transform_steps: list[dict] | None
    created_at: datetime


class EtlRunRead(_Read):
    run_id: uuid.UUID
    job_id: uuid.UUID
    started_at: datetime
    finished_at: datetime | None
    status: str
    rows_in: int | None
    rows_out: int | None
    error_message: str | None


# ---- Lake / Analytics --------------------------------------------------
class LakeTableRead(_Read):
    table_id: uuid.UUID
    table_name: str
    zone: str
    schema_def: dict | None
    row_count: int | None
    partition_keys: list[str] | None
    description: str | None
    source_systems: list[str] | None
    last_updated: datetime | None


class AnalyticsDatasetRead(_Read):
    dataset_id: uuid.UUID
    name: str
    dbt_model: str | None
    purpose: str | None
    owner: str | None
    tags: list[str] | None
    row_count: int | None
    freshness_sla_min: int | None
    last_refreshed_at: datetime | None


class AnalyticsQueryRequest(BaseModel):
    dataset: str
    select: list[str] | None = None
    where: dict | None = None
    limit: int = Field(default=100, ge=1, le=10_000)


# ---- AI Model ----------------------------------------------------------
class AiModelCreate(BaseModel):
    name: str
    version: str = "v1"
    model_type: str
    framework: str | None = None
    metrics: dict | None = None
    accuracy: float | None = None
    artifact_uri: str | None = None
    description: str | None = None


class AiModelRead(_Read):
    model_id: uuid.UUID
    name: str
    version: str
    model_type: str
    framework: str | None
    metrics: dict | None
    accuracy: float | None
    deploy_status: str
    artifact_uri: str | None
    description: str | None
    created_at: datetime


class InferenceRequest(BaseModel):
    inputs: dict | list[dict]
    options: dict | None = None


class InferenceResponse(BaseModel):
    model_id: uuid.UUID
    outputs: Any
    elapsed_ms: float


# ---- IoT ---------------------------------------------------------------
class IotDeviceCreate(BaseModel):
    name: str
    kind: str
    location_name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    altitude_m: float | None = None
    project_id: uuid.UUID | None = None
    mqtt_topic: str | None = None
    connection_info: dict | None = None


class IotDeviceRead(_Read):
    device_id: uuid.UUID
    name: str
    kind: str
    location_name: str | None
    latitude: float | None
    longitude: float | None
    project_id: uuid.UUID | None
    status: str
    last_seen_at: datetime | None


class TelemetryIngest(BaseModel):
    device_id: uuid.UUID
    metric_kind: str
    time: datetime | None = None
    payload: dict


# ---- Digital Twin -------------------------------------------------------
class DigitalTwinObjectCreate(BaseModel):
    name: str
    kind: str
    project_id: uuid.UUID | None = None
    asset_3d_uri: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    altitude_m: float | None = None
    heading_deg: float | None = None
    attributes: dict | None = None


class DigitalTwinObjectRead(_Read):
    object_id: uuid.UUID
    name: str
    kind: str
    project_id: uuid.UUID | None
    asset_3d_uri: str | None
    latitude: float | None
    longitude: float | None
    altitude_m: float | None
    heading_deg: float | None
    attributes: dict | None
    updated_at: datetime


# ---- Search ------------------------------------------------------------
class SearchRequest(BaseModel):
    query: str
    size: int = Field(default=20, ge=1, le=200)
    indices: list[str] | None = None


class SearchHit(BaseModel):
    index: str
    score: float
    source: dict
    highlights: dict | None = None
