# =============================================================================
# scripts/dockerfile-lint.ps1
#
# Construction DX One Platform - Dockerfile 静的解析 (Loop #7)
#
# 全 Dockerfile を 1 つずつ静的解析し、以下の観点で整合性をチェックする。
#   - FROM ベースイメージ
#   - WORKDIR / USER の有無
#   - EXPOSE / HEALTHCHECK の有無
#   - apt パッケージ (build-essential / libpq-dev / curl / libgeos-dev)
#   - COPY パスがリポジトリルートからの相対 (build.context=. 整合)
#
# 出力:
#   - コンソール: テーブル形式で issue を可視化
#   - DOCKERFILE_AUDIT.md: 同内容を Markdown で保存
#
# 実行はホスト不要 (docker build はしない)。Dockerfile を読むだけ。
# =============================================================================

[CmdletBinding()]
param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$ReportPath = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")).Path "DOCKERFILE_AUDIT.md")
)

$ErrorActionPreference = "Stop"

Write-Host "==================================================================="
Write-Host " Dockerfile lint - Construction DX One Platform (Loop #7)"
Write-Host "==================================================================="
Write-Host "RepoRoot   : $RepoRoot"
Write-Host "ReportPath : $ReportPath"
Write-Host ""

# Dockerfile を再帰検索 (node_modules / __pycache__ 除外)
$dockerfiles = Get-ChildItem -Path $RepoRoot -Recurse -Filter "Dockerfile" -File |
    Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\__pycache__\\"
    } |
    Sort-Object FullName

Write-Host "Discovered $($dockerfiles.Count) Dockerfile(s)."
Write-Host ""

$rows = New-Object System.Collections.Generic.List[object]
$totalIssues = 0

