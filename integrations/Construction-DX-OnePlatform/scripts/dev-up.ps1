#requires -Version 5.1
<#
.SYNOPSIS
  Construction DX One Platform 開発環境起動スクリプト (Windows 11)
.DESCRIPTION
  Docker Compose で Phase 1 の全サービスを起動します。
  Docker Desktop が起動している必要があります。
#>

[CmdletBinding()]
param(
    [switch]$Build,
    [switch]$Detached = $true,
    [string[]]$Services
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== Construction DX One Platform — Dev Up ===" -ForegroundColor Cyan
Write-Host "Root: $root"

if (-not (Test-Path "$root\.env")) {
    if (Test-Path "$root\.env.example") {
        Write-Warning ".env が見つかりません。.env.example をコピーします。"
        Copy-Item "$root\.env.example" "$root\.env"
        Write-Warning ".env を編集してから再実行してください。"
        exit 1
    } else {
        throw ".env も .env.example も見つかりません。"
    }
}

try { docker version --format '{{.Server.Version}}' | Out-Null }
catch { throw "Docker Desktop が起動していません。" }

$composeArgs = @('compose', 'up')
if ($Detached) { $composeArgs += '-d' }
if ($Build)    { $composeArgs += '--build' }
if ($Services) { $composeArgs += $Services }

Write-Host "docker $($composeArgs -join ' ')" -ForegroundColor Yellow
docker @composeArgs

Write-Host "`n=== サービス状態 ===" -ForegroundColor Cyan
docker compose ps
