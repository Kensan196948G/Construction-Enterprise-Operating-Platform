#requires -Version 5.1
<#
.SYNOPSIS
    Civil Construction IMS モック WebUI を停止する。
.PARAMETER RemoveImage
    イメージ(civil-ims-web-mock)も削除する。
#>
[CmdletBinding()]
param([switch]$RemoveImage)

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
$Compose  = Join-Path $RepoRoot 'docker-compose.mock.yml'

Write-Host '⏹ モック WebUI を停止します...' -ForegroundColor Cyan
& docker compose -f $Compose down
if ($LASTEXITCODE -ne 0) { throw "docker compose down に失敗しました (exit=$LASTEXITCODE)" }

if ($RemoveImage) {
    & docker image rm civil-ims-web-mock:latest -f 2>$null
    Write-Host '🗑  イメージを削除しました。' -ForegroundColor Gray
}
Write-Host '✅ 停止しました。' -ForegroundColor Green
