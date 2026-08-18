/* ─────────────────────────────────────────────────────────────
   CEOP ISO 統合マネジメントコンソール
   CSP-safe: インライン処理なし・ユーザー値はエスケープして描画
   ───────────────────────────────────────────────────────────── */

(() => {
  "use strict";

  const TOKEN_EL = document.getElementById("ceopToken");
  const API_TOKEN = TOKEN_EL && TOKEN_EL.value ? TOKEN_EL.value : "";

  const DOMAINS = [
    {
      id: "quality",
      label: "品質 (ISO 9001)",
      kinds: ["quality-plan", "quality-inspection", "nonconformity"],
    },
    {
      id: "environment",
      label: "環境 (ISO 14001)",
      kinds: ["environmental-aspect", "legal-requirement", "waste-record"],
    },
    {
      id: "safety",
      label: "安全 (ISO 45001)",
      kinds: [
        "hazard",
        "near-miss",
        "safety-education",
        "toolbox-talk",
        "safety-inspection",
        "safety-incident",
      ],
    },
    {
      id: "assets",
      label: "資産 (ISO 55001)",
      kinds: [
        "asset",
        "asset-maintenance-plan",
        "asset-inspection",
        "asset-risk-assessment",
        "asset-disposal",
        "asset-handover",
      ],
    },
    {
      id: "bim",
      label: "BIM/CIM (ISO 19650)",
      kinds: ["bim-eir", "bim-bep", "bim-container", "bim-coordination-issue"],
    },
    {
      id: "audit",
      label: "監査・是正",
      kinds: ["audit-plan", "audit-finding", "corrective-action"],
    },
    {
      id: "isms",
      label: "ISMS (ISO 27001)",
      kinds: ["isms-asset", "isms-threat", "isms-risk-assessment", "isms-incident"],
    },
    { id: "bcp", label: "事業継続 (BCP)", kinds: ["bcp-plan", "bcp-risk-scenario", "bcp-drill"] },
  ];

  const KIND_LABELS = {
    "quality-plan": "品質計画",
    "quality-inspection": "品質検査",
    nonconformity: "不適合",
    "environmental-aspect": "環境側面",
    "legal-requirement": "法的要求",
    "waste-record": "廃棄物記録",
    hazard: "危険源",
    "near-miss": "ヒヤリハット",
    "safety-education": "安全教育",
    "toolbox-talk": "KY活動",
    "safety-inspection": "安全パトロール",
    "safety-incident": "事故・インシデント",
    asset: "資産台帳",
    "asset-maintenance-plan": "保全計画",
    "asset-inspection": "資産点検",
    "asset-risk-assessment": "資産リスク評価",
    "asset-disposal": "資産廃棄",
    "asset-handover": "資産引渡し",
    "bim-eir": "EIR",
    "bim-bep": "BEP",
    "bim-container": "情報コンテナ",
    "bim-coordination-issue": "調整課題",
    "audit-plan": "監査計画",
    "audit-finding": "監査指摘",
    "corrective-action": "是正処置",
    "isms-asset": "情報資産",
    "isms-threat": "セキュリティ脅威",
    "isms-risk-assessment": "リスク評価",
    "isms-incident": "セキュリティインシデント",
    "bcp-plan": "BCP計画",
    "bcp-risk-scenario": "リスクシナリオ",
    "bcp-drill": "訓練記録",
  };

  const state = {
    tab: "analytics",
    kinds: [],
    records: [],
    editingId: null,
    actionId: null,
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showToast(msg, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className =
      "toast" + (type === "error" ? " error" : type === "success" ? " success" : "");
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity .3s";
    }, 2800);
    setTimeout(() => toast.remove(), 3200);
  }

  function authHeaders(extra = {}) {
    const headers = { ...extra };
    if (API_TOKEN) headers["Authorization"] = `Bearer ${API_TOKEN}`;
    return headers;
  }

  async function api(method, path, body) {
    const res = await fetch(path, {
      method,
      headers: {
        ...authHeaders(),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = json.message || json.error || `HTTP ${res.status}`;
      throw new Error(message);
    }
    return json;
  }

  function setActiveTab(tab) {
    state.tab = tab;
    document.querySelectorAll(".iso-tab").forEach((el) => {
      el.classList.toggle("active", el.dataset.tab === tab);
    });
    const analyticsSection = document.getElementById("analyticsSection");
    const recordsSection = document.getElementById("recordsSection");
    const integrationsSection = document.getElementById("integrationsSection");
    const toolbar = document.getElementById("isoToolbar");
    analyticsSection.hidden = tab !== "analytics";
    integrationsSection.hidden = tab !== "integrations";
    if (tab === "analytics") {
      recordsSection.hidden = true;
      toolbar.hidden = true;
      document.getElementById("pageTitle").textContent = "ISO 分析ダッシュボード";
      document.getElementById("pageSubtitle").textContent =
        "Civil-Construction-IMS 吸収 — 日常業務をそのまま ISO 運用に";
      loadAnalytics();
    } else if (tab === "integrations") {
      recordsSection.hidden = true;
      toolbar.hidden = true;
      document.getElementById("pageTitle").textContent = "連携先システム";
      document.getElementById("pageSubtitle").textContent =
        "Webhook 受信・イベントキュー・契約定義（疎結合連携）";
      loadContracts();
    } else {
      const domain = DOMAINS.find((d) => d.id === tab);
      state.kinds = domain ? domain.kinds : [];
      recordsSection.hidden = false;
      toolbar.hidden = false;
      document.getElementById("pageTitle").textContent = domain ? domain.label : tab;
      document.getElementById("pageSubtitle").textContent =
        "全レコードは CEOP の認証・監査・組織スコープで保護されます";
      populateKindSelect();
      loadRecords();
    }
  }

  function populateKindSelect() {
    const select = document.getElementById("isoKindSelect");
    select.innerHTML = "";
    state.kinds.forEach((kind) => {
      const option = document.createElement("option");
      option.value = kind;
      option.textContent = KIND_LABELS[kind] || kind;
      select.appendChild(option);
    });
    const formSelect = document.getElementById("isoFormKind");
    formSelect.innerHTML = "";
    state.kinds.forEach((kind) => {
      const option = document.createElement("option");
      option.value = kind;
      option.textContent = KIND_LABELS[kind] || kind;
      formSelect.appendChild(option);
    });
  }

  function statusClass(status) {
    if (["closed", "completed", "published", "approved"].includes(status)) return "badge-green";
    if (["open", "pending", "draft", "planned"].includes(status)) return "badge-yellow";
    if (["cancelled", "rejected", "withdrawn", "fail"].includes(status)) return "badge-red";
    return "badge";
  }

  function renderRecords() {
    const body = document.getElementById("isoTableBody");
    const statusFilter = document.getElementById("isoStatusFilter").value;
    const search = document.getElementById("isoSearch").value.trim().toLowerCase();
    const kindFilter = document.getElementById("isoKindSelect").value;
    let rows = state.records;
    if (kindFilter) rows = rows.filter((r) => r.kind === kindFilter);
    if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
    if (search) {
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          (r.number || "").toLowerCase().includes(search) ||
          JSON.stringify(r.payload).toLowerCase().includes(search),
      );
    }
    document.getElementById("recordsTitle").textContent = `レコード一覧（${rows.length} 件）`;
    body.innerHTML = "";
    if (rows.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.className = "cell-muted empty-cell";
      td.textContent = "レコードが見つかりません";
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }
    rows.forEach((record) => {
      const tr = document.createElement("tr");
      const cells = [
        record.number || `<span class="cell-muted">—</span>`,
        `<span class="cell-strong">${escapeHtml(record.title)}</span><div class="cell-muted">${escapeHtml(
          KIND_LABELS[record.kind] || record.kind,
        )}</div>`,
        `<span class="badge ${statusClass(record.status)}">${escapeHtml(record.status)}</span>`,
        escapeHtml(record.projectId || "—"),
        escapeHtml(record.updatedAt ? new Date(record.updatedAt).toLocaleString("ja-JP") : "—"),
        `<button class="btn btn-sm" data-edit="${record.id}">編集</button> ` +
          `<button class="btn btn-sm" data-action="${record.id}">状態遷移</button> ` +
          `<button class="btn btn-sm btn-secondary" data-delete="${record.id}">削除</button>`,
      ];
      cells.forEach((html) => {
        const td = document.createElement("td");
        td.innerHTML = html;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  async function loadRecords() {
    try {
      const collected = [];
      for (const kind of state.kinds) {
        const json = await api("GET", `/api/v1/iso?kind=${encodeURIComponent(kind)}&limit=200`);
        collected.push(...(json.isoRecords || []));
      }
      state.records = collected;
      const statuses = [...new Set(collected.map((r) => r.status))];
      const statusSelect = document.getElementById("isoStatusFilter");
      const previous = statusSelect.value;
      statusSelect.innerHTML = '<option value="">全ステータス</option>';
      statuses.forEach((s) => {
        const option = document.createElement("option");
        option.value = s;
        option.textContent = s;
        statusSelect.appendChild(option);
      });
      statusSelect.value = previous;
      renderRecords();
    } catch (e) {
      showToast(`一覧の取得に失敗: ${e.message}`, "error");
    }
  }

  async function loadAnalytics() {
    try {
      const json = await api("GET", "/api/v1/iso/analytics");
      const analytics = json.analytics || {};
      const grid = document.getElementById("isoAnalyticsGrid");
      grid.innerHTML = "";
      Object.entries(analytics.byKind || {})
        .sort((a, b) => b[1] - a[1])
        .forEach(([kind, count]) => {
          const card = document.createElement("div");
          card.className = "stat-card";
          card.innerHTML = `
            <div class="stat-label">${escapeHtml(KIND_LABELS[kind] || kind)}</div>
            <div class="stat-value">${Number(count)}</div>
            <div class="stat-sub">ISO レコード</div>
          `;
          grid.appendChild(card);
        });
      const statusGrid = document.getElementById("isoStatusGrid");
      statusGrid.innerHTML = "";
      Object.entries(analytics.byStatus || {})
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
          const span = document.createElement("span");
          span.className = `badge ${statusClass(status)}`;
          span.style.margin = "4px";
          span.textContent = `${status}: ${Number(count)}`;
          statusGrid.appendChild(span);
        });
    } catch (e) {
      showToast(`分析の取得に失敗: ${e.message}`, "error");
    }
  }

  async function loadContracts() {
    try {
      const json = await api("GET", "/api/v1/integrations/contracts");
      const body = document.getElementById("contractsBody");
      body.innerHTML = "";
      (json.contracts || []).forEach((contract) => {
        const row = document.createElement("div");
        row.style.cssText = "padding:12px 0;border-bottom:1px solid #eef1f5;font-size:13px;";
        row.innerHTML = `
          <div class="cell-strong">${escapeHtml(contract.label)}</div>
          <div class="cell-muted">
            version=${escapeHtml(contract.version)} · auth=${escapeHtml(contract.auth)} ·
            timeout=${Number(contract.timeoutMs)}ms · retries=${Number(contract.maxRetries)} ·
            idempotency=${escapeHtml(contract.idempotency)} · failure=${escapeHtml(contract.failureMode)}
          </div>
          <div class="cell-muted">inbound: ${escapeHtml(contract.inboundPath)}</div>
        `;
        body.appendChild(row);
      });
    } catch (e) {
      showToast(`契約定義の取得に失敗: ${e.message}`, "error");
    }
  }

  function openDialog(record) {
    state.editingId = record ? record.id : null;
    document.getElementById("isoDialogTitle").textContent = record ? "レコード編集" : "新規作成";
    document.getElementById("isoFormTitle").value = record ? record.title : "";
    document.getElementById("isoFormNumber").value = record ? record.number || "" : "";
    document.getElementById("isoFormProjectId").value = record ? record.projectId || "" : "";
    document.getElementById("isoFormParentId").value = record ? record.parentId || "" : "";
    document.getElementById("isoFormStatus").value = record ? record.status : "";
    document.getElementById("isoFormPayload").value = record
      ? JSON.stringify(record.payload || {}, null, 2)
      : "{}";
    populateStatusOptions(record ? record.status : "");
    if (record) {
      const formKind = document.getElementById("isoFormKind");
      formKind.value = record.kind;
    }
    document.getElementById("isoDialogOverlay").hidden = false;
    document.getElementById("isoDialogTitle").focus();
  }

  function populateStatusOptions(selected) {
    const select = document.getElementById("isoFormStatus");
    select.innerHTML = '<option value="">（既定）</option>';
    [
      "draft",
      "under_review",
      "approved",
      "published",
      "open",
      "in_progress",
      "pending_verification",
      "closed",
      "cancelled",
      "planned",
      "pending",
      "pass",
      "fail",
      "conditional_pass",
      "active",
      "inactive",
      "under_maintenance",
      "disposed",
      "work_in_progress",
      "shared",
      "archived",
      "not_initiated",
      "completed",
    ].forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      if (status === selected) option.selected = true;
      select.appendChild(option);
    });
  }

  function closeDialog() {
    document.getElementById("isoDialogOverlay").hidden = true;
    state.editingId = null;
  }

  async function saveDialog() {
    const kind = document.getElementById("isoFormKind").value;
    const title = document.getElementById("isoFormTitle").value.trim();
    if (!title) {
      showToast("タイトルは必須です", "error");
      return;
    }
    let payload = {};
    try {
      payload = JSON.parse(document.getElementById("isoFormPayload").value || "{}");
    } catch {
      showToast("業務項目が有効な JSON ではありません", "error");
      return;
    }
    const body = {
      kind,
      title,
      payload,
      ...(document.getElementById("isoFormNumber").value
        ? { number: document.getElementById("isoFormNumber").value.trim() }
        : {}),
      ...(document.getElementById("isoFormProjectId").value
        ? { projectId: document.getElementById("isoFormProjectId").value.trim() }
        : {}),
      ...(document.getElementById("isoFormParentId").value
        ? { parentId: document.getElementById("isoFormParentId").value.trim() }
        : {}),
      ...(document.getElementById("isoFormStatus").value
        ? { status: document.getElementById("isoFormStatus").value }
        : {}),
    };
    try {
      if (state.editingId) {
        await api("PUT", `/api/v1/iso/${state.editingId}`, { payload });
        showToast("更新しました", "success");
      } else {
        await api("POST", "/api/v1/iso", body);
        showToast("作成しました", "success");
      }
      closeDialog();
      await loadRecords();
      if (state.tab === "analytics") await loadAnalytics();
    } catch (e) {
      showToast(`保存に失敗: ${e.message}`, "error");
    }
  }

  function openActionDialog(id) {
    state.actionId = id;
    document.getElementById("isoActionOverlay").hidden = false;
  }

  async function applyAction() {
    const action = document.getElementById("isoActionSelect").value;
    try {
      await api("POST", `/api/v1/iso/${state.actionId}/action`, { action });
      showToast("状態遷移を実行しました", "success");
      document.getElementById("isoActionOverlay").hidden = true;
      await loadRecords();
      if (state.tab === "analytics") await loadAnalytics();
    } catch (e) {
      showToast(`状態遷移に失敗: ${e.message}`, "error");
    }
  }

  function init() {
    document.querySelectorAll(".iso-tab").forEach((el) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();
        setActiveTab(el.dataset.tab);
      });
    });
    document.getElementById("isoSearch").addEventListener("input", renderRecords);
    document.getElementById("isoStatusFilter").addEventListener("change", renderRecords);
    document.getElementById("isoKindSelect").addEventListener("change", renderRecords);
    document.getElementById("isoNewBtn").addEventListener("click", () => openDialog(null));
    document.getElementById("isoReloadBtn").addEventListener("click", loadRecords);
    document.getElementById("isoDialogCancel").addEventListener("click", closeDialog);
    document.getElementById("isoDialogSave").addEventListener("click", saveDialog);
    document.getElementById("isoActionCancel").addEventListener("click", () => {
      document.getElementById("isoActionOverlay").hidden = true;
    });
    document.getElementById("isoActionApply").addEventListener("click", applyAction);
    document.getElementById("isoTableBody").addEventListener("click", (event) => {
      const target = event.target;
      if (!target || !target.dataset) return;
      if (target.dataset.edit) {
        const record = state.records.find((r) => r.id === target.dataset.edit);
        if (record) openDialog(record);
      } else if (target.dataset.action) {
        openActionDialog(target.dataset.action);
      } else if (target.dataset.delete) {
        const record = state.records.find((r) => r.id === target.dataset.delete);
        if (record && window.confirm(`「${record.title}」を削除しますか？`)) {
          api("DELETE", `/api/v1/iso/${record.id}`)
            .then(() => {
              showToast("削除しました", "success");
              return loadRecords();
            })
            .catch((e) => showToast(`削除に失敗: ${e.message}`, "error"));
        }
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const dialog = document.getElementById("isoDialogOverlay");
      const action = document.getElementById("isoActionOverlay");
      if (!dialog.hidden) dialog.hidden = true;
      if (!action.hidden) action.hidden = true;
      state.editingId = null;
      state.actionId = null;
    });
    const initial = window.location.hash.replace("#", "");
    const validTabs = DOMAINS.map((d) => d.id).concat(["analytics", "integrations"]);
    setActiveTab(validTabs.includes(initial) ? initial : "analytics");

    // v0.14.1: sidebar links (e.g. /iso-app#quality from the メインメニュー /
    // ISO 統合マネジメント groups) change only the hash when already on this
    // page. Listen for hashchange so the right-hand content follows the click.
    window.addEventListener("hashchange", () => {
      const next = window.location.hash.replace("#", "");
      if (validTabs.includes(next)) {
        setActiveTab(next);
        // Update the active state of the console-side tab items too.
        document.querySelectorAll(".iso-tab").forEach((el) => {
          el.classList.toggle("active", el.dataset.tab === next);
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
