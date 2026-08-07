# =========================================================
# Construction DX One Platform — WebUI 一括起動 (PowerShell)
#
# 全 11 部門の Vite dev server を別ウィンドウで並列起動する。
# 認証 bypass: 現状の dev server は認証ゲート前の画面まで表示可能。
#              API 呼び出し後の認証は別途設定 (Loop #14+ 対応予定)。
#
# 起動: D:\Construction-DX-OnePlatform>  .\scripts\webui-up-all.ps1
# 停止: 各ウィンドウを閉じるか、 .\scripts\webui-down-all.ps1
# =========================================================

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

# LAN IPv4 自動検出
$LanIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" -and $_.PrefixOrigin -eq "Dhcp" } |
    Select-Object -First 1).IPAddress
if (-not $LanIp) { $LanIp = "localhost" }

Write-Host ""
Write-Host "🌐 LAN IP detected: $LanIp" -ForegroundColor Cyan
Write-Host ""

$Apps = @(
    @{ Name = "01 経営企画 (exec)";        Cmd = "dev:exec";   Port = 5180 },
    @{ Name = "02 営業 (crm)";             Cmd = "dev:crm";    Port = 5181 },
    @{ Name = "03 ソリューション (sol)";    Cmd = "dev:sol";    Port = 5182 },
    @{ Name = "04 施工 (site)";            Cmd = "dev:site";   Port = 5183 },
    @{ Name = "05 技術 (tech)";            Cmd = "dev:tech";   Port = 5184 },
    @{ Name = "06 安全品質 (sq)";          Cmd = "dev:sq";     Port = 5185 },
    @{ Name = "07 管理 (corp)";            Cmd = "dev:corp";   Port = 5186 },
    @{ Name = "08 購買 (proc)";            Cmd = "dev:proc";   Port = 5187 },
    @{ Name = "09 船舶 (marine)";          Cmd = "dev:marine"; Port = 5188 },
    @{ Name = "10 IT-DX (itsm)";           Cmd = "dev:itsm";   Port = 5189 },
    @{ Name = "11 統合データ (data)";       Cmd = "dev:data";   Port = 5190 }
)

# node_modules 未インストールなら先に install
if (-not (Test-Path "$Root\node_modules\react")) {
    Write-Host "📦 node_modules 未インストール → npm install を実行します..." -ForegroundColor Yellow
    Push-Location $Root
    npm install --workspaces --include-workspace-root --legacy-peer-deps --no-audit --no-fund
    Pop-Location
}

# shared-ui を事前 build (frontend が依存)
Write-Host "🧱 shared-ui を事前 build..." -ForegroundColor Yellow
Push-Location $Root
npm run build:shared-ui --if-present | Out-Null
Pop-Location

# 各部門を別ウィンドウで起動
foreach ($app in $Apps) {
    $title = "CDX | $($app.Name) | http://$($LanIp):$($app.Port)"
    Write-Host "🚀 $title" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$Root'; `$Host.UI.RawUI.WindowTitle = '$title'; npm run $($app.Cmd)" -WindowStyle Normal
    Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "✅ 11 部門の dev server を起動しました。" -ForegroundColor Green
Write-Host ""
Write-Host "📋 WebUI URL 一覧:" -ForegroundColor Cyan
foreach ($app in $Apps) {
    "  {0,-30} → http://{1}:{2}/" -f $app.Name, $LanIp, $app.Port | Write-Host
}
Write-Host ""
Write-Host "🛑 停止: 各ウィンドウを Ctrl+C → 閉じる、または .\scripts\webui-down-all.ps1"
