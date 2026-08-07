# cdx-itsm-api

Construction DX ITSM & ZeroTrust Platform - Backend (FastAPI).

## Quick start

```bash
pip install -e ".[dev]"
alembic upgrade head
uvicorn itsm_api.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/health`

## Tests

```bash
pytest
```

## Modules

| Module | 役割 |
|--------|------|
| routes/tickets | チケット CRUD + 状態遷移 + SLA |
| routes/cmdb | CI/Relation/Topology |
| routes/logs_fortigate | FortiGate Syslog 検索 |
| routes/logs_cisco | Cisco SNMP イベント |
| routes/logs_entra | Entra ID サインインログ |
| routes/ai_helpdesk | RAG チャット |
| routes/knowledge | ナレッジ管理 |
| routes/dashboard | Wazuh/Zabbix/Grafana 連携 |
| services/syslog_receiver | UDP Syslog 受信 |
| services/snmp_collector | SNMPv3 Trap 受信 |
| services/entra_log_fetcher | Microsoft Graph 取得 |
| services/rag_engine | RAG + Azure OpenAI |
| services/sla_evaluator | 営業時間ベース SLA 計算 |
