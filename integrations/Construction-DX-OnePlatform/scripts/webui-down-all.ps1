# =========================================================
# Construction DX One Platform — WebUI 一括停止
# 5180-5190 ポートで動く node プロセスを終了
# =========================================================

$Ports = 5180..5190
foreach ($p in $Ports) {
    $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        try {
            $proc = Get-Process -Id $c.OwningProcess -ErrorAction Stop
            Write-Host "🛑 stopping pid=$($proc.Id) ($($proc.ProcessName)) on port $p"
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
        } catch {
            Write-Host "  (port $p: no process or already gone)"
        }
    }
}
Write-Host "✅ done"
