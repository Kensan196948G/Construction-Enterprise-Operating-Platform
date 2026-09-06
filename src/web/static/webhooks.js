/**
 * Webhook配信管理コンソール（v0.14.6）。
 *
 * 送信先一覧（契約定義）はSSRで埋め込み済み。配信履歴の絞り込み・ページング・
 * 再送・新規登録は CEOP integrations API を直接呼び出す。
 * トークンは SSR が hidden input へ埋め込む（localStorage 不使用）。
 * CSP は script-src 'self' のため、本ファイルのみで実装する。
 */

(() => {
  "use strict";

  const token = document.getElementById("ceopToken")?.value ?? "";
  const $ = (id) => document.getElementById(id);

  const toastContainer = $("toastContainer");
  const eventsBody = $("eventsBody");
  const regSystem = $("regSystem");
  const regEventType = $("regEventType");
  const registerForm = $("registerForm");
  const filterSystem = $("filterSystem");
  const filterDirection = $("filterDirection");
  const filterStatus = $("filterStatus");
  const pageInfo = $("pageInfo");

  const PAGE_SIZE = 20;
  let offset = 0;
  let lastTotal = 0;

  // ── API ヘルパー ─────────────────────────────────────────────────────────
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

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showToast(message, kind = "") {
    const toast = document.createElement("div");
    toast.className = `toast${kind ? ` ${kind}` : ""}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity .3s";
    }, 2800);
    setTimeout(() => toast.remove(), 3200);
  }

  function fmtTime(iso) {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return escapeHtml(iso);
    return date.toLocaleString("ja-JP");
  }

  // ── ステータス表示 ───────────────────────────────────────────────────────
  const STATUS_LABELS = {
    received: "受信済み",
    pending: "送信待ち",
    sent: "送信済み",
    retrying: "再送中",
    failed: "失敗",
    acknowledged: "確認済み",
  };
  const STATUS_BADGES = {
    received: "badge-blue",
    pending: "badge-yellow",
    sent: "badge-green",
    retrying: "badge-yellow",
    failed: "badge-red",
    acknowledged: "badge-green",
  };
  const RETRYABLE_STATUSES = new Set(["pending", "retrying", "failed"]);

  function renderEventRow(e) {
    const statusLabel = STATUS_LABELS[e.status] ?? e.status;
    const badgeClass = STATUS_BADGES[e.status] ?? "badge-muted";
    const errorLine = e.lastError ? `<div class="cell-soft">${escapeHtml(e.lastError)}</div>` : "";
    const canRetry = e.direction === "outbound" && RETRYABLE_STATUSES.has(e.status);
    const retryCell = canRetry
      ? `<button class="btn btn-sm" data-action="retry" data-id="${escapeHtml(e.id)}">再送</button>`
      : '<span class="cell-muted">—</span>';
    return `
      <tr>
        <td><code class="cell-muted">${escapeHtml(e.id)}</code></td>
        <td>${escapeHtml(e.system)}</td>
        <td>${escapeHtml(e.direction)}</td>
        <td>${escapeHtml(e.eventType)}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(statusLabel)}</span>${errorLine}</td>
        <td>${Number(e.attempts ?? 0)}</td>
        <td>${fmtTime(e.updatedAt)}</td>
        <td>${retryCell}</td>
      </tr>`;
  }

  function renderEvents(events) {
    eventsBody.innerHTML =
      events.length === 0
        ? '<tr><td colspan="8" class="empty-cell">配信履歴がありません</td></tr>'
        : events.map(renderEventRow).join("");
  }

  // ── 配信履歴の読み込み ───────────────────────────────────────────────────
  function buildQuery(params) {
    return Object.entries(params)
      .filter(([, value]) => value !== "" && value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");
  }

  async function loadEvents() {
    const query = buildQuery({
      system: filterSystem.value,
      direction: filterDirection.value,
      status: filterStatus.value,
      limit: PAGE_SIZE,
      offset,
    });
    try {
      const data = await api(`/api/v1/integrations/events?${query}`);
      renderEvents(data.events ?? []);
      lastTotal = Number(data.total ?? 0);
      const from = lastTotal === 0 ? 0 : offset + 1;
      const to = Math.min(offset + PAGE_SIZE, lastTotal);
      pageInfo.textContent = `${from}–${to} / 全 ${lastTotal} 件`;
      $("prevPageBtn").disabled = offset === 0;
      $("nextPageBtn").disabled = offset + PAGE_SIZE >= lastTotal;
    } catch (e) {
      showToast(`配信履歴の取得に失敗: ${e.message}`, "error");
    }
  }

  // ── 送信先システム → イベント種別の同期 ────────────────────────────────
  function eventTypesFor(system) {
    const option = Array.from(regSystem.options).find((o) => o.value === system);
    const raw = option?.dataset.eventTypes ?? "";
    return raw ? raw.split(",") : [];
  }

  function syncEventTypeOptions() {
    const types = eventTypesFor(regSystem.value);
    regEventType.innerHTML =
      types.length === 0
        ? '<option value="">先にシステムを選択してください</option>'
        : types.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
  }

  regSystem.addEventListener("change", syncEventTypeOptions);

  // ── 新規登録 ─────────────────────────────────────────────────────────────
  async function registerEvent(event) {
    event.preventDefault();
    const system = regSystem.value;
    const eventType = regEventType.value;
    if (!system || !eventType) {
      showToast("送信先システムとイベント種別を選択してください", "error");
      return;
    }
    let payload = {};
    const rawPayload = $("regPayload").value.trim();
    if (rawPayload) {
      try {
        payload = JSON.parse(rawPayload);
      } catch {
        showToast("ペイロードが有効なJSONではありません", "error");
        return;
      }
    }
    const body = {
      system,
      eventType,
      payload,
    };
    const idempotencyKey = $("regIdempotencyKey").value.trim();
    if (idempotencyKey) body.idempotencyKey = idempotencyKey;
    const outboundUrl = $("regOutboundUrl").value.trim();
    if (outboundUrl) body.outboundUrl = outboundUrl;
    try {
      const data = await api("/api/v1/integrations/events", {
        method: "POST",
        body: JSON.stringify(body),
      });
      showToast(
        data.duplicated ? "同一の冪等性キーの配信が既に存在します" : "Webhook配信をキューに登録しました",
      );
      registerForm.reset();
      syncEventTypeOptions();
      offset = 0;
      await loadEvents();
    } catch (e) {
      showToast(`登録に失敗: ${e.message}`, "error");
    }
  }

  registerForm.addEventListener("submit", registerEvent);

  // ── 再送 ─────────────────────────────────────────────────────────────────
  eventsBody.addEventListener("click", async (event) => {
    const button = event.target.closest('[data-action="retry"]');
    if (!button) return;
    const id = button.dataset.id;
    button.disabled = true;
    try {
      await api(`/api/v1/integrations/events/${encodeURIComponent(id)}/retry`, {
        method: "POST",
      });
      showToast("再送を実行しました");
      await loadEvents();
    } catch (e) {
      showToast(`再送に失敗: ${e.message}`, "error");
      button.disabled = false;
    }
  });

  // ── フィルタ・ページング ─────────────────────────────────────────────────
  $("applyFilterBtn").addEventListener("click", () => {
    offset = 0;
    loadEvents();
  });
  $("prevPageBtn").addEventListener("click", () => {
    offset = Math.max(0, offset - PAGE_SIZE);
    loadEvents();
  });
  $("nextPageBtn").addEventListener("click", () => {
    if (offset + PAGE_SIZE < lastTotal) {
      offset += PAGE_SIZE;
      loadEvents();
    }
  });

  // ── 初期化 ───────────────────────────────────────────────────────────────
  $("refreshBtn").addEventListener("click", () => loadEvents());
  $("hamburgerBtn").addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
  });

  syncEventTypeOptions();
  loadEvents();
})();
