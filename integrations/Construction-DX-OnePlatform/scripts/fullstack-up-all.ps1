# =========================================================
# Construction DX One Platform — Fullstack 一括自動起動 (PowerShell)
#
# 起動するサービス (合計 23):
#   - Frontend (Vite dev server) × 11 部門 (port 5180-5190, LAN host)
#   - Backend (uvicorn FastAPI)  × 11 部門 (port 8001-8011)
#   - Mocks サーバー (FastAPI)    × 1     (port 8090)
#
# 用途:
#   - 手動起動: PS> .\scripts\fullstack-up-all.ps1
#   - 自動起動: タスクスケジューラ At LogOn から本スクリプトを呼ぶ
#               (PS> .\scripts\autostart-install.ps1 で登録)
#
# 認証: dev モードで bypass (VITE_AUTH_DISABLED=1, CDX_AUTH_DISABLED=1)
# 環境: Windows 11 + Node 20+ + Python 3.12+
# =========================================================

param(
    [switch]$Hidden = $false,    # ウィンドウ非表示モード (タスクスケジューラ用)
    [switch]$SkipInstall = $false # npm install / pip install をスキップ
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $Root "logs"
New-Item -ItemType Directory -Force -Path $LogDir -ErrorAction SilentlyContinue | Out-Null

# ---- LAN IPv4 自動検出 ----
$LanIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" -and $_.PrefixOrigin -eq "Dhcp" } |
    Select-Object -First 1).IPAddress
if (-not $LanIp) { $LanIp = "localhost" }

# ---- 認証 bypass 環境変数 ----
$env:VITE_AUTH_DISABLED = "1"
$env:CDX_AUTH_DISABLED = "1"
$env:CDX_DEV_MODE = "1"

# ---- 起動定義 ----
$Frontends = @(
    @{ Name = "exec";   Pkg = "cdx-exec-frontend";   Port = 5180 },
    @{ Name = "crm";    Pkg = "cdx-crm-frontend";    Port = 5181 },
    @{ Name = "sol";    Pkg = "cdx-sol-frontend";    Port = 5182 },
    @{ Name = "site";   Pkg = "cdx-site-frontend";   Port = 5183 },
    @{ Name = "tech";   Pkg = "cdx-tech-frontend";   Port = 5184 },
    @{ Name = "sq";     Pkg = "@cdx/sq-frontend";    Port = 5185 },
    @{ Name = "corp";   Pkg = "@cdx/corp-frontend";  Port = 5186 },
    @{ Name = "proc";   Pkg = "cdx-proc-frontend";   Port = 5187 },
    @{ Name = "marine"; Pkg = "cdx-marine-frontend"; Port = 5188 },
    @{ Name = "itsm";   Pkg = "cdx-itsm-frontend";   Port = 5189 },
    @{ Name = "data";   Pkg = "cdx-data-frontend";   Port = 5190 }
)

$Backends = @(
    @{ Name = "exec";   Dir = "01_経営企画部\ConstructionExecutiveDashboard\backend";        Module = "exec_api.main:app";   Port = 8001 },
    @{ Name = "crm";    Dir = "02_営業本部\ConstructionCRM-BidManagement\backend";           Module = "crm_api.main:app";    Port = 8002 },
    @{ Name = "sol";    Dir = "03_ソリューション営業本部\SmartInfrastructureSolutionPlatform\backend"; Module = "sol_api.main:app";    Port = 8003 },
    @{ Name = "site";   Dir = "04_施工本部\ConstructionSiteManagementSystem\backend";         Module = "site_api.main:app";   Port = 8004 },
    @{ Name = "tech";   Dir = "05_技術本部\TechnicalKnowledge-BIMPlatform\backend";          Module = "tech_api.main:app";   Port = 8005 },
    @{ Name = "sq";     Dir = "06_安全品質環境本部\SafetyQualityGovernancePlatform\backend";  Module = "sq_api.main:app";     Port = 8006 },
    @{ Name = "corp";   Dir = "07_管理本部\CorporateOperationPlatform\backend";              Module = "corp_api.main:app";   Port = 8007 },
    @{ Name = "proc";   Dir = "08_購買部\ProcurementMaterialPlatform\backend";               Module = "proc_api.main:app";   Port = 8008 },
    @{ Name = "marine"; Dir = "09_船舶事業部\MarineFleetManagement\backend";                  Module = "marine_api.main:app"; Port = 8009 },
    @{ Name = "itsm";   Dir = "10_IT-DX部門\ConstructionITSM-ZeroTrustPlatform\backend";     Module = "itsm_api.main:app";   Port = 8010 },
    @{ Name = "data";   Dir = "11_統合データ基盤\ConstructionDataLake-DigitalTwin\backend";   Module = "data_api.main:app";   Port = 8011 }
)

