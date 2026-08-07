# =============================================================
# check-imports.ps1
#   各 Python サブプロジェクトを editable install して、
#   shared-auth / shared-db / shared サブモジュールの import 疎通を確認する。
# =============================================================
[CmdletBinding()]
param(
    [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path "$PSScriptRoot/.."
Push-Location $root
try {
    $sharedAuth = "00_共通基盤/shared-auth"
    $sharedDb   = "00_共通基盤/shared-db"
    $projects = @(
        "00_共通基盤/api-gateway",
        "04_施工本部/ConstructionSiteManagementSystem/backend",
        "06_安全品質環境本部/SafetyQualityGovernancePlatform/backend",
        "10_IT-DX部門/ConstructionITSM-ZeroTrustPlatform/backend"
    )

    if (-not $SkipInstall) {
        Write-Host "[1/3] Installing shared modules (editable)..." -ForegroundColor Cyan
        python -m pip install -e $sharedAuth
        python -m pip install -e $sharedDb
    }

    Write-Host "[2/3] Smoke test: shared imports" -ForegroundColor Cyan
    python -c "import cdx_auth; import cdx_db; print('cdx_auth', cdx_auth.__version__, '/ cdx_db', cdx_db.__version__)"

    Write-Host "[3/3] Per-project editable install + import check" -ForegroundColor Cyan
    $summary = @()
    foreach ($p in $projects) {
        Write-Host "---- $p ----" -ForegroundColor Yellow
        if (-not $SkipInstall) {
            python -m pip install -e $p 2>&1 | Tee-Object -Variable installLog | Out-Null
            $ok = $LASTEXITCODE -eq 0
        } else { $ok = $true }

        $pkg = switch -Wildcard ($p) {
            "*api-gateway*"             { "cdx_gateway" }
            "*ConstructionSiteManagement*" { "site_api" }
            "*SafetyQualityGovernance*" { "sq_api" }
            "*ConstructionITSM*"        { "itsm_api" }
        }
        python -c "import $pkg; print('OK', '$pkg')" 2>&1
        $summary += [pscustomobject]@{ Project = $p; Package = $pkg; Install = $ok; Import = ($LASTEXITCODE -eq 0) }
    }

    Write-Host ""
    Write-Host "===== Summary =====" -ForegroundColor Green
    $summary | Format-Table -AutoSize
} finally {
    Pop-Location
}
