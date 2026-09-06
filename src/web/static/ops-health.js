/**
 * 運用ヘルスダッシュボード（Issue #89）。
 *
 * GET /api/v1/ops/health が集約する実データ（プロセス稼働状態・DB接続状態・
 * scripts/health-probe.sh の直近ログ・連携ゲートウェイ登録状況）を1画面に
 * 表示する。トークンは SSR が hidden input へ埋め込む（localStorage 不使用）。
 * CSP は script-src 'self' のため、本ファイルのみで実装する。
 */

(() => {
  "use strict";

  const token = document.getElementById("ceopToken")?.value ?? "";
  const $ = (id) => document.getElementById(id);

  async function api(path) {
    const res = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      let detail = `${res.status}`;
      try {
        const body = await res.json();
        detail = body.message ?? JSON.stringify(body.error ?? body);
      } catch {
        /* 本文なし */
      }
      const err = new Error(detail);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function badge(label, tone) {
    return `<span class="badge badge-${tone}">${esc(label)}</span>`;
  }

  const DB_STATUS_BADGE = {
    connected: () => badge("接続済み", "green"),
    error: () => badge("エラー", "red"),
    unknown: () => badge("不明", "muted"),
  };

  const PROBE_SEVERITY_BADGE = {
    OK: () => badge("OK", "green"),
    RECOVERED: () => badge("復旧", "green"),
    WARN: () => badge("警告", "yellow"),
    ALERT: () => badge("アラート", "red"),
  };

  function row(label, valueHtml) {
    return `<tr><td class="cell-strong">${esc(label)}</td><td>${valueHtml}</td></tr>`;
  }

  // ── サマリー ─────────────────────────────────────────────────
  function renderSummary(snapshot) {
    const dbBadge = (DB_STATUS_BADGE[snapshot.database.status] ?? DB_STATUS_BADGE.unknown)();
    const probeBadge = snapshot.healthProbe.configured
      ? (PROBE_SEVERITY_BADGE[snapshot.healthProbe.lastSeverity] ?? (() => badge("不明", "muted")))()
      : badge("未接続", "muted");
    const gatewayBadge = snapshot.gateway.configured
      ? badge(`${snapshot.gateway.services.length} 件登録`, "blue")
      : badge("未設定", "muted");
    $("summaryBody").innerHTML = [
      row("プロセス", badge(`稼働中 (PID ${esc(snapshot.process.pid)})`, "green")),
      row("データベース", dbBadge),
      row("ヘルスプローブ", probeBadge),
      row("連携ゲートウェイ", gatewayBadge),
      row("最終更新", `<code>${esc(new Date(snapshot.generatedAt).toLocaleString("ja-JP"))}</code>`),
    ].join("");
  }

  // ── プロセス稼働状態 ─────────────────────────────────────────
  function renderProcess(p) {
    $("processBody").innerHTML = [
      row("PID", `<code>${esc(p.pid)}</code>`),
      row("稼働時間", `${esc(Math.floor(p.uptimeSeconds / 3600))}時間${esc(Math.floor((p.uptimeSeconds % 3600) / 60))}分`),
      row("Node.js", `<code>${esc(p.nodeVersion)}</code>`),
      row("プラットフォーム", `<code>${esc(p.platform)}</code>`),
      row("アプリバージョン", `<code>${esc(p.platformVersion)}</code>`),
      row("環境", `<code>${esc(p.environment)}</code>`),
      row(
        "メモリ使用量",
        `RSS ${esc(p.memoryMb.rss)} MB ・ Heap ${esc(p.memoryMb.heapUsed)} / ${esc(p.memoryMb.heapTotal)} MB`,
      ),
    ].join("");
  }

  // ── データベース接続状態 ─────────────────────────────────────
  function renderDatabase(db) {
    const rows = [
      row("永続化層", `<code>${esc(db.tier)}</code>`),
      row("状態", (DB_STATUS_BADGE[db.status] ?? DB_STATUS_BADGE.unknown)()),
    ];
    if (db.latencyMs !== undefined) {
      rows.push(row("応答時間", `${esc(db.latencyMs)} ms`));
    }
    if (db.error !== undefined) {
      rows.push(row("エラー内容", `<span class="cell-soft">${esc(db.error)}</span>`));
    }
    $("databaseBody").innerHTML = rows.join("");
  }

  // ── 直近のヘルスプローブ結果 ─────────────────────────────────
  function renderProbe(probe) {
    if (!probe.configured) {
      $("probeSummaryBody").innerHTML = row(
        "状態",
        `<span class="cell-soft">${esc(probe.note ?? "未接続")}</span>`,
      );
      $("probeLogBody").innerHTML =
        '<tr><td colspan="3" class="empty-cell">ログがありません</td></tr>';
      return;
    }
    const rows = [];
    if (probe.consecutiveFailures !== undefined) {
      rows.push(row("連続失敗回数", `${esc(probe.consecutiveFailures)} 回`));
    }
    if (probe.lastSeverity !== undefined) {
      rows.push(
        row("最終結果", (PROBE_SEVERITY_BADGE[probe.lastSeverity] ?? (() => badge(probe.lastSeverity, "muted")))()),
      );
    }
    if (probe.lastCheckedAt !== undefined) {
      rows.push(row("最終確認時刻", `<code>${esc(probe.lastCheckedAt)}</code>`));
    }
    $("probeSummaryBody").innerHTML = rows.join("");

    const entries = probe.recentEntries ?? [];
    $("probeLogBody").innerHTML =
      entries.length === 0
        ? '<tr><td colspan="3" class="empty-cell">ログがありません</td></tr>'
        : entries
            .slice()
            .reverse()
            .map(
              (e) => `<tr>
                <td><code class="cell-muted">${esc(e.timestamp)}</code></td>
                <td>${(PROBE_SEVERITY_BADGE[e.severity] ?? (() => badge(e.severity, "muted")))()}</td>
                <td class="cell-soft">${esc(e.message)}</td>
              </tr>`,
            )
            .join("");
  }

  // ── 連携ゲートウェイ ─────────────────────────────────────────
  function renderGateway(gateway) {
    if (!gateway.configured) {
      $("gatewayBody").innerHTML =
        '<tr><td colspan="3" class="cell-soft">連携ゲートウェイは未設定です</td></tr>';
      $("gatewayNotice").textContent = "";
      return;
    }
    const services = gateway.services ?? [];
    $("gatewayBody").innerHTML =
      services.length === 0
        ? '<tr><td colspan="3" class="cell-soft">登録済みサービスがありません</td></tr>'
        : services
            .map(
              (s) => `<tr>
                <td><code class="cell-muted">${esc(s.id)}</code></td>
                <td class="cell-strong">${esc(s.name)}</td>
                <td>${s.enabled ? badge("有効", "green") : badge("無効", "muted")}</td>
              </tr>`,
            )
            .join("");
    $("gatewayNotice").textContent = `合計 ${services.length} 件`;
  }

  // ── 初期化 ───────────────────────────────────────────────────
  async function load() {
    try {
      const snapshot = await api("/api/v1/ops/health");
      renderSummary(snapshot);
      renderProcess(snapshot.process);
      renderDatabase(snapshot.database);
      renderProbe(snapshot.healthProbe);
      renderGateway(snapshot.gateway);
    } catch (e) {
      $("summaryBody").innerHTML =
        `<tr><td class="cell-soft">取得に失敗しました: ${esc(e.message)}</td></tr>`;
    }
  }

  function init() {
    const hamburger = document.getElementById("hamburgerBtn");
    const sidebar = document.getElementById("sidebar");
    if (hamburger && sidebar) {
      hamburger.addEventListener("click", () => sidebar.classList.toggle("open"));
    }
    $("refreshBtn").addEventListener("click", load);
    load();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
