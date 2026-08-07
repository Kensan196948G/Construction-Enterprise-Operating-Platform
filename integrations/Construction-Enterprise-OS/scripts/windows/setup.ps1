# ==============================================================================
# Construction-Enterprise-OS — Windows セットアップスクリプト
# 実行方法: .\scripts\windows\setup.ps1
# ==============================================================================

param(
    [switch]$SkipEnvCopy,
    [switch]$BuildOnly,
    [switch]$InfraOnly
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Write-Host "🏗️  Construction-Enterprise-OS — Windows セットアップ開始" -ForegroundColor Cyan
Write-Host "📁 プロジェクトルート: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

Set-Location $ProjectRoot

# ── ステップ 1: Docker Desktop 確認 ──────────────────────────────────────────
Write-Host "📌 [1/5] Docker Desktop 確認..." -ForegroundColor Yellow
try {
    $dockerVersion = docker version --format "{{.Server.Version}}" 2>&1
    Write-Host "✅ Docker $dockerVersion 起動中" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop が起動していません。起動してから再実行してください。" -ForegroundColor Red
    exit 1
}

# ── ステップ 2: .env ファイル準備 ────────────────────────────────────────────
Write-Host ""
Write-Host "📌 [2/5] 環境変数ファイル準備..." -ForegroundColor Yellow
if (-not $SkipEnvCopy) {
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.windows" ".env"
        Write-Host "✅ .env.windows を .env にコピーしました" -ForegroundColor Green
        Write-Host "⚠️  本番環境では .env の JWT_SECRET_KEY を変更してください" -ForegroundColor DarkYellow
    } else {
        Write-Host "ℹ️  .env は既に存在します（スキップ）" -ForegroundColor Gray
    }
}

# ── ステップ 3: ポート競合チェック ────────────────────────────────────────────
Write-Host ""
Write-Host "📌 [3/5] ポート競合チェック..." -ForegroundColor Yellow
$criticalPorts = @{
    3200 = "Nginx (WebUI entry)"
    3100 = "Web Frontend"
    3101 = "Mobile Frontend"
    9000 = "API Gateway"
    6379 = "Redis"
    9092 = "Kafka"
}

$conflicts = @()
foreach ($port in $criticalPorts.Keys) {
    $used = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($used) {
        $proc = Get-Process -Id $used[0].OwningProcess -ErrorAction SilentlyContinue
        $conflicts += "  ⚠️  ポート $port ($($criticalPorts[$port])) — プロセス: $($proc.Name)"
    } else {
        Write-Host "  ✅ ポート $port ($($criticalPorts[$port])) — 空き" -ForegroundColor Green
    }
}

if ($conflicts.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  以下のポートで競合が検出されました:" -ForegroundColor DarkYellow
    $conflicts | ForEach-Object { Write-Host $_ -ForegroundColor DarkYellow }
    Write-Host "docker-compose.windows.yml のポート設定を変更してから再実行してください。" -ForegroundColor DarkYellow
}

# ── ステップ 4: Docker イメージビルド ────────────────────────────────────────
if (-not $InfraOnly) {
    Write-Host ""
    Write-Host "📌 [4/5] Docker イメージビルド（初回は数分かかります）..." -ForegroundColor Yellow
    docker compose -f docker-compose.yml -f docker-compose.windows.yml build --parallel 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ビルドに失敗しました。ログを確認してください。" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ ビルド完了" -ForegroundColor Green
}

# ── ステップ 5: 完了メッセージ ───────────────────────────────────────────────
Write-Host ""
Write-Host "✅ セットアップ完了！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 次のコマンドで起動してください:" -ForegroundColor Cyan
Write-Host "   .\scripts\windows\start.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🌐 アクセス URL（起動後）:" -ForegroundColor Cyan
Write-Host "   WebUI (メイン)  : http://172.23.10.251:3200" -ForegroundColor White
Write-Host "   WebUI (直接)   : http://172.23.10.251:3100" -ForegroundColor Gray
Write-Host "   Mobile WebUI   : http://172.23.10.251:3101" -ForegroundColor Gray
Write-Host "   API Gateway    : http://172.23.10.251:9000/docs" -ForegroundColor Gray
Write-Host "   RabbitMQ 管理  : http://172.23.10.251:15672" -ForegroundColor Gray
Write-Host "   Kibana         : http://172.23.10.251:5601" -ForegroundColor Gray
Write-Host "   MinIO Console  : http://172.23.10.251:9001" -ForegroundColor Gray
