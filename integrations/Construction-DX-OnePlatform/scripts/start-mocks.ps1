#requires -Version 5.1
<#
.SYNOPSIS
  部門間 API mock サーバ (mocks/) を docker compose で起動
.DESCRIPTION
  - profile=mocks を有効化し、`mocks` サービスのみを up する
  - 既に起動していれば --build オプションで再ビルドのみ走らせる
#>

[CmdletBinding()]
param(
    [switch]$Build,
    [switch]$Detached = $true,
    [switch]$Logs
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== Construction DX — start-mocks ===" -ForegroundColor Cyan

try { docker version --format '{{.Server.Version}}' | Out-Null }
catch { throw "Docker Desktop が起動していません。" }

$composeArgs = @('compose', '--profile', 'mocks', 'up')
if ($Detached) { $composeArgs += '-d' }
if ($Build)    { $composeArgs += '--build' }
$composeArgs += 'mocks'

Write-Host "docker $($composeArgs -join ' ')" -ForegroundColor Yellow
docker @composeArgs

Write-Host "`nhealth:" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8090/health' -UseBasicParsing -TimeoutSec 5
    Write-Host $r.Content
} catch {
    Write-Warning "health check 失敗: $($_.Exception.Message)"
}

if ($Logs) { docker compose logs -f mocks }
