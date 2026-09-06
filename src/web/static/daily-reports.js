/**
 * 日報管理コンソール（v0.12.0 MVP）。
 *
 * 案件選択 → 日報一覧 → 作成/編集 → 提出/承認 を CEOP API で行う。
 * トークンは SSR が hidden input へ埋め込む（localStorage 不使用）。
 * CSP は script-src 'self' のため、本ファイルのみで実装する。
 */

(() => {
  "use strict";

  const token = document.getElementById("ceopToken")?.value ?? "";
  const $ = (id) => document.getElementById(id);

  const projectSelect = $("projectSelect");
  const newReportBtn = $("newReportBtn");
  const reportsSection = $("reportsSection");
  const reportsTableBody = $("reportsTableBody");
  const reportsEmpty = $("reportsEmpty");
  const toast = $("toast");

  const dialog = $("reportDialog");
  const dialogTitle = $("dialogTitle");
  const dialogClose = $("dialogClose");
  const dialogCancel = $("dialogCancel");
  const reportForm = $("reportForm");

  let projects = [];
  let currentProjectId = "";
  let reports = [];
  let queuedReports = [];

  // ── オフライン日報スプール（IndexedDB） ─────────────────────────────────
  // 電波なし環境での日報作成に対応する（issue #72）。新規日報の送信が
  // ネットワーク断で失敗した場合、この端末の IndexedDB に下書きを退避し、
  // `online` イベント発火時に自動で再送信する。編集・提出・承認は既存の
  // オンライン専用フローのまま（オフライン中はエラー表示に留める）。
  const OFFLINE_DB_NAME = "ceop-daily-reports-offline";
  const OFFLINE_DB_VERSION = 1;
  const OFFLINE_STORE = "pending-reports";

  /** fetch自体が失敗した（オフライン）ことを表す軽量な例外。 */
  class OfflineSubmitError extends Error {
    constructor() {
      super("offline");
      this.name = "OfflineSubmitError";
    }
  }

  function openOfflineDb() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("この端末はオフライン保存に対応していません"));
        return;
      }
      const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
          db.createObjectStore(OFFLINE_STORE, { keyPath: "localId" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDBを開けませんでした"));
    });
  }

  async function queueOfflineReport(entry) {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE, "readwrite");
      tx.objectStore(OFFLINE_STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("下書きの保存に失敗しました"));
    });
  }

  async function getQueuedReports(projectIdFilter) {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE, "readonly");
      const request = tx.objectStore(OFFLINE_STORE).getAll();
      request.onsuccess = () => {
        const all = request.result ?? [];
        resolve(
          projectIdFilter ? all.filter((entry) => entry.projectId === projectIdFilter) : all,
        );
      };
      request.onerror = () => reject(request.error ?? new Error("下書きの取得に失敗しました"));
    });
  }

  async function removeQueuedReport(localId) {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE, "readwrite");
      tx.objectStore(OFFLINE_STORE).delete(localId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("下書きの削除に失敗しました"));
    });
  }

  /** 現在の案件に紐づくキューを再読込し、一覧を再描画する。 */
  async function refreshQueuedReports() {
    queuedReports = await getQueuedReports(currentProjectId).catch(() => []);
    renderReports();
  }

  /** キューにある未送信の日報をサーバーへ再送信する（オンライン復帰時）。 */
  async function flushQueuedReports() {
    if (!currentProjectId || !navigator.onLine) return;
    const queue = await getQueuedReports(currentProjectId).catch(() => []);
    if (queue.length === 0) return;
    let sentCount = 0;
    for (const entry of queue) {
      try {
        await api(`/api/v1/projects/${encodeURIComponent(entry.projectId)}/daily-reports`, {
          method: "POST",
          body: JSON.stringify(entry.payload),
        });
        await removeQueuedReport(entry.localId);
        sentCount += 1;
      } catch (e) {
        if (e instanceof TypeError) {
          // まだオフライン（復帰イベントの誤検知など）。残りは次回に回す。
          break;
        }
        // サーバー側の検証エラー等 — このエントリはスキップし、他は続行する。
      }
    }
    if (sentCount > 0) {
      showToast(`オフラインで保存した日報 ${sentCount} 件を送信しました`);
    }
    if (currentProjectId) {
      await loadReports(currentProjectId).catch(() => {});
    }
  }

  window.addEventListener("online", () => {
    flushQueuedReports().catch(() => {
      /* 次の online イベントか手動更新で再試行される */
    });
  });

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
      throw new Error(detail);
    }
    return res.status === 204 ? null : res.json();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    setTimeout(() => {
      toast.hidden = true;
    }, 4000);
  }

  // ── 案件・日報の読み込み ─────────────────────────────────────────────────
  const STATUS_LABELS = {
    planning: "計画中",
    in_progress: "進行中",
    completed: "完了",
    suspended: "中断",
    cancelled: "取消",
  };

  async function loadProjects() {
    const data = await api("/api/v1/projects");
    projects = data.projects;
    // ステータス順（進行中 → 計画 → 完了 → 中断 → 取消）で optgroup に分類。
    const order = ["in_progress", "planning", "completed", "suspended", "cancelled"];
    const groups = new Map();
    for (const p of projects) {
      const status = STATUS_LABELS[p.status] ?? p.status ?? "その他";
      if (!groups.has(status)) groups.set(status, []);
      groups.get(status).push(p);
    }
    // 選択肢を「コード — 案件名（予算）」の形式で見やすく表示。
    const optionsHtml = Array.from(groups.entries())
      .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(
        ([status, list]) =>
          `<optgroup label="${escapeHtml(status)}（${list.length}件）">` +
          list
            .map(
              (p) =>
                `<option value="${escapeHtml(p.id)}">${escapeHtml(p.projectCode)} — ${escapeHtml(p.name)}${
                  p.budget !== undefined ? `（予算 ¥${Number(p.budget).toLocaleString("ja-JP")}）` : ""
                }</option>`,
            )
            .join("") +
          "</optgroup>",
      )
      .join("");
    projectSelect.innerHTML =
      '<option value="">案件を選択してください</option>' + optionsHtml;
  }

  async function loadReports(projectId) {
    const data = await api(`/api/v1/projects/${encodeURIComponent(projectId)}/daily-reports`);
    reports = data.dailyReports;
    queuedReports = await getQueuedReports(projectId).catch(() => []);
    renderReports();
  }

  function renderReports() {
    reportsSection.hidden = false;
    reportsEmpty.hidden = reports.length > 0 || queuedReports.length > 0;
    const queuedRowsHtml = queuedReports
      .map(
        (q) => `
          <tr data-local-id="${escapeHtml(q.localId)}" class="row-queued">
            <td>${escapeHtml(q.payload.reportDate ?? "")}</td>
            <td>${weatherLabel(q.payload.weather)}</td>
            <td>${q.payload.workerCount ?? 0}</td>
            <td>${escapeHtml(q.payload.workContent ?? "—")}</td>
            <td>${q.payload.progressRate !== undefined ? `${escapeHtml(String(q.payload.progressRate))}%` : "—"}</td>
            <td>${q.payload.safetyCheck ? "✅" : "⚠️"}</td>
            <td><span class="badge badge-muted" title="オンライン復帰後に自動送信されます">🔄 同期待ち（オフライン保存）</span></td>
            <td class="row-actions">
              <button class="btn btn-sm" data-action="cancel-queue">取消</button>
            </td>
          </tr>`,
      )
      .join("");
    const reportRowsHtml = reports
      .map(
        (r) => `
          <tr data-id="${escapeHtml(r.id)}">
            <td>${escapeHtml(r.reportDate)}</td>
            <td>${weatherLabel(r.weather)}</td>
            <td>${r.workerCount ?? 0}</td>
            <td>${escapeHtml(r.workContent ?? "—")}</td>
            <td>${r.progressRate !== undefined ? `${escapeHtml(String(r.progressRate))}%` : "—"}</td>
            <td>${r.safetyCheck ? "✅" : "⚠️"}</td>
            <td><span class="badge badge-status">${statusLabel(r.status)}</span></td>
            <td class="row-actions">
              ${r.status !== "approved" ? `<button class="btn btn-sm" data-action="edit">編集</button>` : ""}
              ${r.status === "draft" ? `<button class="btn btn-sm" data-action="submit">提出</button>` : ""}
              ${r.status === "submitted" ? `<button class="btn btn-sm btn-primary" data-action="approve">承認</button>` : ""}
            </td>
          </tr>`,
      )
      .join("");
    reportsTableBody.innerHTML = queuedRowsHtml + reportRowsHtml;
  }

  function weatherLabel(weather) {
    return (
      {
        sunny: "晴れ",
        cloudy: "曇り",
        rainy: "雨",
        snowy: "雪",
      }[weather] ?? "—"
    );
  }

  function statusLabel(status) {
    return (
      {
        draft: "下書き",
        submitted: "提出済み",
        approved: "承認済み",
      }[status] ?? escapeHtml(status)
    );
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── ダイアログ ───────────────────────────────────────────────────────────
  function openDialog(report = null) {
    dialogTitle.textContent = report ? "日報を編集" : "新規日報";
    $("reportId").value = report?.id ?? "";
    $("reportDate").value = report?.reportDate ?? new Date().toISOString().slice(0, 10);
    $("reportWeather").value = report?.weather ?? "sunny";
    $("reportTemperature").value = report?.temperature ?? "";
    $("reportWorkerCount").value = report?.workerCount ?? 0;
    $("reportProgressRate").value = report?.progressRate ?? "";
    $("reportWorkContent").value = report?.workContent ?? "";
    $("reportIssues").value = report?.issues ?? "";
    $("reportSafetyCheck").checked = report?.safetyCheck ?? false;
    $("reportSafetyNotes").value = report?.safetyNotes ?? "";
    dialog.hidden = false;
    $("reportDate").focus();
  }

  function closeDialog() {
    dialog.hidden = true;
  }

  async function saveReport(event) {
    event.preventDefault();
    if (!currentProjectId) return;
    const id = $("reportId").value;
    const payload = {
      reportDate: $("reportDate").value,
      weather: $("reportWeather").value,
      temperature: $("reportTemperature").value === "" ? undefined : Number($("reportTemperature").value),
      workerCount: Number($("reportWorkerCount").value),
      workContent: $("reportWorkContent").value || undefined,
      issues: $("reportIssues").value || undefined,
      safetyCheck: $("reportSafetyCheck").checked,
      safetyNotes: $("reportSafetyNotes").value || undefined,
      progressRate:
        $("reportProgressRate").value === "" ? undefined : Number($("reportProgressRate").value),
    };
    try {
      if (id) {
        // 既存日報の編集はオフライン非対応（サーバー側の最新状態が前提のため）。
        await api(`/api/v1/daily-reports/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        showToast("日報を更新しました");
        closeDialog();
        await loadReports(currentProjectId);
        return;
      }
      if (!navigator.onLine) {
        throw new OfflineSubmitError();
      }
      await api(`/api/v1/projects/${encodeURIComponent(currentProjectId)}/daily-reports`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("日報を登録しました");
      closeDialog();
      await loadReports(currentProjectId);
    } catch (e) {
      // 新規日報のみオフラインスプール対象。fetch自体が失敗した場合
      // (TypeError) と、navigator.onLine が false だった場合の両方を拾う。
      if (!id && (e instanceof TypeError || e instanceof OfflineSubmitError)) {
        try {
          await queueOfflineReport({
            localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            projectId: currentProjectId,
            payload,
            queuedAt: new Date().toISOString(),
          });
          showToast("オフラインのため日報を端末に保存しました。オンライン復帰後に自動送信します");
          closeDialog();
          await refreshQueuedReports();
        } catch (queueError) {
          showToast(`オフライン保存に失敗: ${queueError.message}`);
        }
        return;
      }
      showToast(`保存に失敗: ${e.message}`);
    }
  }

  async function transitionReport(id, status) {
    try {
      await api(`/api/v1/daily-reports/${encodeURIComponent(id)}/transition`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      showToast(`状態を「${statusLabel(status)}」に変更しました`);
      await loadReports(currentProjectId);
    } catch (e) {
      showToast(`状態変更に失敗: ${e.message}`);
    }
  }

  // ── イベント ─────────────────────────────────────────────────────────────
  projectSelect.addEventListener("change", async () => {
    currentProjectId = projectSelect.value;
    newReportBtn.disabled = !currentProjectId;
    // 選択中の案件ステータスをチップで表示。
    const chip = document.getElementById("projectStatusChip");
    const selected = projects.find((p) => p.id === currentProjectId);
    if (selected) {
      chip.textContent = STATUS_LABELS[selected.status] ?? selected.status ?? "";
      chip.className = `project-status-chip ${selected.status ?? ""}`;
      chip.hidden = false;
    } else if (chip) {
      chip.hidden = true;
    }
    if (currentProjectId) {
      try {
        await loadReports(currentProjectId);
        // 案件を切り替えた時点でオンラインなら、その案件の未送信キューを
        // 直ちに再送信しておく（オフライン中に作成し、後で戻ってきた場合）。
        await flushQueuedReports();
      } catch (e) {
        showToast(`日報の取得に失敗: ${e.message}`);
      }
    } else {
      reportsSection.hidden = true;
    }
  });

  newReportBtn.addEventListener("click", () => openDialog());
  dialogClose.addEventListener("click", closeDialog);
  dialogCancel.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dialog.hidden) closeDialog();
  });
  reportForm.addEventListener("submit", saveReport);

  reportsTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const row = button.closest("tr");
    const action = button.dataset.action;
    if (action === "cancel-queue") {
      const localId = row?.dataset.localId;
      if (!localId) return;
      removeQueuedReport(localId)
        .then(() => {
          showToast("オフライン保存の下書きを取り消しました");
          return refreshQueuedReports();
        })
        .catch((e) => showToast(`取消に失敗: ${e.message}`));
      return;
    }
    const id = row?.dataset.id;
    if (!id) return;
    if (action === "edit") {
      openDialog(reports.find((r) => r.id === id) ?? null);
    } else if (action === "submit" || action === "approve") {
      transitionReport(id, action === "submit" ? "submitted" : "approved");
    }
  });

  $("refreshBtn").addEventListener("click", async () => {
    if (currentProjectId) {
      try {
        await loadReports(currentProjectId);
        showToast("一覧を更新しました");
      } catch (e) {
        showToast(`更新に失敗: ${e.message}`);
      }
    } else {
      await loadProjects();
    }
  });

  $("hamburgerBtn").addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
  });

  // ── 初期化 ───────────────────────────────────────────────────────────────
  loadProjects().catch((e) => showToast(`案件の取得に失敗: ${e.message}`));
})();
