-- =========================================================
-- Construction DX One Platform — PostgreSQL 初期化スクリプト
-- Docker (postgis/postgis or timescale/timescaledb-ha) の
-- /docker-entrypoint-initdb.d/ にマウントして初回起動時に実行する。
-- =========================================================

-- PostGIS (地理情報)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- TimescaleDB (時系列ハイパーテーブル)
-- NOTE: TimescaleDB は別途インストール済みのイメージで使用すること。
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 全文検索 / トリグラム
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- タイムゾーン (Asia/Tokyo を既定にしておく場合)
SET TIME ZONE 'UTC';
