#requires -Version 5.1
<#
.SYNOPSIS
    機器(ホスト)起動時にモック WebUI を自動起動する Windows タスクを登録する。

.DESCRIPTION
    docker-compose の `restart: always` に加え、Docker Desktop 自体の起動も保証するため、
    Windows Task Scheduler に「システム起動時(ONSTART)」トリガのタスクを登録する。
    タスクは Start-MockUI.ps1 を実行し、Docker が立ち上がるまで待機してからコンテナを起動する。

    解除: pwsh -NoProfile -File .\scripts\mock\Register-MockUI-Autostart.ps1 -Unregister

.PARAMETER Port
    自動起動時に使用するポート (既定 18080)。
.PARAMETER Unregister
    登録済みタスクを削除する。
#>
[CmdletBinding()]
param(
    [int]$Port = 18080,
    [switch]$Unregister
)

$ErrorActionPreference = 'Stop'
$TaskName = 'CivilIMS-MockUI-Autostart'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..' '..')).Path
$StartScript = Join-Path $RepoRoot 'scripts\mock\Start-MockUI.ps1'

if ($Unregister) {
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "🗑  自動起動タスク '$TaskName' を削除しました。" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  タスク '$TaskName' は登録されていません。" -ForegroundColor Gray
    }
    return
}

# Docker 起動待ち + モック起動を行うラッパーコマンド
$inner = @"
`$ErrorActionPreference='SilentlyContinue'
for (`$i=0; `$i -lt 30; `$i++) {
    docker info *> `$null
    if (`$LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 10
}
& '$StartScript' -Port $Port
"@
$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($inner))

# Docker Desktop はサインインしたユーザーのセッションで起動するため、
# タスクも「現ユーザーのログオン時(AtLogOn)」に実行する。
# SYSTEM の AtStartup では Docker Desktop / docker CLI に到達できないため不可。
$currentUser = "$env:USERDOMAIN\$env:USERNAME"

$action  = New-ScheduledTaskAction -Execute 'pwsh.exe' `
    -Argument "-NoProfile -WindowStyle Hidden -EncodedCommand $encoded"
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
$trigger.Delay = 'PT60S'  # ログオン 60 秒後に実行 (Docker Desktop 起動猶予)
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Highest
$settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
    -Principal $principal -Settings $settings -Force | Out-Null

Write-Host "✅ 自動起動タスク '$TaskName' を登録しました。" -ForegroundColor Green
Write-Host "   - トリガ: ユーザーログオン時 (60秒後) / 実行ユーザー: $currentUser" -ForegroundColor Gray
Write-Host "   - ポート: $Port" -ForegroundColor Gray
Write-Host "   - 解除:   pwsh -NoProfile -File .\scripts\mock\Register-MockUI-Autostart.ps1 -Unregister" -ForegroundColor Gray
Write-Host ''
Write-Host '⚠️  Docker Desktop も「Windows 起動時に自動起動」に設定してください' -ForegroundColor Yellow
Write-Host '    (Docker Desktop → Settings → General → Start Docker Desktop when you sign in)' -ForegroundColor Yellow
