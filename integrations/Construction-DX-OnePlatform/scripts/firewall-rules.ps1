# =========================================================
# Construction DX One Platform — Windows Firewall ルール投入
#
# 同一 LAN 内の別端末からアクセスできるよう、以下ポートの受信を許可:
#   - Frontend  : TCP 5180-5190 (Vite dev server)
#   - Backend   : TCP 8001-8011 (uvicorn)
#   - Mocks     : TCP 8090
#   - API GW    : TCP 8080 (Docker compose 用)
#
# 実行には管理者権限が必要:
#   PS> Start-Process powershell -Verb RunAs -ArgumentList "-File .\scripts\firewall-rules.ps1"
# =========================================================

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "⚠️  管理者権限が必要です。以下のコマンドで再実行してください:"
    Write-Host '  Start-Process powershell -Verb RunAs -ArgumentList "-File .\scripts\firewall-rules.ps1"' -ForegroundColor Yellow
    exit 1
}

$Rules = @(
    @{ Name = "CDX-Frontend-5180-5190"; Port = "5180-5190"; Desc = "CDX Frontend (Vite dev server) for 11 depts" },
    @{ Name = "CDX-Backend-8001-8011";  Port = "8001-8011"; Desc = "CDX Backend (uvicorn FastAPI) for 11 depts" },
    @{ Name = "CDX-Mocks-8090";         Port = "8090";       Desc = "CDX Mocks server" },
    @{ Name = "CDX-API-Gateway-8080";   Port = "8080";       Desc = "CDX API Gateway (Docker)" }
)

foreach ($r in $Rules) {
    # 既存ルール削除 (冪等)
    Remove-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    New-NetFirewallRule `
        -DisplayName $r.Name `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort $r.Port `
        -Action Allow `
        -Profile Private,Domain `
        -Description $r.Desc | Out-Null
    Write-Host "✅ $($r.Name) (TCP $($r.Port))" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Firewall ルール投入完了。同一 LAN 内の別端末からアクセス可能になりました。" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 確認: Get-NetFirewallRule -DisplayName 'CDX-*' | Format-Table DisplayName, Enabled, Direction, Action"
