#requires -Version 5.1
[CmdletBinding()]
param([switch]$Volumes)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

$args = @('compose', 'down')
if ($Volumes) { $args += '-v' }

Write-Host "docker $($args -join ' ')" -ForegroundColor Yellow
docker @args
