/**
 * 統合モジュールコンソール（v0.14.0 MVP）。
 *
 * 統合元 4 リポジトリ（Civil-Construction-Management-Platform /
 * Civil-Construction-AI-Build-Platform / DX-Project-Portfolio-Atlas /
 * Civil-Material-Photo-Logger）から移行した 9 ドメインの一覧・新規作成を
 * CEOP API で操作する。トークンは SSR が hidden input へ埋め込む
 * （localStorage 不使用）。CSP は script-src 'self' のため本ファイルのみ。
 */

(() => {
  "use strict";

  const token = document.getElementById("ceopToken")?.value ?? "";
  const $ = (id) => document.getElementById(id);

  const toast = $("toast");
  const dialog = $("createDialog");
  const dialogTitle = $("dialogTitle");
  const dialogFields = $("dialogFields");
  const createForm = $("createForm");
  const refreshBtn = $("refreshBtn");

  // ── エンティティ定義（移行ドメイン）──────────────────────────────
  const ENTITIES = {
    "work-orders": {
      label: "作業指示",
      path: "/api/v1/work-orders",
      listPath: "/api/v1/work-orders",
      fields: [
        { key: "title", label: "タイトル", required: true },
        { key: "projectId", label: "案件 ID" },
        { key: "description", label: "説明" },
        { key: "status", label: "状態", type: "select", options: ["pending", "in_progress", "completed", "cancelled"] },
        { key: "dueDate", label: "期限 (YYYY-MM-DD)" },
        { key: "assigneeId", label: "担当者 ID" },
      ],
    },
    inspections: {
      label: "検査",
      path: "/api/v1/inspections",
      listPath: "/api/v1/inspections",
      fields: [
        { key: "title", label: "タイトル", required: true },
        { key: "projectId", label: "案件 ID" },
        { key: "description", label: "説明" },
        { key: "inspectedAt", label: "検査日 (YYYY-MM-DD)" },
        { key: "inspectorId", label: "検査員 ID" },
      ],
    },
    "supplier-evaluations": {
      label: "供給者評価",
      path: "/api/v1/supplier-evaluations",
      listPath: "/api/v1/supplier-evaluations",
      fields: [
        { key: "supplierName", label: "供給者名", required: true },
        { key: "supplierCode", label: "供給者コード" },
        { key: "category", label: "区分" },
        { key: "status", label: "状態", type: "select", options: ["pending", "approved", "conditional", "rejected"] },
        { key: "evaluationDate", label: "評価日 (YYYY-MM-DD)", required: true },
        { key: "score", label: "スコア (0-100)", type: "number" },
        { key: "notes", label: "備考" },
      ],
    },
    "quality-objectives": {
      label: "品質目標",
      path: "/api/v1/quality-objectives",
      listPath: "/api/v1/quality-objectives",
      fields: [
        { key: "title", label: "目標", required: true },
        { key: "description", label: "説明" },
        { key: "isoClause", label: "ISO 条項" },
        { key: "target", label: "目標指標" },
        { key: "unit", label: "単位" },
        { key: "baseline", label: "基準値", type: "number" },
        { key: "targetValue", label: "目標値", type: "number" },
        { key: "status", label: "状態", type: "select", options: ["active", "achieved", "cancelled"] },
        { key: "dueDate", label: "期限 (YYYY-MM-DD)" },
      ],
    },
    risks: {
      label: "リスク",
      path: "/api/v1/risks",
      listPath: "/api/v1/risks",
      fields: [
        { key: "title", label: "リスク", required: true },
        { key: "description", label: "説明" },
        { key: "isoClause", label: "ISO 条項" },
        { key: "likelihood", label: "可能性 (1-5)", type: "number" },
        { key: "impact", label: "影響 (1-5)", type: "number" },
        { key: "riskLevel", label: "レベル", type: "select", options: ["very_low", "low", "medium", "high", "very_high"] },
        { key: "status", label: "状態", type: "select", options: ["identified", "assessed", "mitigated", "accepted", "closed"] },
        { key: "treatmentPlan", label: "処置計画" },
      ],
    },
    "management-reviews": {
      label: "マネジメントレビュー",
      path: "/api/v1/management-reviews",
      listPath: "/api/v1/management-reviews",
      fields: [
        { key: "title", label: "タイトル", required: true },
        { key: "status", label: "状態", type: "select", options: ["scheduled", "in_progress", "completed", "cancelled"] },
        { key: "reviewDate", label: "開催日 (YYYY-MM-DD)", required: true },
        { key: "nextReviewDate", label: "次回 (YYYY-MM-DD)" },
        { key: "agenda", label: "議題" },
        { key: "outcomes", label: "結論" },
      ],
    },
    "ai-build-projects": {
      label: "AI ビルド案件",
      path: "/api/v1/ai-build-projects",
      listPath: "/api/v1/ai-build-projects",
      fields: [
        { key: "name", label: "名称", required: true },
        { key: "theme", label: "テーマ", required: true },
        { key: "purpose", label: "目的" },
        { key: "scope", label: "範囲" },
        { key: "targetUsers", label: "対象ユーザー" },
        { key: "templateVersion", label: "テンプレート版" },
        { key: "status", label: "状態", type: "select", options: ["generated", "archived", "restored", "deleted"] },
      ],
    },
    "dx-projects": {
      label: "DX 案件",
      path: "/api/v1/dx-projects",
      listPath: "/api/v1/dx-projects",
      fields: [
        { key: "slug", label: "スラッグ", required: true },
        { key: "nameJa", label: "名称（日本語）", required: true },
        { key: "nameEn", label: "名称（英語）" },
        { key: "shortName", label: "略称" },
        { key: "summary", label: "概要" },
        { key: "portfolioType", label: "種別", type: "select", options: ["internal", "external", "common", "unclassified"] },
        { key: "companyAssetUse", label: "社内資産利用", type: "select", options: ["yes", "no", "review"] },
        { key: "lifecycleState", label: "ライフサイクル", type: "select", options: ["planning", "requirements", "development", "verification", "production_ready", "production", "paused", "merging", "retired", "deleted"] },
        { key: "importance", label: "重要度 (1-5)", type: "number" },
        { key: "ownerTeam", label: "オーナーチーム" },
        { key: "approvedProgress", label: "承認進捗 (0-100)", type: "number" },
      ],
    },
    "material-photo-logs": {
      label: "材料写真ログ",
      path: "/api/v1/material-photo-logs",
      listPath: "/api/v1/material-photo-logs",
      fields: [
        { key: "projectCode", label: "案件番号", required: true },
        { key: "materialName", label: "材料名", required: true },
        { key: "materialCategory", label: "材料区分" },
        { key: "quantity", label: "数量", type: "number" },
        { key: "unit", label: "単位" },
        { key: "storagePlace", label: "置場" },
        { key: "transactionType", label: "取引種別", type: "select", options: ["received", "placed", "used", "returned"] },
        { key: "inspectionStatus", label: "検査状態", type: "select", options: ["pending", "passed", "failed", "review"] },
        { key: "memo", label: "メモ" },
      ],
    },
  };

  // 新規作成時はサーバー側の org 解決を利用するため organizationId は送らない。
  // （org スコープ付きクレデンシャルは ctx から、グローバル admin は body 必須）

  // ── API ヘルパー ─────────────────────────────────────────────────
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

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.toggle("error", isError);
    setTimeout(() => {
      toast.hidden = true;
    }, 4000);
  }

  // ── ラベルマップ ─────────────────────────────────────────────────
  const LABELS = {
    status: {
      pending: "保留中", in_progress: "進行中", completed: "完了", cancelled: "取消",
      pass: "合格", fail: "不合格",
      approved: "承認済", conditional: "条件付承認", rejected: "却下",
      active: "アクティブ", achieved: "達成", 
      identified: "識別", assessed: "評価済", mitigated: "軽減済", accepted: "受容", closed: "クローズ",
      scheduled: "予定", 
      generated: "生成済", archived: "アーカイブ", restored: "復元", deleted: "削除",
      review: "要確認",
    },
    riskLevel: {
      very_low: "極低", low: "低", medium: "中", high: "高", very_high: "極高",
    },
    portfolioType: {
      internal: "内部", external: "外部", common: "共通", unclassified: "未分類",
    },
    lifecycleState: {
      planning: "計画", requirements: "要件定義", development: "開発", verification: "検証",
      production_ready: "本番準備完了", production: "本番", paused: "一時停止",
      merging: "統合中", retired: "退役", deleted: "削除",
    },
    transactionType: {
      received: "搬入", placed: "仮置き", used: "使用", returned: "返却",
    },
    inspectionStatus: {
      pending: "未検査", passed: "合格", failed: "不合格", review: "要確認",
    },
    companyAssetUse: { yes: "利用", no: "非利用", review: "審査中" },
  };

  function label(kind, value) {
    const map = LABELS[kind];
    if (map && value in map) return map[value];
    return value ?? "—";
  }

  // ── レンダリング ─────────────────────────────────────────────────
  const renderers = {
    workOrders: (rows) =>
      rows
        .map(
          (r) => `<tr>
            <td class="cell-strong">${esc(r.title)}</td>
            <td class="cell-soft">${esc(r.projectId)}</td>
            <td><span class="badge badge-status">${esc(label("status", r.status))}</span></td>
            <td>${esc(r.dueDate ?? "—")}</td>
            <td class="cell-soft">${esc(r.assigneeId ?? "—")}</td>
          </tr>`,
        )
        .join(""),
    inspections: (rows) =>
      rows
        .map(
          (r) => `<tr>
            <td class="cell-strong">${esc(r.title)}</td>
            <td class="cell-soft">${esc(r.projectId)}</td>
            <td><span class="badge ${r.result === "pass" ? "badge-green" : r.result === "fail" ? "badge-red" : "badge-yellow"}">${esc(label("status", r.result))}</span></td>
            <td>${esc(r.inspectedAt ?? "—")}</td>
            <td class="cell-soft">${esc(String(r.checklistItems?.length ?? 0))} 項目</td>
          </tr>`,
        )
        .join(""),
    suppliers: (rows) =>
      rows
        .map(
          (r) => `<tr>
            <td class="cell-strong">${esc(r.supplierName)}</td>
            <td class="cell-soft">${esc(r.category ?? "—")}</td>
            <td><span class="badge ${r.status === "approved" ? "badge-green" : r.status === "rejected" ? "badge-red" : "badge-yellow"}">${esc(label("status", r.status))}</span></td>
            <td>${esc(r.evaluationDate)}</td>
            <td>${esc(r.score ?? "—")}</td>
            <td class="cell-soft">${esc(r.isoClause ?? "—")}</td>
          </tr>`,
        )
        .join(""),
    objectives: (rows) =>
      rows
        .map(
          (r) => `<tr>
            <td class="cell-strong">${esc(r.title)}</td>
            <td>${esc(r.baseline ?? "—")}</td>
            <td>${esc(r.targetValue ?? "—")}</td>
            <td><span class="badge ${r.status === "achieved" ? "badge-green" : r.status === "cancelled" ? "badge-red" : "badge-yellow"}">${esc(label("status", r.status))}</span></td>
            <td>${esc(r.dueDate ?? "—")}</td>
          </tr>`,
        )
        .join(""),
    risks: (rows) =>
      rows
        .map(
          (r) => `<tr>
            <td class="cell-strong">${esc(r.title)}</td>
            <td>${esc(r.likelihood)}</td>
            <td>${esc(r.impact)}</td>
            <td><span class="badge ${r.riskLevel === "very_high" || r.riskLevel === "high" ? "badge-red" : r.riskLevel === "medium" ? "badge-yellow" : "badge-green"}">${esc(label("riskLevel", r.riskLevel))}</span></td>
            <td><span class="badge badge-status">${esc(label("status", r.status))}</span></td>
          </tr>`,
        )
        .join(""),
    reviews: (rows) =>
      rows
        .map(
          (r) => `<tr>
            <td class="cell-strong">${esc(r.title)}</td>
            <td><span class="badge badge-status">${esc(label("status", r.status))}</span></td>
            <td>${esc(r.reviewDate)}</td>
            <td>${esc(r.nextReviewDate ?? "—")}</td>
            <td class="cell-soft">${esc(r.agenda ?? "—")}</td>
          </tr>`,
        )
        .join(""),
    aiBuild: (rows) =>
      rows
        .map(
          (r) => `<tr>
            <td class="cell-strong">${esc(r.name)}</td>
            <td>${esc(r.theme)}</td>
            <td><span class="badge ${r.status === "generated" ? "badge-green" : r.status === "deleted" ? "badge-red" : "badge-yellow"}">${esc(label("status", r.status))}</span></td>
            <td class="cell-soft">${esc(r.templateVersion)}</td>
            <td>${esc((r.generatedAt ?? "").slice(0, 10))}</td>
            <td>${r.placeholderChecked ? "✅" : "⚠️"}</td>
          </tr>`,
        )
        .join(""),
    dxProjects: (rows) =>
      rows
        .map(
          (r) => `<tr>
            <td><code class="cell-muted">${esc(r.slug)}</code></td>
            <td class="cell-strong">${esc(r.nameJa)}</td>
            <td class="cell-soft">${esc(label("portfolioType", r.portfolioType))}</td>
            <td><span class="badge badge-status">${esc(label("lifecycleState", r.lifecycleState))}</span></td>
            <td>${"★".repeat(r.importance ?? 0)}</td>
            <td>${esc(r.approvedProgress ?? "—")}%</td>
            <td class="cell-soft">${esc(r.ownerTeam ?? "—")}</td>
          </tr>`,
        )
        .join(""),
    photoLogs: (rows) =>
      rows
        .map(
          (r) => `<tr>
            <td><code class="cell-muted">${esc(r.projectCode)}</code></td>
            <td class="cell-strong">${esc(r.materialName)}</td>
            <td>${esc(r.quantity ?? "—")} ${esc(r.unit ?? "")}</td>
            <td class="cell-soft">${esc(r.storagePlace ?? "—")}</td>
            <td class="cell-soft">${esc(label("transactionType", r.transactionType))}</td>
            <td><span class="badge ${r.inspectionStatus === "passed" ? "badge-green" : r.inspectionStatus === "failed" ? "badge-red" : "badge-yellow"}">${esc(label("inspectionStatus", r.inspectionStatus))}</span></td>
            <td>${r.needsReview ? "⚠️" : "—"}</td>
          </tr>`,
        )
        .join(""),
  };

  const loaders = {
    "work-orders": async () => {
      const data = await api("/api/v1/work-orders");
      $("workOrdersBody").innerHTML = renderers.workOrders(data.workOrders ?? []);
      $("workOrdersEmpty").hidden = (data.workOrders ?? []).length > 0;
    },
    inspections: async () => {
      const data = await api("/api/v1/inspections");
      $("inspectionsBody").innerHTML = renderers.inspections(data.inspections ?? []);
      $("inspectionsEmpty").hidden = (data.inspections ?? []).length > 0;
    },
    "supplier-evaluations": async () => {
      const data = await api("/api/v1/supplier-evaluations");
      $("suppliersBody").innerHTML = renderers.suppliers(data.supplierEvaluations ?? []);
      $("suppliersEmpty").hidden = (data.supplierEvaluations ?? []).length > 0;
    },
    "quality-objectives": async () => {
      const data = await api("/api/v1/quality-objectives");
      $("objectivesBody").innerHTML = renderers.objectives(data.qualityObjectives ?? []);
      $("objectivesEmpty").hidden = (data.qualityObjectives ?? []).length > 0;
    },
    risks: async () => {
      const data = await api("/api/v1/risks");
      $("risksBody").innerHTML = renderers.risks(data.risks ?? []);
      $("risksEmpty").hidden = (data.risks ?? []).length > 0;
    },
    "management-reviews": async () => {
      const data = await api("/api/v1/management-reviews");
      $("reviewsBody").innerHTML = renderers.reviews(data.managementReviews ?? []);
      $("reviewsEmpty").hidden = (data.managementReviews ?? []).length > 0;
    },
    "ai-build-projects": async () => {
      const data = await api("/api/v1/ai-build-projects");
      $("aiBuildBody").innerHTML = renderers.aiBuild(data.aiBuildProjects ?? []);
      $("aiBuildEmpty").hidden = (data.aiBuildProjects ?? []).length > 0;
    },
    "dx-projects": async () => {
      const data = await api("/api/v1/dx-projects");
      $("dxProjectsBody").innerHTML = renderers.dxProjects(data.dxProjects ?? []);
      $("dxProjectsEmpty").hidden = (data.dxProjects ?? []).length > 0;
    },
    "material-photo-logs": async () => {
      const data = await api("/api/v1/material-photo-logs");
      $("photoLogsBody").innerHTML = renderers.photoLogs(data.materialPhotoLogs ?? []);
      $("photoLogsEmpty").hidden = (data.materialPhotoLogs ?? []).length > 0;
    },
  };

  async function loadAll() {
    const jobs = Object.values(loaders).map((fn) =>
      fn().catch((e) => showToast(`読み込み失敗: ${e.message}`, true)),
    );
    await Promise.all(jobs);
  }

  // ── タブ切替 ─────────────────────────────────────────────────────
  function activateTab(tab) {
    document.querySelectorAll(".tab-panel").forEach((el) => {
      el.hidden = el.id !== `tab-${tab}`;
    });
    document.querySelectorAll(".nav-tab").forEach((el) => {
      el.classList.toggle("active", el.dataset.tab === tab);
    });
  }

  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  // ── 新規作成ダイアログ ───────────────────────────────────────────
  let createTarget = null;

  function openCreate(entityKey) {
    const def = ENTITIES[entityKey];
    if (!def) return;
    createTarget = entityKey;
    dialogTitle.textContent = `新規作成 — ${def.label}`;
    dialogFields.innerHTML = def.fields
      .map((f) => {
        const required = f.required ? "required" : "";
        if (f.type === "select") {
          const options = f.options
            .map((o) => `<option value="${esc(o)}">${esc(label(f.key === "status" ? "status" : f.key, o))}</option>`)
            .join("");
          return `<div class="dialog-field"><label>${esc(f.label)}</label><select name="${esc(f.key)}" ${required}>${options}</select></div>`;
        }
        const type = f.type === "number" ? "number" : "text";
        return `<div class="dialog-field"><label>${esc(f.label)}</label><input name="${esc(f.key)}" type="${type}" ${required}></div>`;
      })
      .join("");
    dialog.showModal();
  }

  createForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!createTarget) return;
    const def = ENTITIES[createTarget];
    const body = {};
    for (const f of def.fields) {
      const input = createForm.elements[f.key];
      if (!input) continue;
      const value = input.value.trim();
      if (value === "") continue;
      body[f.key] = f.type === "number" ? Number(value) : value;
    }
    try {
      await api(def.path, { method: "POST", body: JSON.stringify(body) });
      dialog.close();
      showToast(`${def.label}を作成しました`);
      await loaders[createTarget]();
    } catch (err) {
      showToast(`作成失敗: ${err.message}`, true);
    }
  });

  $("dialogCancel").addEventListener("click", () => dialog.close());

  document.querySelectorAll("[data-create]").forEach((btn) => {
    btn.addEventListener("click", () => openCreate(btn.dataset.create));
  });

  // ── CSV 出力 ─────────────────────────────────────────────────────
  $("csvExportBtn").addEventListener("click", async () => {
    try {
      const res = await fetch("/api/v1/material-photo-logs/export.csv", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "material-photo-logs.csv";
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      showToast("CSV を出力しました");
    } catch (err) {
      showToast(`CSV 出力失敗: ${err.message}`, true);
    }
  });

  refreshBtn.addEventListener("click", () => loadAll().then(() => showToast("更新しました")));

  // ── 初期化 ───────────────────────────────────────────────────────
  loadAll();
})();
