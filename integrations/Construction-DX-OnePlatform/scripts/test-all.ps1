# =============================================================
# test-all.ps1
#   全 Python サブプロジェクトの pytest を順次実行する。
#   失敗しても継続し、最後にサマリを表示する。
# =============================================================
[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'
$root = Resolve-Path "$PSScriptRoot/.."

$projects = @(
    "00_共通基盤/shared-auth",
    "00_共通基盤/shared-db",
    "00_共通基盤/api-gateway",
    "04_施工本部/ConstructionSiteManagementSystem/backend",
    "06_安全品質環境本部/SafetyQualityGovernancePlatform/backend",
    "10_IT-DX部門/ConstructionITSM-ZeroTrustPlatform/backend"
)

$results = @()
foreach ($p in $projects) {
    $dir = Join-Path $root $p
    Write-Host ""
    Write-Host "===== pytest: $p =====" -ForegroundColor Cyan
    if (-not (Test-Path (Join-Path $dir "tests"))) {
        Write-Host "  (skip: no tests/ dir)" -ForegroundColor DarkGray
        $results += [pscustomobject]@{ Project = $p; Status = "SKIP"; ExitCode = $null }
        continue
    }
    Push-Location $dir
    try {
        python -m pytest -q --maxfail=20
        $code = $LASTEXITCODE
        $status = if ($code -eq 0) { "PASS" } else { "FAIL" }
    } catch {
        $code = -1
        $status = "ERROR"
    } finally {
        Pop-Location
    }
    $results += [pscustomobject]@{ Project = $p; Status = $status; ExitCode = $code }
}

# Frontend
$frontends = @(
    "00_共通基盤/shared-ui",
    "04_施工本部/ConstructionSiteManagementSystem/frontend",
    "06_安全品質環境本部/SafetyQualityGovernancePlatform/frontend",
    "10_IT-DX部門/ConstructionITSM-ZeroTrustPlatform/frontend"
)
foreach ($p in $frontends) {
    $dir = Join-Path $root $p
    Write-Host ""
    Write-Host "===== npm test: $p =====" -ForegroundColor Cyan
    if (-not (Test-Path (Join-Path $dir "package.json"))) {
        $results += [pscustomobject]@{ Project = $p; Status = "SKIP"; ExitCode = $null }
        continue
    }
    Push-Location $dir
    try {
        npm test --if-present
        $code = $LASTEXITCODE
        $status = if ($code -eq 0) { "PASS" } else { "FAIL" }
    } catch {
        $code = -1
        $status = "ERROR"
    } finally {
        Pop-Location
    }
    $results += [pscustomobject]@{ Project = $p; Status = $status; ExitCode = $code }
}

Write-Host ""
Write-Host "===== Test Summary =====" -ForegroundColor Green
$results | Format-Table -AutoSize

$failed = ($results | Where-Object { $_.Status -eq "FAIL" -or $_.Status -eq "ERROR" }).Count
exit $failed
