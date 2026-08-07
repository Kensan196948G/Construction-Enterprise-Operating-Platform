# 詳細設計仕様書：Construction ITSM & ZeroTrust Platform
# IT/DX部門 業務支援システム（Phase1最優先）

| 項目 | 内容 |
|------|------|
| ドキュメントID | DDS-ITZ-001 |
| バージョン | 1.0 |
| 作成日 | 2026-05-16 |
| 関連要件定義 | REQ-ITZ-001 |

---

## 1. システムアーキテクチャ

```
┌──────────────────────────────────────────────────┐
│           フロントエンド (React)                    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │ITSM│ │CMDB│ │SIEM│ │資産 │ │監視 │ │AI   │     │
│  │    │ │    │ │    │ │管理 │ │    │ │Help │     │
│  └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘     │
├─────┴──────┴──────┴──────┴──────┴──────┴────────┤
│              バックエンド (FastAPI)                 │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐         │
│  │ITSM   │ │CMDB   │ │SIEM   │ │Monitor│         │
│  │Engine │ │Engine │ │Engine │ │Engine │         │
│  └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘         │
├──────┴─────────┴─────────┴─────────┴────────────┤
│ PostgreSQL │ TimescaleDB │ Elasticsearch          │
│ Wazuh      │ Zabbix      │ Grafana               │
│ Redis      │ Entra ID    │ Azure OpenAI           │
└──────────────────────────────────────────────────┘
```

---

## 2. データベース設計

### t_itsm_ticket（ITSMチケット）
```sql
CREATE TABLE t_itsm_ticket (
    ticket_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number       VARCHAR(20) UNIQUE NOT NULL,
    ticket_type         VARCHAR(20),  -- 'incident'/'problem'/'change'/'request'
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    priority            VARCHAR(10),  -- 'critical'/'high'/'medium'/'low'
    status              VARCHAR(20) DEFAULT 'open',
    category            VARCHAR(50),
    assignee_id         UUID REFERENCES t_employee(emp_id),
    reporter_id         UUID REFERENCES t_employee(emp_id),
    sla_target          TIMESTAMPTZ,
    resolved_at         TIMESTAMPTZ,
    resolution          TEXT,
    ai_classified       BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ticket_status ON t_itsm_ticket(status, priority);
```

### t_cmdb_item（構成アイテム）
```sql
CREATE TABLE t_cmdb_item (
    ci_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ci_type             VARCHAR(30),  -- 'server'/'pc'/'network'/'software'/'printer'
    name                VARCHAR(200) NOT NULL,
    serial_number       VARCHAR(50),
    manufacturer        VARCHAR(100),
    model               VARCHAR(100),
    os                  VARCHAR(100),
    ip_address          INET,
    mac_address         MACADDR,
    location            VARCHAR(200),
    assigned_to         UUID REFERENCES t_employee(emp_id),
    status              VARCHAR(20) DEFAULT 'active',
    purchase_date       DATE,
    warranty_end        DATE,
    entra_device_id     VARCHAR(200),
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### t_security_event（セキュリティイベント - TimescaleDB）
```sql
CREATE TABLE t_security_event (
    time                TIMESTAMPTZ NOT NULL,
    source              VARCHAR(30),  -- 'fortigate'/'cisco'/'entra'/'wazuh'
    event_type          VARCHAR(50),
    severity            VARCHAR(10),
    source_ip           INET,
    destination_ip      INET,
    description         TEXT,
    raw_log             JSONB
);
SELECT create_hypertable('t_security_event', 'time');
CREATE INDEX idx_sec_event_severity ON t_security_event(severity, time DESC);
```

### t_network_metric（ネットワークメトリクス - TimescaleDB）
```sql
CREATE TABLE t_network_metric (
    time                TIMESTAMPTZ NOT NULL,
    device_id           UUID REFERENCES t_cmdb_item(ci_id),
    metric_type         VARCHAR(30),  -- 'cpu'/'memory'/'bandwidth'/'latency'
    value               DECIMAL(15,4),
    unit                VARCHAR(20)
);
SELECT create_hypertable('t_network_metric', 'time');
```

---

## 3. API設計

| メソッド | パス | 説明 |
|----------|------|------|
| GET/POST | /api/v1/tickets | チケットCRUD |
| POST | /api/v1/tickets/{id}/assign | アサイン |
| POST | /api/v1/tickets/{id}/resolve | 解決 |
| GET | /api/v1/tickets/sla-report | SLAレポート |
| GET/POST | /api/v1/cmdb | 構成アイテムCRUD |
| GET | /api/v1/cmdb/topology | ネットワークトポロジー |
| POST | /api/v1/cmdb/discovery | 自動ディスカバリ |
| GET | /api/v1/security/events | セキュリティイベント |
| GET | /api/v1/security/dashboard | SIEM ダッシュボード |
| GET | /api/v1/monitoring/network | ネットワーク監視 |
| GET | /api/v1/monitoring/fortigate | FortiGate監視 |
| GET | /api/v1/monitoring/cisco | Cisco監視 |
| POST | /api/v1/ai/helpdesk | AI HelpDesk |
| GET | /api/v1/ai/helpdesk/knowledge | ナレッジ検索 |

---

## 4. FortiGate連携設計
- Syslog (UDP/514) によるログ収集
- FortiGate REST API によるポリシー情報取得
- VPN接続状況のリアルタイム表示
- 脅威検知アラートの自動チケット起票

## 5. Cisco連携設計
- SNMP v3 によるデバイス監視
- Netconf/RESTCONF による設定管理
- CDP/LLDP によるトポロジー自動検出

## 6. AI HelpDesk設計
- Azure OpenAI GPT-4o + RAG
- ナレッジベース: ITSM解決履歴 + FAQ + マニュアル
- 自動チケット分類（priority + category 自動設定）

