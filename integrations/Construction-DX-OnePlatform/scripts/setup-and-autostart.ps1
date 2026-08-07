# =========================================================
# Construction DX One Platform — 初回セットアップ + 自動起動有効化 (ワンコマンド)
#
# 実行内容:
#   1. Firewall ルール投入 (要管理者権限、フラグでスキップ可)
#   2. 依存セットアップ (npm install / pip install)
#   3. 自動起動タスクをタスクスケジューラに登録
#   4. 即時 fullstack 起動
#
# 実行 (管理者 PowerShell 推奨):
#   PS> Start-Process powershell -Verb RunAs -ArgumentList "-NoExit -File .\scripts\setup-and-autostart.ps1"
#
# Firewall なしで実行 (一般ユーザー、ローカルからのみアクセス):
#   PS> .\scripts\setup-and-autostart.ps1 -SkipFirewall
# =========================================================

param(
    [switch]$SkipFirewall = $false
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Construction DX One Platform — 初回セットアップ + 自動起動" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ---- Step 1: Firewall ルール投入 ----
if (-not $SkipFirewall) {
    Write-Host "[1/4] 🔥 Firewall ルール投入..." -ForegroundColor Yellow
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if ($isAdmin) {
        & "$Root\scripts\firewall-rules.ps1"
    } else {
        Write-Warning "  管理者権限でないため Firewall ルール投入をスキップ"
        Write-Host "  → 管理者 PowerShell で .\scripts\firewall-rules.ps1 を後で実行してください" -ForegroundColor Yellow
    }
} else {
    Write-Host "[1/4] 🔥 Firewall ルール投入 (スキップ指定)" -ForegroundColor DarkGray
}

# ---- Step 2: 依存セットアップ + 即時起動 ----
Write-Host ""
Write-Host "[2/4] 📦 依存セットアップ + 即時起動..." -ForegroundColor Yellow
& "$Root\scripts\fullstack-up-all.ps1"

# ---- Step 3: 自動起動タスク登録 ----
Write-Host ""
Write-Host "[3/4] ⏰ 自動起動タスク登録..." -ForegroundColor Yellow
& "$Root\scripts\autostart-install.ps1"

# ---- Step 4: 完了報告 ----
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "[4/4] ✅ セットアップ完了" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green

$LanIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" -and $_.PrefixOrigin -eq "Dhcp" } |
    Select-Object -First 1).IPAddress
if (-not $LanIp) { $LanIp = "localhost" }

Write-Host ""
Write-Host "📡 LAN IP             : $LanIp" -ForegroundColor Cyan
Write-Host "🌐 WebUI URL (代表)   : http://${LanIp}:5180  (01 経営企画)"
Write-Host "                        http://${LanIp}:5183  (04 施工)"
Write-Host "                        http://${LanIp}:5190  (11 統合データ)"
Write-Host "🐍 Backend API (代表) : http://${LanIp}:8001  (01 経営企画 backend)"
Write-Host "🎭 Mocks サーバー     : http://${LanIp}:8090"
Write-Host ""
Write-Host "🔁 次回 Windows ログオン時 → 60秒後に全 23 サービスが自動起動します。" -ForegroundColor Green
Write-Host ""
Write-Host "🛠 操作コマンド:"
Write-Host "  ▶️  起動   : .\scripts\fullstack-up-all.ps1"
Write-Host "  🛑 停止   : .\scripts\fullstack-down-all.ps1"
Write-Host "  ⏰ 自動解除: .\scripts\autostart-uninstall.ps1"
Write-Host "  🔍 タスク確認: Get-ScheduledTask -TaskName 'CDX-Fullstack-AutoStart'"
Write-Host ""
