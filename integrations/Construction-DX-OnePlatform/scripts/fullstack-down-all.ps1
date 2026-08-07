# =========================================================
# Construction DX One Platform — Fullstack 一括停止
# 全 23 サービス (frontend 11 + backend 11 + mocks) を停止
# =========================================================

$Ports = @(5179) + @(5180..5190) + @(8001..8011) + @(8090)
$ErrCount = 0
$StopCount = 0

foreach ($p in $Ports) {
    $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        try {
            $proc = Get-Process -Id $c.OwningProcess -ErrorAction Stop
            Write-Host "🛑 stopping pid=$($proc.Id) ($($proc.ProcessName)) on port $p"
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
            $StopCount++
        } catch [Microsoft.PowerShell.Commands.ProcessCommandException] {
            # process already gone — benign
        } catch {
            Write-Warning "port=$p pid=$($c.OwningProcess) の停止に失敗: $($_.Exception.Message)"
            $ErrCount++
        }
    }
}

if ($ErrCount -eq 0) {
    Write-Host "✅ Fullstack 停止完了 (stopped=$StopCount)"
    exit 0
} else {
    Write-Warning "⚠️ Fullstack 停止に一部失敗 (stopped=$StopCount, errors=$ErrCount)"
    exit 1
}
