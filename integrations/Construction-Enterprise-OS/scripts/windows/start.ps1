# ==============================================================================
# Construction-Enterprise-OS — Windows 起動スクリプト
# 実行方法: .\scripts\windows\start.ps1
# ==============================================================================

param(
    [switch]$InfraOnly,    # インフラのみ起動（DB/Redis/Kafka等）
    [switch]$CoreOnly,     # インフラ + Gateway + Auth のみ
    [switch]$Down,         # 停止
    [switch]$Restart,      # 再起動
    [switch]$Logs,         # ログ表示モード
    [string]$Service = ""  # 特定サービスのみ
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $ProjectRoot

$ComposeFiles = @("-f", "docker-compose.yml", "-f", "docker-compose.windows.yml")
$ProjectName  = "construction-os"
$ComposeCmd   = @("docker", "compose") + $ComposeFiles + @("-p", $ProjectName)

function Show-Status {
    Write-Host ""
    Write-Host "📊 コンテナ状態:" -ForegroundColor Cyan
    docker compose -f docker-compose.yml -f docker-compose.windows.yml -p $ProjectName ps --format "table {{.Name}}`t{{.Status}}`t{{.Ports}}" 2>&1
}

# ── 停止 ───────────────────────────────────────────────────────────────────
if ($Down) {
    Write-Host "🛑 停止中..." -ForegroundColor Yellow
    & docker compose -f docker-compose.yml -f docker-compose.windows.yml -p $ProjectName down
    Write-Host "✅ 停止完了" -ForegroundColor Green
    exit 0
}

# ── 再起動 ─────────────────────────────────────────────────────────────────
if ($Restart) {
    Write-Host "🔄 再起動中..." -ForegroundColor Yellow
    & docker compose -f docker-compose.yml -f docker-compose.windows.yml -p $ProjectName down
    Start-Sleep -Seconds 3
}

# ── ログ表示 ────────────────────────────────────────────────────────────────
if ($Logs) {
    if ($Service) {
        docker compose -f docker-compose.yml -f docker-compose.windows.yml -p $ProjectName logs -f $Service
    } else {
        docker compose -f docker-compose.yml -f docker-compose.windows.yml -p $ProjectName logs -f
    }
    exit 0
}

Write-Host "🚀 Construction-Enterprise-OS 起動中（Windows）..." -ForegroundColor Cyan
Write-Host "📁 $ProjectRoot" -ForegroundColor Gray

# .env が存在しない場合は自動作成
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env が見つかりません。.env.windows からコピーします..." -ForegroundColor DarkYellow
    Copy-Item ".env.windows" ".env"
}

# ── 起動サービス決定 ────────────────────────────────────────────────────────
$infraServices = @("postgres", "timescaledb", "redis", "rabbitmq", "elasticsearch", "kafka", "minio")
$coreServices  = $infraServices + @("gateway", "auth", "notification")

if ($Service) {
    Write-Host "🔧 サービス起動: $Service" -ForegroundColor Yellow
    & docker compose -f docker-compose.yml -f docker-compose.windows.yml -p $ProjectName up -d $Service
} elseif ($InfraOnly) {
    Write-Host "🔧 インフラのみ起動..." -ForegroundColor Yellow
    & docker compose -f docker-compose.yml -f docker-compose.windows.yml -p $ProjectName up -d @infraServices
} elseif ($CoreOnly) {
    Write-Host "🔧 コアサービス起動..." -ForegroundColor Yellow
    & docker compose -f docker-compose.yml -f docker-compose.windows.yml -p $ProjectName up -d @coreServices
} else {
    Write-Host "🔧 全サービス起動..." -ForegroundColor Yellow
    & docker compose -f docker-compose.yml -f docker-compose.windows.yml -p $ProjectName up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 起動に失敗しました" -ForegroundColor Red
    exit 1
}

# ── 起動待機 ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "⏱ サービス起動を待機中（30秒）..." -ForegroundColor Gray
Start-Sleep -Seconds 30

Show-Status

# ── アクセス情報 ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🌐 アクセス URL" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📱 WebUI (メイン — 推奨)" -ForegroundColor White
Write-Host "     http://172.23.10.251:3200" -ForegroundColor Green
Write-Host ""
Write-Host "  🖥️  WebUI (直接アクセス)" -ForegroundColor Gray
Write-Host "     http://172.23.10.251:3100" -ForegroundColor Gray
Write-Host ""
Write-Host "  📲 Mobile WebUI" -ForegroundColor Gray
Write-Host "     http://172.23.10.251:3101" -ForegroundColor Gray
Write-Host ""
Write-Host "  🚪 API Gateway (Swagger UI)" -ForegroundColor Gray
Write-Host "     http://172.23.10.251:9000/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "  ── 管理コンソール ──────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  📊 RabbitMQ  : http://172.23.10.251:15672  (construction-os / construction-os_dev)" -ForegroundColor DarkGray
Write-Host "  🔍 Kibana    : http://172.23.10.251:5601" -ForegroundColor DarkGray
Write-Host "  📦 MinIO     : http://172.23.10.251:9001  (minioadmin / minioadmin)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  ── ログ確認 ─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  .\scripts\windows\start.ps1 -Logs" -ForegroundColor DarkGray
Write-Host "  .\scripts\windows\start.ps1 -Logs -Service web" -ForegroundColor DarkGray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
