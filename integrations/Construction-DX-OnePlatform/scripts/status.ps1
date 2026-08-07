#requires -Version 5.1
<#
.SYNOPSIS
  Construction DX One Platform プロジェクト状態スナップショット
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Construction DX One Platform — STATUS  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n[Docker]" -ForegroundColor Yellow
try { docker compose ps 2>&1 | Out-Host } catch { Write-Host "Docker未起動 or compose未構成" }

Write-Host "`n[Git]" -ForegroundColor Yellow
if (Test-Path "$root\.git") {
    git -C $root status -s
    git -C $root log --oneline -n 5
} else {
    Write-Host "Git 未初期化"
}

Write-Host "`n[Phase 進捗]" -ForegroundColor Yellow
if (Test-Path "$root\PROJECT_BOARD.md") {
    Select-String -Path "$root\PROJECT_BOARD.md" -Pattern '^\| Phase' -Context 0,6 |
        ForEach-Object { $_.Line; $_.Context.PostContext } |
        Out-Host
} else {
    Write-Host "PROJECT_BOARD.md 未作成"
}
