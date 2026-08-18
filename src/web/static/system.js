/**
 * システム設定コンソール（v0.14.3）。
 *
 * プラットフォーム情報 / API キー / 監査エクスポート / メトリクスを
 * CEOP API から読み込み、右側詳細コンテンツとして表示する。
 * トークンは SSR が hidden input へ埋め込む（localStorage 不使用）。
 * CSP は script-src 'self' のため、本ファイルのみで実装する。
 */

(() => {
  "use strict";

  const token = document.getElementById("ceopToken")?.value ?? "";
  const $ = (id) => document.getElementById(id);

  const toast = $("toastContainer");

  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
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
    return res.status === 204 ? null : res.json();
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── タブ切替 ─────────────────────────────────────────────────
  function setActiveTab(tab) {
    document.querySelectorAll(".system-tab").forEach((el) => {
      el.classList.toggle("active", el.dataset.tab === tab);
    });
    $("infoSection").hidden = tab !== "info";
    $("keysSection").hidden = tab !== "keys";
    $("auditSection").hidden = tab !== "audit";
    $("metricsSection").hidden = tab !== "metrics";
    const titles = {
      info: "⚙️ システム設定 — プラットフォーム情報",
      keys: "⚙️ システム設定 — API キー",
      audit: "⚙️ システム設定 — 監査エクスポート",
      metrics: "⚙️ システム設定 — メトリクス",
    };
    $("pageTitle").textContent = titles[tab] ?? "⚙️ システム設定";
  }

  document.querySelectorAll(".system-tab").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveTab(el.dataset.tab);
    });
  });
  window.addEventListener("hashchange", () => {
    const next = window.location.hash.replace("#", "");
    if (["info", "keys", "audit", "metrics"].includes(next)) {
      setActiveTab(next);
    }
  });

  // ── プラットフォーム情報 ─────────────────────────────────────
  async function loadInfo() {
    try {
      const info = await api("/api/v1/info");
      const rows = [
        ["プラットフォーム名", info.name ?? "—"],
        ["バージョン", info.version ?? "—"],
        ["環境", info.environment ?? "—"],
        ["Node.js", info.nodeVersion ?? "—"],
      ];
      $("infoBody").innerHTML = rows
        .map(
          ([k, v]) =>
            `<tr><td class="cell-strong">${esc(k)}</td><td><code>${esc(v)}</code></td></tr>`,
        )
        .join("");
    } catch (e) {
      $("infoBody").innerHTML = `<tr><td class="cell-soft">情報取得に失敗: ${esc(e.message)}</td></tr>`;
    }
  }

  // ── API キー ─────────────────────────────────────────────────
  async function loadKeys() {
    $("keysBody").innerHTML =
      '<tr><td colspan="4" class="cell-soft">読み込み中…</td></tr>';
    $("keysNotice").textContent = "";
    try {
      const data = await api("/api/v1/auth/keys");
      const keys = data.keys ?? [];
      $("keysBody").innerHTML =
        keys.length === 0
          ? '<tr><td colspan="4" class="cell-soft">API キーがありません</td></tr>'
          : keys
              .map(
                (k) => `<tr>
                  <td><code class="cell-muted">${esc(k.keyId)}</code></td>
                  <td class="cell-strong">${esc(k.subject)}</td>
                  <td class="cell-soft">${esc((k.permissions ?? []).join(", "))}</td>
                  <td class="cell-soft">${esc(k.organizationId ?? "プラットフォーム全体")}</td>
                </tr>`,
              )
              .join("");
      $("keysNotice").textContent = `合計 ${keys.length} 件（シークレットは表示されません）`;
    } catch (e) {
      $("keysBody").innerHTML =
        '<tr><td colspan="4" class="cell-soft">API キー管理はプラットフォームレベルの権限が必要です（組織スコープのログインでは閲覧できません）</td></tr>';
      if (e.status !== 403) {
        $("keysNotice").textContent = `取得失敗: ${e.message}`;
      }
    }
  }

  // ── 監査エクスポート ─────────────────────────────────────────
  async function exportAudit() {
    $("auditNotice").textContent = "";
    try {
      const res = await fetch("/api/v1/governance/audit/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `${res.status}`);
      }
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "ceop-audit.csv";
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      $("auditNotice").textContent = "監査ログを CSV 出力しました。";
      toast.textContent = "監査ログを出力しました";
      toast.hidden = false;
      setTimeout(() => {
        toast.hidden = true;
      }, 4000);
    } catch (e) {
      $("auditNotice").textContent = `出力に失敗: ${e.message}`;
    }
  }

  // ── メトリクス ───────────────────────────────────────────────
  async function loadMetrics() {
    try {
      const res = await fetch("/metrics");
      const text = await res.text();
      const lines = text.split("\n").filter((l) => !l.startsWith("#")).slice(0, 25);
      $("metricsPreview").textContent =
        lines.length > 0 ? lines.join("\n") : "（メトリクスがありません）";
    } catch (e) {
      $("metricsPreview").textContent = `メトリクス取得に失敗: ${e.message}`;
    }
  }

  // ── 初期化 ───────────────────────────────────────────────────
  function init() {
    document.querySelectorAll(".system-tab").forEach((el) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();
        setActiveTab(el.dataset.tab);
      });
    });
    const initial = window.location.hash.replace("#", "");
    setActiveTab(["info", "keys", "audit", "metrics"].includes(initial) ? initial : "info");
    const hamburger = document.getElementById("hamburgerBtn");
    const sidebar = document.getElementById("sidebar");
    if (hamburger && sidebar) {
      hamburger.addEventListener("click", () => sidebar.classList.toggle("open"));
    }
    $("refreshBtn").addEventListener("click", () => {
      loadInfo();
      loadKeys();
      loadMetrics();
    });
    $("auditExportBtn").addEventListener("click", exportAudit);
    loadInfo();
    loadKeys();
    loadMetrics();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
