# ==============================================================================
# Construction-Enterprise-OS — タスクスケジューラー登録スクリプト
# 実行方法: 管理者権限で .\scripts\windows\register-autostart.ps1
# ==============================================================================

param(
    [string]$UserName = $env:USERNAME,
    [switch]$Force   # 既存タスクがあっても上書き
)

$ErrorActionPreference = "Stop"
$TaskName  = "Construction-Enterprise-OS-Autostart"
$TaskPath  = "\"  # ルートフォルダ
$ScriptSrc = "D:\Construction-Enterprise-OS\scripts\windows\autostart-template.ps1"
$ScriptDst = "C:\ProgramData\ConstructionOS\autostart.ps1"
$LogDir    = "C:\ProgramData\ConstructionOS\logs"

Write-Host "🏗️  Construction-Enterprise-OS タスクスケジューラー登録" -ForegroundColor Cyan
Write-Host "   対象ユーザー: $UserName" -ForegroundColor Gray

# ── 管理者権限確認 ────────────────────────────────────────────────────────────
$currentPrincipal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  管理者権限で実行してください" -ForegroundColor Red
    Write-Host "   右クリック → 管理者として実行" -ForegroundColor Yellow
    exit 1
}

# ── ディレクトリ準備 ──────────────────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path "C:\ProgramData\ConstructionOS"  | Out-Null
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# ── autostart.ps1 を C: にコピー ─────────────────────────────────────────────
Write-Host "📋 autostart.ps1 を C:\ProgramData\ConstructionOS\ にコピー..." -ForegroundColor Yellow
Copy-Item "C:\ProgramData\ConstructionOS\autostart.ps1" $ScriptDst -Force -ErrorAction SilentlyContinue
# すでにある場合はスキップ
if (-not (Test-Path $ScriptDst)) {
    Write-Host "⚠️  $ScriptDst が見つかりません。先に setup.ps1 を実行してください。" -ForegroundColor Red
    exit 1
}
Write-Host "✅ $ScriptDst" -ForegroundColor Green

# ── 既存タスク確認 ────────────────────────────────────────────────────────────
$existingTask = schtasks /query /tn $TaskName /fo LIST 2>&1
if ($LASTEXITCODE -eq 0) {
    if (-not $Force) {
        Write-Host "ℹ️  タスク '$TaskName' は既に登録されています。" -ForegroundColor Gray
        Write-Host "   上書きするには -Force オプションを付けて実行してください。" -ForegroundColor Gray
        exit 0
    }
    Write-Host "🔄 既存タスクを削除中..." -ForegroundColor Yellow
    schtasks /delete /tn $TaskName /f 2>&1 | Out-Null
}

# ── タスク登録（schtasks.exeを使用）─────────────────────────────────────────
# Action: PowerShell を最小化ウィンドウで実行
$psExe   = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$psArgs  = "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptDst`""

# XML テンプレートでタスク作成（より細かい設定が可能）
$taskXml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Construction-Enterprise-OS Docker containers autostart. Waits for BitLocker D: drive unlock then starts docker compose.</Description>
    <Author>$UserName</Author>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
      <UserId>$env:COMPUTERNAME\$UserName</UserId>
      <Delay>PT1M</Delay>
    </LogonTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$env:COMPUTERNAME\$UserName</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>false</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <DisallowStartOnRemoteAppSession>false</DisallowStartOnRemoteAppSession>
    <UseUnifiedSchedulingEngine>true</UseUnifiedSchedulingEngine>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT2H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>$psExe</Command>
      <Arguments>$psArgs</Arguments>
      <WorkingDirectory>C:\ProgramData\ConstructionOS</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@

# XML を一時ファイルに保存してタスク登録
$tempXml = "$env:TEMP\construction-os-task.xml"
$taskXml | Out-File -FilePath $tempXml -Encoding Unicode

try {
    schtasks /create /tn $TaskName /xml $tempXml /ru $UserName /f 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "schtasks /create 失敗"
    }
    Write-Host "✅ タスク登録完了: $TaskName" -ForegroundColor Green
} catch {
    Write-Host "❌ タスク登録失敗: $_" -ForegroundColor Red
    # フォールバック: シンプルな方法
    Write-Host "🔄 シンプル登録を試みます..." -ForegroundColor Yellow
    schtasks /create /tn $TaskName /tr "$psExe $psArgs" /sc ONLOGON /delay 0001:00 /rl HIGHEST /f 2>&1
}

Remove-Item $tempXml -ErrorAction SilentlyContinue

# ── Docker Desktop 自動起動確認・設定 ────────────────────────────────────────
Write-Host ""
Write-Host "📌 Docker Desktop 自動起動確認..." -ForegroundColor Yellow
$dockerRunValue = (Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" -ErrorAction SilentlyContinue)."Docker Desktop"
if ($dockerRunValue) {
    Write-Host "✅ Docker Desktop は既にログイン時自動起動に登録済み" -ForegroundColor Green
    Write-Host "   $dockerRunValue" -ForegroundColor Gray
} else {
    $dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerExe) {
        Set-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" `
            -Name "Docker Desktop" -Value "`"$dockerExe`"" -Type String
        Write-Host "✅ Docker Desktop を自動起動登録しました" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Docker Desktop が見つかりません: $dockerExe" -ForegroundColor DarkYellow
    }
}

# ── 登録内容確認 ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "📊 登録タスク情報:" -ForegroundColor Cyan
schtasks /query /tn $TaskName /fo LIST 2>&1 | Where-Object { $_ -match "Task Name|Status|Next Run|Logon" }

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ 自動起動設定完了" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  動作フロー:" -ForegroundColor White
Write-Host "  1. Windows 起動" -ForegroundColor Gray
Write-Host "  2. BitLocker D: 解除（TPMにより自動）" -ForegroundColor Gray
Write-Host "  3. ログイン" -ForegroundColor Gray
Write-Host "  4. Docker Desktop 起動（自動）" -ForegroundColor Gray
Write-Host "  5. タスク実行（1分後）→ D:待機 → Docker待機 → compose up" -ForegroundColor Gray
Write-Host ""
Write-Host "  ログ: C:\ProgramData\ConstructionOS\logs\" -ForegroundColor DarkGray
Write-Host "  手動実行: schtasks /run /tn `"$TaskName`"" -ForegroundColor DarkGray
Write-Host "  削除:     .\scripts\windows\unregister-autostart.ps1" -ForegroundColor DarkGray
