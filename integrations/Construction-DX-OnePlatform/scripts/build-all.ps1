#requires -Version 5.1
<#
.SYNOPSIS
  Construction DX One Platform — 全 11 部門 + 共通基盤 + mocks の Docker イメージ build
.DESCRIPTION
  本スクリプトは "build が通るか" の検証を主目的とする。
  docker buildx の `--check`/`--dry-run` 相当が無いので、`docker compose build`
  を 1 サービスずつ順次起動し、失敗してもサマリを最後に表示する。

  - `-Backend`  : backend サービスのみ build
  - `-Frontend` : frontend (Web) サービスのみ build
  - `-Mocks`    : mocks サービスのみ build
  - 何も指定しない場合は **全サービス** を build
.NOTES
  Docker Desktop が起動している必要がある。Mac / Windows / WSL 共通の構文
  を意識し、`docker compose` (空白形式) を採用。
#>

[CmdletBinding()]
param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$Mocks
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== Construction DX — build-all ===" -ForegroundColor Cyan
Write-Host "Root: $root"

try { docker version --format '{{.Server.Version}}' | Out-Null }
catch { throw "Docker Desktop が起動していません。" }

$backendServices = @(
    'api-gateway',
    'executive-api', 'crm-api', 'solution-api',
    'construction-site-api', 'tech-api', 'safety-quality-api',
    'corp-api', 'proc-api', 'marine-api', 'itsm-api', 'data-api'
)
$frontendServices = @(
    'executive-web', 'crm-web', 'solution-web',
    'construction-site-web', 'tech-web', 'safety-quality-web',
    'corp-web', 'proc-web', 'marine-web', 'itsm-web', 'data-web'
)
$mockServices = @('mocks')

# 引数が全て無指定 → 全部
if (-not ($Backend.IsPresent -or $Frontend.IsPresent -or $Mocks.IsPresent)) {
    $Backend = [switch]::Present
    $Frontend = [switch]::Present
    $Mocks = [switch]::Present
}

$targets = @()
if ($Backend)  { $targets += $backendServices }
if ($Frontend) { $targets += $frontendServices }
if ($Mocks)    { $targets += $mockServices }

$results = @()
foreach ($svc in $targets) {
    Write-Host "`n--- build: $svc ---" -ForegroundColor Yellow
    # mocks profile は --profile 指定が必要
    $args = @('compose')
    if ($svc -in $mockServices) { $args += @('--profile', 'mocks') }
    $args += @('build', $svc)

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    & docker @args
    $code = $LASTEXITCODE
    $sw.Stop()
    $results += [pscustomobject]@{
        Service = $svc
        Result  = if ($code -eq 0) { 'OK' } else { 'FAIL' }
        ExitCode = $code
        ElapsedSec = [math]::Round($sw.Elapsed.TotalSeconds, 1)
    }
}

Write-Host "`n=== build-all summary ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$failed = $results | Where-Object { $_.Result -ne 'OK' }
if ($failed.Count -gt 0) {
    Write-Host "`n失敗 $($failed.Count) 件。詳細は上のログを確認。" -ForegroundColor Red
    exit 1
}
Write-Host "`n全 $($results.Count) 件 OK。" -ForegroundColor Green
