# ==============================================================================
# Construction-Enterprise-OS — タスクスケジューラー登録解除スクリプト
# 実行方法: 管理者権限で .\scripts\windows\unregister-autostart.ps1
# ==============================================================================

$TaskName = "Construction-Enterprise-OS-Autostart"

$currentPrincipal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "⚠️  管理者権限で実行してください" -ForegroundColor Red
    exit 1
}

$existing = schtasks /query /tn $TaskName 2>&1
if ($LASTEXITCODE -eq 0) {
    schtasks /delete /tn $TaskName /f 2>&1 | Out-Null
    Write-Host "✅ タスク '$TaskName' を削除しました" -ForegroundColor Green
} else {
    Write-Host "ℹ️  タスク '$TaskName' は登録されていません" -ForegroundColor Gray
}
