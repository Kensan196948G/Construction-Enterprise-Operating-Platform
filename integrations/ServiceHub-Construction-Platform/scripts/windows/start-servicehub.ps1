#Requires -RunAsAdministrator
<#
.SYNOPSIS
    ServiceHub Construction Platform — Windows 自動起動スクリプト
.DESCRIPTION
    PC ログオン時にタスクスケジューラーから呼び出される。
    1. Docker Desktop 起動を待機
    2. Windows の DHCP 割り当て IP を自動検出
    3. .env の API URL / CORS 設定を IP に合わせて書き換え
    4. IP が前回と変わった場合のみ frontend を再ビルド
    5. 全サービスを起動（ポート番号は変更しない）
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── 設定 ────────────────────────────────────────────────────
$ProjectRoot   = "C:\ServiceHub\ServiceHub-Construction-Platform"
$LogFile       = "C:\ServiceHub\logs\servicehub-startup.log"
$IpCacheFile   = "C:\ServiceHub\logs\last-ip.txt"
$DockerTimeout = 180   # Docker Desktop 起動待機 最大秒数
$FrontendPort  = 3001
$ApiPort       = 8080
$NginxPort     = 8088
# ─────────────────────────────────────────────────────────────

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp][$Level] $Message"
    Write-Host $line
    if (-not (Test-Path (Split-Path $LogFile))) {
        New-Item -ItemType Directory -Path (Split-Path $LogFile) -Force | Out-Null
    }
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Get-WindowsIp {
    <#
    優先順位:
      1. 有線LAN（Ethernet）の DHCP アドレス
      2. 無線LAN（Wi-Fi）の DHCP アドレス
      3. 上記なければ最初の非ループバック IPv4
    #>
    $candidates = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -ne "127.0.0.1" -and
            $_.IPAddress -notlike "169.254.*"   # APIPA 除外
        }

    # 有線優先
    $wired = $candidates | Where-Object { (Get-NetAdapter -InterfaceIndex $_.InterfaceIndex -ErrorAction SilentlyContinue).PhysicalMediaType -eq "802.3" }
    if ($wired) { return ($wired | Select-Object -First 1).IPAddress }

    # 無線
    $wifi = $candidates | Where-Object { (Get-NetAdapter -InterfaceIndex $_.InterfaceIndex -ErrorAction SilentlyContinue).PhysicalMediaType -eq "Native 802.11" }
    if ($wifi) { return ($wifi | Select-Object -First 1).IPAddress }

    # その他（VPN など）
    $any = $candidates | Select-Object -First 1
    if ($any) { return $any.IPAddress }

    throw "有効な IPv4 アドレスが見つかりません。ネットワーク接続を確認してください。"
}

function Wait-DockerReady {
    Write-Log "Docker Desktop 起動を待機中..."
    $waited = 0
    while ($waited -lt $DockerTimeout) {
        $info = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Docker Desktop 起動確認（待機 ${waited}秒）"
            return
        }
        Start-Sleep -Seconds 5
        $waited += 5
    }
    throw "タイムアウト: Docker Desktop が ${DockerTimeout}秒 以内に起動しませんでした。"
}

function Update-EnvFile {
    param([string]$Ip)

    $envPath = Join-Path $ProjectRoot ".env"
    if (-not (Test-Path $envPath)) {
        $examplePath = Join-Path $ProjectRoot ".env.example"
        if (Test-Path $examplePath) {
            Copy-Item $examplePath $envPath
            Write-Log ".env が存在しなかったため .env.example からコピーしました"
        } else {
            throw ".env も .env.example も見つかりません: $ProjectRoot"
        }
    }

    $content = Get-Content $envPath -Raw -Encoding UTF8

    # VITE_API_BASE_URL
    $newApiUrl = "http://${Ip}:${ApiPort}"
    $content = $content -replace "(?m)^VITE_API_BASE_URL=.*", "VITE_API_BASE_URL=${newApiUrl}"

    # ALLOWED_ORIGINS（JSON 配列形式）
    $origins = @(
        "http://${Ip}:${FrontendPort}",
        "http://${Ip}:${NginxPort}",
        "http://localhost:${FrontendPort}",
        "http://localhost:${NginxPort}"
    )
    $originsJson = '["' + ($origins -join '","') + '"]'
    $content = $content -replace '(?m)^ALLOWED_ORIGINS=.*', "ALLOWED_ORIGINS=${originsJson}"

    # TZ を Asia/Tokyo に固定
    if ($content -notmatch "(?m)^TZ=") {
        $content += "`nTZ=Asia/Tokyo"
    } else {
        $content = $content -replace "(?m)^TZ=.*", "TZ=Asia/Tokyo"
    }

    # LF 統一（Docker コンテナとの互換性）
    $content = $content -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($envPath, $content, [System.Text.Encoding]::UTF8)

    Write-Log ".env 更新: VITE_API_BASE_URL=${newApiUrl}"
    Write-Log ".env 更新: ALLOWED_ORIGINS=${originsJson}"
}

