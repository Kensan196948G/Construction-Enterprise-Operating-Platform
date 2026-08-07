# =========================================================
# Construction DX One Platform — 自動起動解除
# =========================================================

$TaskName = "CDX-Fullstack-AutoStart"

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "✅ 自動起動タスクを解除しました: $TaskName" -ForegroundColor Green
} else {
    Write-Host "ℹ️  自動起動タスクは登録されていません: $TaskName" -ForegroundColor Yellow
}
