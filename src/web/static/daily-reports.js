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
  async function loadProjects() {
    const data = await api("/api/v1/projects");
    projects = data.projects;
    projectSelect.innerHTML =
      '<option value="">案件を選択してください</option>' +
      projects
        .map(
          (p) =>
            `<option value="${escapeHtml(p.id)}">${escapeHtml(p.projectCode)} — ${escapeHtml(p.name)}</option>`,
        )
        .join("");
  }

  async function loadReports(projectId) {
    const data = await api(`/api/v1/projects/${encodeURIComponent(projectId)}/daily-reports`);
    reports = data.dailyReports;
    renderReports();
  }

  function renderReports() {
    reportsSection.hidden = false;
    reportsEmpty.hidden = reports.length > 0;
    reportsTableBody.innerHTML = reports
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
        await api(`/api/v1/daily-reports/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        showToast("日報を更新しました");
      } else {
        await api(`/api/v1/projects/${encodeURIComponent(currentProjectId)}/daily-reports`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("日報を登録しました");
      }
      closeDialog();
      await loadReports(currentProjectId);
    } catch (e) {
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
    if (currentProjectId) {
      try {
        await loadReports(currentProjectId);
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
    const id = row?.dataset.id;
    if (!id) return;
    const action = button.dataset.action;
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
