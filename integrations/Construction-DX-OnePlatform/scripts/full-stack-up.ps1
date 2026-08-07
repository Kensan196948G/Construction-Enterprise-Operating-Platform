#requires -Version 5.1
<#
.SYNOPSIS
  Construction DX One Platform — フルスタック起動 (data + mocks + 11 部門 + gateway)
.DESCRIPTION
  起動順序:
    1) data layer       (postgres / redis / elasticsearch / minio)
    2) mocks            (部門間 API モック)
    3) api-gateway      (00 共通基盤)
    4) 全 11 部門の API (depends_on で postgres healthy 待ち)
    5) 全 11 部門の Web (各 API 起動後)

  各段階で healthcheck を best-effort で待機し、失敗しても次段階に進む。
.NOTES
  - 開発用途。本番起動は別 compose / k8s で行う想定。
  - `-Build` 指定で全イメージを事前に build する。
  - `-SkipMocks` 指定で mocks 起動をスキップ。
#>

[CmdletBinding()]
param(
    [switch]$Build,
    [switch]$SkipMocks,
    [int]$WaitSec = 30
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== Construction DX — full-stack up ===" -ForegroundColor Cyan
Write-Host "Root: $root"

try { docker version --format '{{.Server.Version}}' | Out-Null }
catch { throw "Docker Desktop が起動していません。" }

if (-not (Test-Path "$root\.env")) {
    if (Test-Path "$root\.env.example") {
        Write-Warning ".env が無いので .env.example をコピーします。"
        Copy-Item "$root\.env.example" "$root\.env"
    }
}

function Invoke-ComposeUp {
    param(
        [Parameter(Mandatory)] [string[]] $Services,
        [string[]] $Profiles
    )
    $args = @('compose')
    foreach ($p in ($Profiles ?? @())) { $args += @('--profile', $p) }
    $args += @('up', '-d')
    if ($Build) { $args += '--build' }
    $args += $Services
    Write-Host "`ndocker $($args -join ' ')" -ForegroundColor Yellow
    & docker @args
}

# --- 1) data layer ---
Write-Host "`n[1/5] data layer" -ForegroundColor Green
Invoke-ComposeUp -Services @('postgres', 'redis', 'elasticsearch', 'minio')
Start-Sleep -Seconds 5

# --- 2) mocks ---
if (-not $SkipMocks) {
    Write-Host "`n[2/5] mocks" -ForegroundColor Green
    Invoke-ComposeUp -Services @('mocks') -Profiles @('mocks')
} else {
    Write-Host "`n[2/5] mocks  -- スキップ" -ForegroundColor DarkGray
}

# --- 3) api-gateway ---
Write-Host "`n[3/5] api-gateway" -ForegroundColor Green
Invoke-ComposeUp -Services @('api-gateway')

# --- 4) 11 部門 API ---
Write-Host "`n[4/5] 11 部門 API" -ForegroundColor Green
$apis = @(
    'executive-api', 'crm-api', 'solution-api',
    'construction-site-api', 'tech-api', 'safety-quality-api',
    'corp-api', 'proc-api', 'marine-api', 'itsm-api', 'data-api'
)
Invoke-ComposeUp -Services $apis

# --- 5) 11 部門 Web ---
Write-Host "`n[5/5] 11 部門 Web" -ForegroundColor Green
$webs = @(
    'executive-web', 'crm-web', 'solution-web',
    'construction-site-web', 'tech-web', 'safety-quality-web',
    'corp-web', 'proc-web', 'marine-web', 'itsm-web', 'data-web'
)
Invoke-ComposeUp -Services $webs

Write-Host "`n--- 待機 $WaitSec 秒 (healthcheck 安定化) ---" -ForegroundColor DarkGray
Start-Sleep -Seconds $WaitSec

Write-Host "`n=== サービス状態 ===" -ForegroundColor Cyan
docker compose ps

Write-Host "`n=== Web エンドポイント一覧 ===" -ForegroundColor Cyan
@(
    @{Name='04 site';    Url='http://localhost:3000'},
    @{Name='06 safety';  Url='http://localhost:3001'},
    @{Name='10 itsm';    Url='http://localhost:3002'},
    @{Name='02 crm';     Url='http://localhost:3003'},
    @{Name='03 solution';Url='http://localhost:3004'},
    @{Name='05 tech';    Url='http://localhost:3005'},
    @{Name='07 corp';    Url='http://localhost:3007'},
    @{Name='08 proc';    Url='http://localhost:3008'},
    @{Name='09 marine';  Url='http://localhost:3009'},
    @{Name='11 data';    Url='http://localhost:3011'},
    @{Name='01 exec';    Url='http://localhost:3013'},
    @{Name='gateway';    Url='http://localhost:8080/health'},
    @{Name='mocks';      Url='http://localhost:8090/health'}
) | ForEach-Object {
    "{0,-12} {1}" -f $_.Name, $_.Url
}
