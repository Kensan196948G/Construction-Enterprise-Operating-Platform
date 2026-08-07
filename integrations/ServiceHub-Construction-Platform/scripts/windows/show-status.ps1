<#
.SYNOPSIS
    ServiceHub の現在状態と接続 URL を表示する。
.DESCRIPTION
    任意のタイミングで実行して現在の IP と各サービス URL を確認できる。
#>

$IpCacheFile = "C:\ServiceHub\logs\last-ip.txt"

# IP 取得
$ip = ""
try {
    $candidates = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.IPAddress -notlike "169.254.*" }
    $ip = ($candidates | Select-Object -First 1).IPAddress
} catch {
    $ip = "取得失敗"
}

$lastIp = if (Test-Path $IpCacheFile) { (Get-Content $IpCacheFile -Raw).Trim() } else { "なし" }

Write-Host ""
Write-Host "=== ServiceHub 接続情報 ===" -ForegroundColor Cyan
Write-Host "  現在の IP アドレス : $ip" -ForegroundColor White
Write-Host "  前回ビルド時の IP  : $lastIp" -ForegroundColor Gray
if ($ip -ne $lastIp) {
    Write-Host "  ⚠ IP が変更されています。再起動時に Frontend が自動再ビルドされます。" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "--- アクセス URL ---" -ForegroundColor Cyan
Write-Host "  Frontend  : http://${ip}:3001" -ForegroundColor Green
Write-Host "  API       : http://${ip}:8080/api/v1/docs" -ForegroundColor Green
Write-Host "  Nginx     : http://${ip}:8088" -ForegroundColor Green
Write-Host "  MinIO     : http://${ip}:9011" -ForegroundColor Green
Write-Host "  DB        : ${ip}:5435  (user: servicehub)" -ForegroundColor DarkGray
Write-Host "  Redis     : ${ip}:6380" -ForegroundColor DarkGray
Write-Host ""
Write-Host "--- サービス状態 ---" -ForegroundColor Cyan

$projectRoot = "C:\ServiceHub\ServiceHub-Construction-Platform"
if (Test-Path $projectRoot) {
    Set-Location $projectRoot
    docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>&1
} else {
    Write-Host "  プロジェクトが見つかりません: $projectRoot" -ForegroundColor Red
}
