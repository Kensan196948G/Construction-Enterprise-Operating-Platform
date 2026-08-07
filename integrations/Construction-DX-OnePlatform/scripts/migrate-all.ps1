# Construction DX One Platform — 統合マイグレーション orchestrator
#
# alembic_global/migrate_log/*.yaml の order 順に各サブプロジェクトの
# `alembic upgrade head` を呼び出す。
#
# 使い方:
#   ./scripts/migrate-all.ps1
#   ./scripts/migrate-all.ps1 -Dry
#   ./scripts/migrate-all.ps1 -Only site
#   ./scripts/migrate-all.ps1 -Revision base   # downgrade chain にも使える

[CmdletBinding()]
param(
    [switch]$Dry,
    [string]$Only,
    [string]$Revision = "head"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $repoRoot "alembic_global/migrate_log"

if (-not (Test-Path $logDir)) {
    Write-Error "migrate_log not found: $logDir"
    exit 1
}

# サブプロジェクト順序を migrate_log/*.yaml から取得 (簡易 YAML パース)
$plans = @()
foreach ($file in Get-ChildItem $logDir -Filter *.yaml) {
    $content = Get-Content $file.FullName -Raw
    $subsystem = if ($content -match '(?m)^subsystem:\s*(\S+)')  { $Matches[1] } else { $null }
    $order     = if ($content -match '(?m)^order:\s*(\d+)')      { [int]$Matches[1] } else { 999 }
    $dir       = if ($content -match '(?m)^alembic_dir:\s*(.+)') { $Matches[1].Trim() } else { $null }
    if ($subsystem -and $dir) {
        $plans += [PSCustomObject]@{
            Subsystem = $subsystem
            Order     = $order
            Dir       = $dir
            FullPath  = Join-Path $repoRoot $dir
        }
    }
}

$plans = $plans | Sort-Object Order

if ($Only) {
    $plans = $plans | Where-Object { $_.Subsystem -eq $Only }
    if (-not $plans) {
        Write-Error "No plan matched -Only $Only"
        exit 1
    }
}

Write-Host "== Construction DX migrate-all =="
Write-Host "Revision target: $Revision"
Write-Host "Plans:"
$plans | Format-Table Order, Subsystem, Dir | Out-String | Write-Host

if ($Dry) {
    Write-Host "(dry-run; nothing executed)"
    exit 0
}

foreach ($p in $plans) {
    Write-Host ""
    Write-Host "---- [$($p.Subsystem)] alembic upgrade $Revision @ $($p.Dir) ----"
    if (-not (Test-Path $p.FullPath)) {
        Write-Warning "Skip: directory not found: $($p.FullPath)"
        continue
    }
    Push-Location $p.FullPath
    try {
        & alembic upgrade $Revision
        if ($LASTEXITCODE -ne 0) {
            throw "alembic failed for $($p.Subsystem) (exit $LASTEXITCODE)"
        }
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "All migrations applied (target=$Revision)."