function Get-LastIp {
    if (Test-Path $IpCacheFile) {
        return (Get-Content $IpCacheFile -Raw -Encoding UTF8).Trim()
    }
    return ""
}

function Save-CurrentIp {
    param([string]$Ip)
    [System.IO.File]::WriteAllText($IpCacheFile, $Ip, [System.Text.Encoding]::UTF8)
}

# ─── メイン処理 ───────────────────────────────────────────────
Write-Log "========================================"
Write-Log "ServiceHub 起動スクリプト 開始"
Write-Log "========================================"

try {
    # 1. Docker Desktop 待機
    Wait-DockerReady

    # 2. IP 検出
    $currentIp = Get-WindowsIp
    $lastIp    = Get-LastIp
    Write-Log "現在の IP: ${currentIp} / 前回の IP: ${lastIp}"

    $ipChanged = ($currentIp -ne $lastIp)

    # 3. .env 更新
    Update-EnvFile -Ip $currentIp

    # 4. 作業ディレクトリへ移動
    Set-Location $ProjectRoot

    if ($ipChanged) {
        Write-Log "IP アドレスが変更されました。Frontend を再ビルドします（約2分）..."
        docker compose `
            -f docker-compose.yml `
            -f docker-compose.override.yml `
            -f docker-compose.windows.yml `
            build --no-cache frontend
        if ($LASTEXITCODE -ne 0) { throw "Frontend ビルド失敗" }
        Write-Log "Frontend ビルド完了"
        Save-CurrentIp -Ip $currentIp
    } else {
        Write-Log "IP 変更なし。ビルドをスキップします。"
    }

    # 5. 全サービス起動
    Write-Log "全サービス起動中..."
    docker compose `
        -f docker-compose.yml `
        -f docker-compose.override.yml `
        -f docker-compose.windows.yml `
        up -d

    if ($LASTEXITCODE -ne 0) { throw "docker compose up 失敗" }

    # 6. 起動確認
    Start-Sleep -Seconds 10
    $status = docker compose ps --format "table {{.Name}}\t{{.Status}}"
    Write-Log "サービス状態:`n$status"

    # 7. 完了通知
    Write-Log "========================================"
    Write-Log "ServiceHub 起動完了！"
    Write-Log "  Frontend : http://${currentIp}:${FrontendPort}"
    Write-Log "  API      : http://${currentIp}:${ApiPort}/api"
    Write-Log "  Nginx    : http://${currentIp}:${NginxPort}"
    Write-Log "  MinIO    : http://${currentIp}:9011"
    Write-Log "========================================"

    # Windows トースト通知
    Add-Type -AssemblyName System.Windows.Forms
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $notify.BalloonTipTitle = "ServiceHub 起動完了"
    $notify.BalloonTipText  = "http://${currentIp}:${FrontendPort}"
    $notify.Visible = $true
    $notify.ShowBalloonTip(5000)
    Start-Sleep -Seconds 2
    $notify.Dispose()

} catch {
    Write-Log "エラー: $_" "ERROR"
    # エラートースト通知
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $notify = New-Object System.Windows.Forms.NotifyIcon
        $notify.Icon = [System.Drawing.SystemIcons]::Error
        $notify.BalloonTipTitle = "ServiceHub 起動エラー"
        $notify.BalloonTipText  = $_.ToString()
        $notify.Visible = $true
        $notify.ShowBalloonTip(8000)
        Start-Sleep -Seconds 2
        $notify.Dispose()
    } catch {}
    exit 1
}