# ---- 出力 ----
function Write-Section($msg) {
    if (-not $Hidden) {
        Write-Host ""
        Write-Host "═══ $msg ═══" -ForegroundColor Cyan
    }
}

Write-Section "Construction DX One Platform — Fullstack 起動"
if (-not $Hidden) {
    Write-Host "🌐 LAN IP : $LanIp"
    Write-Host "📁 Root   : $Root"
    Write-Host "📜 Logs   : $LogDir"
}

# ---- 既存プロセスを停止 (重複起動防止) ----
Write-Section "既存プロセス停止"
$AllPorts = $Frontends.Port + $Backends.Port + @(8090)
foreach ($p in $AllPorts) {
    $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        try {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction Stop
        } catch {
            Write-Warning "port=$p pid=$($c.OwningProcess) の停止に失敗: $($_.Exception.Message)"
        }
    }
}

# ---- 初期セットアップ (npm install + pip install) ----
if (-not $SkipInstall) {
    Write-Section "依存セットアップ (初回のみ時間がかかる)"
    Push-Location $Root
    if (-not (Test-Path "$Root\node_modules\vite\bin\vite.js")) {
        if (-not $Hidden) { Write-Host "📦 npm install --workspaces..." -ForegroundColor Yellow }
        npm install --workspaces --include-workspace-root --legacy-peer-deps --no-audit --no-fund 2>&1 | Tee-Object -FilePath "$LogDir\npm-install.log" | Out-Null
    }
    if (-not $Hidden) { Write-Host "🧱 build:shared-ui..." -ForegroundColor Yellow }
    npm run build:shared-ui --if-present 2>&1 | Out-Null
    Pop-Location

    # Python 仮想環境がなければ作成
    $VenvPath = Join-Path $Root ".venv"
    if (-not (Test-Path "$VenvPath\Scripts\Activate.ps1")) {
        if (-not $Hidden) { Write-Host "🐍 python -m venv .venv..." -ForegroundColor Yellow }
        python -m venv $VenvPath 2>&1 | Out-Null
        & "$VenvPath\Scripts\pip.exe" install --upgrade pip 2>&1 | Out-Null
        # 共通モジュールを editable install
        & "$VenvPath\Scripts\pip.exe" install -e "$Root\00_共通基盤\shared-auth" -e "$Root\00_共通基盤\shared-db" -e "$Root\00_共通基盤\shared-pdf" -e "$Root\00_共通基盤\api-gateway" 2>&1 | Tee-Object -FilePath "$LogDir\pip-install.log" | Out-Null
        foreach ($b in $Backends) {
            & "$VenvPath\Scripts\pip.exe" install -e (Join-Path $Root $b.Dir) 2>&1 | Out-Null
        }
        & "$VenvPath\Scripts\pip.exe" install -e "$Root\mocks" 2>&1 | Out-Null
    }
}

$VenvPython = Join-Path $Root ".venv\Scripts\python.exe"
$WindowStyle = if ($Hidden) { "Hidden" } else { "Minimized" }

