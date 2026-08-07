#Requires -RunAsAdministrator
<#
.SYNOPSIS
    ServiceHub Construction Platform — Windows 停止スクリプト
#>

$ProjectRoot = "C:\ServiceHub\ServiceHub-Construction-Platform"
$LogFile     = "C:\ServiceHub\logs\servicehub-startup.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp][$Level] $Message"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

Write-Log "ServiceHub 停止中..."
Set-Location $ProjectRoot

docker compose `
    -f docker-compose.yml `
    -f docker-compose.override.yml `
    -f docker-compose.windows.yml `
    down

Write-Log "ServiceHub 停止完了"
