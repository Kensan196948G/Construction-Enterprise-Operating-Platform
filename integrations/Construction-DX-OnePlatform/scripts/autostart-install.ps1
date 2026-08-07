# =========================================================
# Construction DX One Platform — 自動起動セットアップ (At LogOn タスク)
#
# Windows タスクスケジューラに以下を登録:
#   - トリガー: ユーザーログオン時
#   - アクション: scripts\fullstack-up-all.ps1 -Hidden を実行
#   - 実行ユーザー: 現ユーザー (管理者権限不要)
#
# 実行: PS> .\scripts\autostart-install.ps1
# 解除: PS> .\scripts\autostart-uninstall.ps1
# 確認: PS> Get-ScheduledTask -TaskName "CDX-Fullstack-AutoStart"
# =========================================================

$ErrorActionPreference = "Stop"

$TaskName = "CDX-Fullstack-AutoStart"
$Root = Split-Path -Parent $PSScriptRoot
$ScriptPath = Join-Path $Root "scripts\fullstack-up-all.ps1"

if (-not (Test-Path $ScriptPath)) {
    Write-Error "❌ Script not found: $ScriptPath"
    exit 1
}

# 既存タスク削除 (冪等)
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

# アクション定義: PowerShell -Hidden -File ...fullstack-up-all.ps1 -Hidden
$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`" -Hidden" `
    -WorkingDirectory $Root

# トリガー定義: ユーザーログオン時 (1 分遅延でブート完了を待つ)
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$Trigger.Delay = "PT60S"  # 60 秒遅延

# 設定: 失敗時自動再試行、最大 1 時間実行
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)

# 実行ユーザー = 現ユーザー (interactive, 最高権限なし)
$Principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Limited

$Task = New-ScheduledTask -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal `
    -Description "Construction DX One Platform — 全 23 サービス (frontend 11 + backend 11 + mocks) を機器起動時に自動起動"

Register-ScheduledTask -TaskName $TaskName -InputObject $Task | Out-Null

Write-Host ""
Write-Host "✅ 自動起動タスクを登録しました: $TaskName" -ForegroundColor Green
Write-Host ""
Write-Host "📋 詳細:" -ForegroundColor Cyan
Write-Host "  トリガー    : ユーザーログオン時 (60 秒遅延)"
Write-Host "  実行スクリプト: $ScriptPath -Hidden"
Write-Host "  実行ユーザー : $env:USERDOMAIN\$env:USERNAME"
Write-Host "  再試行       : 失敗時 3 回 (1 分間隔)"
Write-Host ""
Write-Host "🔍 確認: Get-ScheduledTask -TaskName '$TaskName'"
Write-Host "▶️  手動実行: Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "🛑 解除  : .\scripts\autostart-uninstall.ps1"
Write-Host ""
Write-Host "💡 すぐに起動するには:  .\scripts\fullstack-up-all.ps1" -ForegroundColor Yellow
