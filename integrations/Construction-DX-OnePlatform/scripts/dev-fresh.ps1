# =============================================================
# dev-fresh.ps1
#   開発環境の clean install + alembic upgrade + シード投入
# =============================================================
[CmdletBinding()]
param(
    [switch]$SkipDocker,
    [switch]$SkipSeed
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path "$PSScriptRoot/.."
Push-Location $root

try {
    if (-not $SkipDocker) {
        Write-Host "[1/5] docker compose down -v (clean volumes)..." -ForegroundColor Cyan
        docker compose down -v
        Write-Host "[2/5] docker compose up -d (data layer only)..." -ForegroundColor Cyan
        docker compose up -d postgres redis minio elasticsearch
        Write-Host "    waiting for postgres healthy..."
        $tries = 0
        while ($tries -lt 30) {
            $status = docker inspect --format='{{.State.Health.Status}}' cdx-postgres 2>$null
            if ($status -eq 'healthy') { break }
            Start-Sleep -Seconds 2
            $tries++
        }
        if ($status -ne 'healthy') { throw "postgres did not become healthy" }
    }

    Write-Host "[3/5] pip install shared modules (editable)..." -ForegroundColor Cyan
    python -m pip install -U pip
    python -m pip install -e "00_共通基盤/shared-auth"
    python -m pip install -e "00_共通基盤/shared-db"

    Write-Host "[4/5] alembic upgrade head (shared-db)..." -ForegroundColor Cyan
    Push-Location "00_共通基盤/shared-db"
    try {
        alembic upgrade head
    } finally { Pop-Location }

    if (-not $SkipSeed) {
        Write-Host "[5/5] seed master data..." -ForegroundColor Cyan
        Push-Location "00_共通基盤/shared-db"
        try {
            python seeds/seed_master.py
        } finally { Pop-Location }
    } else {
        Write-Host "[5/5] (skip seed)" -ForegroundColor DarkGray
    }

    Write-Host ""
    Write-Host "Done. Bring up app layer next: docker compose up -d" -ForegroundColor Green
} finally {
    Pop-Location
}