# ---- Backend 用 dev ダミー環境変数 (Loop #15) ----
# shared-auth Settings の必須フィールドを満たす placeholder。
# 本番 docker compose では .env / Vault から実値が注入される。
$BackendEnvCommon = @"
`$env:CDX_DEV_MODE='1'
`$env:CDX_AUTH_DISABLED='1'
`$env:ENTRA_TENANT_ID='dev-tenant'
`$env:ENTRA_CLIENT_ID='dev-client'
`$env:ENTRA_CLIENT_SECRET='dev-secret-placeholder'
`$env:JWT_AUDIENCE='api://cdx-dev'
`$env:JWT_ISSUER='https://login.microsoftonline.com/dev-tenant/v2.0'
`$env:HENNGE_CLIENT_ID='dev-hennge-client'
`$env:HENNGE_CLIENT_SECRET='dev-hennge-secret'
`$env:HENNGE_JWKS_URI='https://example.com/.well-known/jwks.json'
`$env:POSTGRES_HOST='localhost'
`$env:POSTGRES_PORT='5432'
`$env:POSTGRES_DB='construction_dx'
`$env:POSTGRES_USER='cdx_user'
`$env:POSTGRES_PASSWORD='dev_password'
`$env:REDIS_HOST='localhost'
`$env:REDIS_PORT='6379'
"@

# ---- Backend 起動 (uvicorn) ----
Write-Section "Backend (11部門 + mocks) を起動"
foreach ($b in $Backends) {
    $logFile = Join-Path $LogDir "backend-$($b.Name).log"
    $backendDir = Join-Path $Root $b.Dir
    $srcDir = Join-Path $backendDir "src"
    # PYTHONPATH を src ディレクトリに設定 (hatchling editable install の差異吸収)
    $cmd = @"
Set-Location '$backendDir'
$BackendEnvCommon
`$env:PYTHONPATH='$srcDir'
& '$VenvPython' -m uvicorn $($b.Module) --host 0.0.0.0 --port $($b.Port) *>&1 | Tee-Object -FilePath '$logFile'
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd -WindowStyle $WindowStyle
    if (-not $Hidden) { Write-Host "  🐍 backend-$($b.Name) → http://${LanIp}:$($b.Port)" -ForegroundColor Green }
    Start-Sleep -Milliseconds 200
}

# mocks
$mocksLog = Join-Path $LogDir "mocks.log"
$mocksCmd = "Set-Location '$Root\mocks'; & '$VenvPython' -m uvicorn main:app --host 0.0.0.0 --port 8090 *>&1 | Tee-Object -FilePath '$mocksLog'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $mocksCmd -WindowStyle $WindowStyle
if (-not $Hidden) { Write-Host "  🎭 mocks → http://${LanIp}:8090" -ForegroundColor Green }

# 統合ポータル (Loop #17): 11 部門カード一覧のランディングページ
$portalLog = Join-Path $LogDir "portal.log"
$portalCmd = "Set-Location '$Root\00_共通基盤\portal'; & '$VenvPython' -m http.server 5179 --bind 0.0.0.0 *>&1 | Tee-Object -FilePath '$portalLog'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $portalCmd -WindowStyle $WindowStyle
if (-not $Hidden) { Write-Host "  🌐 portal → http://${LanIp}:5179  ⭐ 統合ハブ" -ForegroundColor Magenta }

# ---- Frontend 起動 (vite dev) ----
Write-Section "Frontend (11部門) を起動"
foreach ($f in $Frontends) {
    $logFile = Join-Path $LogDir "frontend-$($f.Name).log"
    $cmd = "Set-Location '$Root'; `$env:VITE_AUTH_DISABLED='1'; npm run dev:$($f.Name) *>&1 | Tee-Object -FilePath '$logFile'"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd -WindowStyle $WindowStyle
    if (-not $Hidden) { Write-Host "  🎨 frontend-$($f.Name) → http://${LanIp}:$($f.Port)" -ForegroundColor Green }
    Start-Sleep -Milliseconds 200
}

# ---- 完了 ----
Write-Section "起動完了 — 23 サービス起動済み"
if (-not $Hidden) {
    Write-Host ""
    Write-Host "🌐 WebUI URL 一覧 (LAN: $LanIp):" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "| 部門                  | Frontend                       | Backend                        |"
    Write-Host "|-----------------------|--------------------------------|--------------------------------|"
    foreach ($f in $Frontends) {
        $b = $Backends | Where-Object { $_.Name -eq $f.Name }
        "| {0,-21} | http://{1}:{2,-15} | http://{1}:{3,-15} |" -f $f.Name, $LanIp, $f.Port, $b.Port | Write-Host
    }
    Write-Host ""
    Write-Host "🎭 mocks: http://${LanIp}:8090"
    Write-Host ""
    Write-Host "📜 ログ: $LogDir\{frontend,backend,mocks}-*.log"
    Write-Host "🛑 停止: .\scripts\fullstack-down-all.ps1"
    Write-Host ""
}

# autostart 時の自己保護: スクリプト自体は終了させる (子プロセスは独立して動く)
exit 0
