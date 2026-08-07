#Requires -RunAsAdministrator
<#
.SYNOPSIS
    ServiceHub を Windows タスクスケジューラーに登録する。
.DESCRIPTION
    管理者権限の PowerShell で一度だけ実行する。
    登録後は PC ログオン時に ServiceHub が自動起動する。
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDir  = "C:\ServiceHub\ServiceHub-Construction-Platform\scripts\windows"
$StartScript = "$ScriptDir\start-servicehub.ps1"
$StopScript  = "$ScriptDir\stop-servicehub.ps1"
$TaskPath    = "\ServiceHub\"

Write-Host "=== ServiceHub タスクスケジューラー登録 ===" -ForegroundColor Cyan

# ─── 起動タスク ───────────────────────────────────────────────
$startAction = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$StartScript`""

# ログオン時 + 遅延60秒（Docker Desktop の事前起動を待つ）
$startTrigger = New-ScheduledTaskTrigger -AtLogOn
$startTrigger.Delay = "PT60S"   # ISO 8601: 60秒遅延

$startSettings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 3) `
    -MultipleInstances IgnoreNew

$startPrincipal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -RunLevel Highest `
    -LogonType Interactive

# 既存タスクの削除（上書き登録）
$existingStart = Get-ScheduledTask -TaskPath $TaskPath -TaskName "ServiceHub-Start" -ErrorAction SilentlyContinue
if ($existingStart) {
    Unregister-ScheduledTask -TaskPath $TaskPath -TaskName "ServiceHub-Start" -Confirm:$false
    Write-Host "既存の ServiceHub-Start タスクを削除しました" -ForegroundColor Yellow
}

Register-ScheduledTask `
    -TaskName "ServiceHub-Start" `
    -TaskPath $TaskPath `
    -Action $startAction `
    -Trigger $startTrigger `
    -Settings $startSettings `
    -Principal $startPrincipal `
    -Description "ServiceHub Construction Platform の自動起動（IP 自動検出・Frontend 再ビルド対応）" | Out-Null

Write-Host "✅ ServiceHub-Start タスク登録完了" -ForegroundColor Green

# ─── 停止タスク（シャットダウン前） ─────────────────────────────
$stopAction = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$StopScript`""

# OnEvent トリガー: システムシャットダウンイベント(EventID=1074)
$stopTriggerXml = @"
<QueryList>
  <Query Id="0">
    <Select Path="System">
      *[System[Provider[@Name='USER32'] and EventID=1074]]
    </Select>
  </Query>
</QueryList>
"@

$stopTrigger = New-ScheduledTaskTrigger -AtLogOff

$stopPrincipal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -RunLevel Highest `
    -LogonType Interactive

$existingStop = Get-ScheduledTask -TaskPath $TaskPath -TaskName "ServiceHub-Stop" -ErrorAction SilentlyContinue
if ($existingStop) {
    Unregister-ScheduledTask -TaskPath $TaskPath -TaskName "ServiceHub-Stop" -Confirm:$false
}

Register-ScheduledTask `
    -TaskName "ServiceHub-Stop" `
    -TaskPath $TaskPath `
    -Action $stopAction `
    -Trigger $stopTrigger `
    -Principal $stopPrincipal `
    -Description "ServiceHub Construction Platform のシャットダウン時停止" | Out-Null

Write-Host "✅ ServiceHub-Stop タスク登録完了" -ForegroundColor Green

# ─── 確認出力 ────────────────────────────────────────────────
Write-Host ""
Write-Host "=== 登録済みタスク一覧 ===" -ForegroundColor Cyan
Get-ScheduledTask -TaskPath $TaskPath | Format-Table TaskName, State, Description -AutoSize

Write-Host ""
Write-Host "手動テスト実行:" -ForegroundColor Yellow
Write-Host "  Start-ScheduledTask -TaskPath '$TaskPath' -TaskName 'ServiceHub-Start'"
Write-Host ""
Write-Host "タスクスケジューラー GUI 確認: taskschd.msc → タスク スケジューラー ライブラリ → ServiceHub"
