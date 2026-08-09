#requires -Version 5.1
<#
.SYNOPSIS
    Civil Construction IMS モック(デモ) WebUI を起動する。

.DESCRIPTION
    - 競合しない空きポートを自動検出し、docker compose に渡す。
    - web-mock コンテナを 0.0.0.0:<port> にバインドして起動 (restart: always)。
    - ホストの自動割当(DHCP)IP を表示し、LAN 内からのアクセス URL を案内する。
    - バックエンド(API/DB/Redis/MinIO)は不要。

.PARAMETER Port
    使用したいホストポート。省略時は 18080 から空きを自動検出する。

.PARAMETER Rebuild
    既存イメージを無視して再ビルドする。

.EXAMPLE
    pwsh -NoProfile -File .\scripts\mock\Start-MockUI.ps1
.EXAMPLE
    pwsh -NoProfile -File .\scripts\mock\Start-MockUI.ps1 -Port 28080 -Rebuild
#>
[CmdletBinding()]
param(
    [int]$Port = 0,
    [switch]$Rebuild
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..')
$Compose  = Join-Path $RepoRoot 'docker-compose.mock.yml'

function Test-PortFree {
    param([int]$P)
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $P)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        return $false
    }
}

function Find-FreePort {
    param([int]$Start = 18080, [int]$End = 18200)
    for ($p = $Start; $p -le $End; $p++) {
        if (Test-PortFree -P $p) { return $p }
    }
    throw "空きポートが $Start-$End の範囲で見つかりませんでした。"
}

function Get-HostIPv4 {
    # 物理 LAN の IPv4 を優先取得する。
    # Docker/WSL/Hyper-V/ループバック系の仮想インターフェースは「IPレンジ」ではなく
    # 「インターフェース名(Alias)」で除外する（社内LANが 172.16-31 系でも誤除外しないため）。
    $virtualAlias = @('*vEthernet*', '*Docker*', '*WSL*', '*Loopback*', '*Hyper-V*')
    $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $ip = $_
            $isVirtual = $false
            foreach ($pat in $virtualAlias) {
                if ($ip.InterfaceAlias -like $pat) { $isVirtual = $true; break }
            }
            ($ip.IPAddress -notlike '127.*') -and
            ($ip.IPAddress -notlike '169.254.*') -and
            ($ip.PrefixOrigin -ne 'WellKnown') -and
            (-not $isVirtual)
        } | Sort-Object -Property SkipAsSource
    if ($candidates) { return ($candidates | Select-Object -First 1).IPAddress }
    return 'localhost'
}

# --- Docker 存在確認 ---
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'docker が見つかりません。Docker Desktop をインストール/起動してください。'
}

# --- ポート決定 ---
if ($Port -le 0) {
    $Port = Find-FreePort
} elseif (-not (Test-PortFree -P $Port)) {
    Write-Warning "指定ポート $Port は使用中です。空きポートを自動検出します。"
    $Port = Find-FreePort -Start ($Port + 1)
}

$env:MOCK_UI_PORT = "$Port"

Write-Host "🎭 Civil Construction IMS モック WebUI を起動します..." -ForegroundColor Cyan
Write-Host "   使用ポート: $Port" -ForegroundColor Gray

# compose の `up -d` はイメージ未作成時に自動ビルドする。
# 既存イメージを再ビルドしたい場合のみ -Rebuild で --build を付与する（通常起動を高速化）。
$composeArgs = @('compose', '-f', $Compose, 'up', '-d')
if ($Rebuild) { $composeArgs += '--build' }

& docker @composeArgs
if ($LASTEXITCODE -ne 0) { throw "docker compose up に失敗しました (exit=$LASTEXITCODE)" }

$ip = Get-HostIPv4
Write-Host ''
Write-Host '✅ 起動しました。以下の URL からアクセスできます:' -ForegroundColor Green
Write-Host "   🖥️  この端末:      http://localhost:$Port" -ForegroundColor White
Write-Host "   🌐 LAN内の他端末:  http://${ip}:$Port" -ForegroundColor White
Write-Host ''
Write-Host '   🔑 ログイン: 任意のID/パスワード（例: admin@civil-ims.local / demo）' -ForegroundColor Gray
Write-Host '   ⏹  停止:    pwsh -NoProfile -File .\scripts\mock\Stop-MockUI.ps1' -ForegroundColor Gray
Write-Host '   🔁 自動起動: pwsh -NoProfile -File .\scripts\mock\Register-MockUI-Autostart.ps1' -ForegroundColor Gray
