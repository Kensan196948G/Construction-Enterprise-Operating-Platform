# =============================================================================
# scripts/check-mocks-contract.ps1
#
# mocks サーバ <-> 各部門 API ルートの契約整合チェック (Loop #7)
#
# `mocks/contract_check.py` を Python で実行し、各部門 API ルートに対する
# mocks サーバ KPI のカバレッジを表示する。
#
# Python が無くても CI / ローカル両方で動かせるよう、`py -3` -> `python3` ->
# `python` の順でフォールバックする。
# =============================================================================

[CmdletBinding()]
param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

$candidates = @("py -3", "python3", "python")
$pyExe = $null
foreach ($c in $candidates) {
    $parts = $c -split " "
    $cmd = $parts[0]
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        $pyExe = $c
        break
    }
}
if (-not $pyExe) {
    Write-Error "Python interpreter not found. Install Python 3.10+ first."
    exit 2
}

$script = Join-Path $RepoRoot "mocks\contract_check.py"
if (-not (Test-Path -LiteralPath $script)) {
    Write-Error "Contract script not found: $script"
    exit 2
}

Write-Host "Running: $pyExe $script"
Write-Host ""
$cmdParts = $pyExe -split " "
& $cmdParts[0] $cmdParts[1..($cmdParts.Length - 1)] $script
exit $LASTEXITCODE
