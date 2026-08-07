# =========================================================
# Construction DX One Platform — 統合ポータル配信 (port 5179)
#
# Python http.server で 00_共通基盤/portal/ を配信。
# fullstack-up-all.ps1 から自動起動される。
# =========================================================

$ErrorActionPreference = "Continue"
$portalDir = Join-Path (Split-Path -Parent $PSScriptRoot) "00_共通基盤\portal"
if (-not (Test-Path $portalDir)) {
    Write-Error "portal dir not found: $portalDir"
    exit 1
}
Set-Location $portalDir
$py = (Split-Path -Parent $PSScriptRoot) + "\.venv\Scripts\python.exe"
if (-not (Test-Path $py)) { $py = "python" }
& $py -m http.server 5179 --bind 0.0.0.0