foreach ($df in $dockerfiles) {
    $rel = $df.FullName.Substring($RepoRoot.Length).TrimStart('\','/')
    $content = Get-Content -LiteralPath $df.FullName -Raw -Encoding UTF8
    $lines = $content -split "`n"

    $issues = New-Object System.Collections.Generic.List[string]

    # ---- FROM ----
    $fromMatches = [regex]::Matches($content, "(?m)^\s*FROM\s+([^\s]+)")
    $baseImages = @($fromMatches | ForEach-Object { $_.Groups[1].Value })
    if ($baseImages.Count -eq 0) {
        $issues.Add("FROM 命令が見つからない")
        $baseImageDisplay = "(none)"
    } else {
        $baseImageDisplay = ($baseImages -join ", ")
    }

    # ---- WORKDIR ----
    $hasWorkdir = $content -match "(?m)^\s*WORKDIR\s+"
    if (-not $hasWorkdir) { $issues.Add("WORKDIR 未指定") }

    # ---- EXPOSE ----
    $hasExpose = $content -match "(?m)^\s*EXPOSE\s+"
    if (-not $hasExpose) { $issues.Add("EXPOSE 未指定") }

    # ---- HEALTHCHECK ----
    $hasHealthcheck = $content -match "(?m)^\s*HEALTHCHECK\s+"
    # backend/api-gateway/mocks 以外 (frontend) は HEALTHCHECK 任意なので warn にしない
    $isFrontend = $rel -match "frontend\\|frontend/|shared-ui"
    if (-not $hasHealthcheck -and -not $isFrontend) {
        $issues.Add("HEALTHCHECK 未指定 (backend/gateway は推奨)")
    }

    # ---- USER ----
    $hasUser = $content -match "(?m)^\s*USER\s+"
    if (-not $hasUser) {
        # root 実行は脆弱性。warn のみ
        $issues.Add("USER 未指定 (root 実行: 本番では非推奨)")
    }

    # ---- apt パッケージ (backend) ----
    if (-not $isFrontend) {
        # apt-get install ブロック全体 (バックスラッシュ継続行を含む) を抽出
        $aptBlockMatch = [regex]::Match($content, "(?ms)apt-get\s+install\b.*?(?<!\\)\r?\n")
        $aptLine = if ($aptBlockMatch.Success) { $aptBlockMatch.Value } else { "" }
        $needs = @("build-essential","libpq-dev","curl")
        foreach ($pkg in $needs) {
            if ($aptLine -notmatch [regex]::Escape($pkg)) {
                # mocks Dockerfile は build-essential/libpq-dev 不要
                if ($rel -match "mocks\\|mocks/") {
                    if ($pkg -eq "curl") {
                        $issues.Add("apt: $pkg 不足")
                    }
                } else {
                    $issues.Add("apt: $pkg 不足")
                }
            }
        }
        # geo 系: 03 / 09 / 11 は libgeos-dev 必須
        if ($rel -match "(03_|09_|11_)") {
            if ($aptLine -notmatch "libgeos-dev") {
                $issues.Add("apt: libgeos-dev 不足 (geoalchemy2/shapely 利用部門)")
            }
        }
    }

    # ---- COPY パス整合 ----
    # build context=. の前提で、COPY src は repo-root 相対のはず
    $copyMatches = [regex]::Matches($content, "(?m)^\s*COPY\s+(?:--from=\S+\s+)?(?:--chown=\S+\s+)?(\S+)\s+(\S+)")
    $isMocks = $rel -match "^mocks\\|^mocks/"
    foreach ($cm in $copyMatches) {
        $src = $cm.Groups[1].Value
        # 絶対パスや http URL や stage 内 COPY (build stage --from=) は除外済
        if ($src.StartsWith("/") -or $src -match "^https?:") { continue }
        # mocks Dockerfile は build.context=./mocks なので相対 OK
        if ($isMocks) { continue }
        # shared-ui Dockerfile は repo-root context
        # backend / frontend は build.context=. (repo root)
        # よって "../" は不正
        if ($src -match "^\.\./") {
            $issues.Add("COPY 親階層参照あり: $src (build.context=. と非整合)")
        }
    }

    # ---- COPY nginx.conf (frontend のみ) ----
    if ($isFrontend -and ($content -match "COPY[^\n]*nginx\.conf")) {
        # nginx.conf を COPY しているなら、リポジトリ上に存在しているか確認
        $deptDir = Split-Path $df.FullName -Parent
        $nginxConf = Join-Path $deptDir "nginx.conf"
        if (-not (Test-Path -LiteralPath $nginxConf)) {
            $issues.Add("nginx.conf を COPY するが該当ファイルなし: $nginxConf")
        }
    } elseif ($isFrontend -and ($rel -notmatch "shared-ui")) {
        # nginx.conf を COPY しない frontend は default nginx 設定で動作するが、SPA fallback が無い可能性
        if ($content -notmatch "COPY[^\n]*nginx\.conf") {
            $issues.Add("nginx.conf 未配置 (SPA fallback が無いと React Router で 404)")
        }
    }

    $issueText = if ($issues.Count -gt 0) { ($issues -join "; ") } else { "OK" }
    $totalIssues += $issues.Count

    $rows.Add([pscustomobject]@{
        File         = $rel
        Base         = $baseImageDisplay
        Workdir      = if ($hasWorkdir) { "OK" } else { "-" }
        Expose       = if ($hasExpose) { "OK" } else { "-" }
        Healthcheck  = if ($hasHealthcheck) { "OK" } else { "-" }
        User         = if ($hasUser) { "OK" } else { "-" }
        IssueCount   = $issues.Count
        Issues       = $issueText
    })
}

# ---- コンソール出力 ----
$rows | Format-Table File, Base, Workdir, Expose, Healthcheck, User, IssueCount -AutoSize

Write-Host ""
Write-Host "Total Dockerfile(s) : $($dockerfiles.Count)"
Write-Host "Total issue lines   : $totalIssues"
$flagged = $rows | Where-Object { $_.IssueCount -gt 0 }
Write-Host "Files with issues   : $($flagged.Count)"
Write-Host ""

# ---- Markdown レポート ----
$nowIso = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
$md = New-Object System.Text.StringBuilder
[void]$md.AppendLine("# Dockerfile Audit Report (Loop #7)")
[void]$md.AppendLine("")
[void]$md.AppendLine("- 実行日時: $nowIso")
[void]$md.AppendLine("- リポジトリ: Construction DX One Platform")
[void]$md.AppendLine("- 対象 Dockerfile 数: $($dockerfiles.Count)")
[void]$md.AppendLine("- 問題のあるファイル: $($flagged.Count)")
[void]$md.AppendLine("- 検出 issue 件数 (合計): $totalIssues")
[void]$md.AppendLine("")
[void]$md.AppendLine("## サマリ表")
[void]$md.AppendLine("")
[void]$md.AppendLine("| File | Base | WORKDIR | EXPOSE | HEALTHCHECK | USER | Issues |")
[void]$md.AppendLine("| --- | --- | :---: | :---: | :---: | :---: | ---: |")
foreach ($r in $rows) {
    $flag = if ($r.IssueCount -gt 0) { "**$($r.IssueCount)**" } else { "0" }
    [void]$md.AppendLine("| ``$($r.File)`` | $($r.Base) | $($r.Workdir) | $($r.Expose) | $($r.Healthcheck) | $($r.User) | $flag |")
}
[void]$md.AppendLine("")
[void]$md.AppendLine("## 詳細 (issue があるファイルのみ)")
[void]$md.AppendLine("")
if ($flagged.Count -eq 0) {
    [void]$md.AppendLine("issue なし。")
} else {
    foreach ($r in $flagged) {
        [void]$md.AppendLine("### ``$($r.File)``")
        [void]$md.AppendLine("")
        foreach ($i in ($r.Issues -split "; ")) {
            [void]$md.AppendLine("- $i")
        }
        [void]$md.AppendLine("")
    }
}
[void]$md.AppendLine("## 観点メモ")
[void]$md.AppendLine("")
[void]$md.AppendLine("- WORKDIR / EXPOSE / HEALTHCHECK / USER は static lint のみで、")
[void]$md.AppendLine("  実 build は ``scripts/build-all.ps1`` で別途検証する。")
[void]$md.AppendLine("- ``USER 未指定`` は本番では root 緩和のために non-root user を追加する候補。")
[void]$md.AppendLine("  Phase 1 (開発フェーズ) ではブロッカー扱いしない。")
[void]$md.AppendLine("- COPY の親階層参照 (``../``) は build.context=. の compose 設定と非整合なため即修正対象。")
[void]$md.AppendLine("- frontend で ``nginx.conf`` 未配置の場合、React Router の SPA fallback が効かない (要 ``try_files``)。")

Set-Content -LiteralPath $ReportPath -Value $md.ToString() -Encoding UTF8
Write-Host "Report written: $ReportPath"
Write-Host ""

if ($totalIssues -gt 0) {
    Write-Host "[WARN] $totalIssues issue(s) detected. See $ReportPath for details." -ForegroundColor Yellow
    exit 0  # warnings only; not failing CI
} else {
    Write-Host "[OK] All Dockerfiles passed static lint." -ForegroundColor Green
    exit 0
}
