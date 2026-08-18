/* ─────────────────────────────────────────────────────────────
   CEOP Web UI client script (dashboard + governance).
   CSP-safe: no inline handlers; all behavior lives here.
   ───────────────────────────────────────────────────────────── */

(() => {
  "use strict";

  const TOKEN_EL = document.getElementById("ceopToken");
  const API_TOKEN = TOKEN_EL && TOKEN_EL.value ? TOKEN_EL.value : "";

  /* ── Utilities ────────────────────────────────────────────── */
  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (_) {
      return iso;
    }
  }

  function escapeHtml(str) {
    return String(str ?? "")
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

  /* ── Shared labels ────────────────────────────────────────── */
  const APP_CATEGORY_LABELS = {
    portal: "ポータル",
    governance: "ガバナンス",
    field: "フィールド",
    workflow: "ワークフロー",
    document: "ドキュメント",
  };
  const HEALTH_LABELS = { healthy: "正常", degraded: "劣化", down: "停止", unknown: "不明" };
  const DEVICE_KIND_LABELS = {
    tablet: "タブレット",
    phone: "スマートフォン",
    kiosk: "キオスク",
    sensor: "センサー",
    laptop: "ノートPC",
  };
  const DEVICE_KIND_ICONS = { tablet: "📱", phone: "📲", kiosk: "🖥", sensor: "📡", laptop: "💻" };
  const DEVICE_STATUS_LABELS = {
    active: "アクティブ",
    provisioned: "プロビジョン済み",
    lost: "紛失",
    retired: "廃止",
  };
  const EFFECT_LABELS = { allow: "許可", deny: "拒否" };

  /* ── Dashboard rendering ──────────────────────────────────── */
  function renderAppCards(applications) {
    if (!applications || applications.length === 0) {
      return '<div class="empty-state"><div class="empty-state-icon">🔧</div>アプリケーションが見つかりません</div>';
    }
    return applications
      .map((app) => {
        const health = ["healthy", "degraded", "down", "unknown"].includes(app.health)
          ? app.health
          : "unknown";
        const catLabel = APP_CATEGORY_LABELS[app.category] || app.category;
        return `
        <div class="app-card">
          <div class="app-health-dot health-${health}"></div>
          <div class="app-info">
            <div class="app-name">${escapeHtml(app.name)}</div>
            <div class="app-meta">${escapeHtml(catLabel)} · ${escapeHtml(app.key)}</div>
          </div>
          <div class="app-health-label ${health}">${escapeHtml(HEALTH_LABELS[health] || health)}</div>
        </div>`;
      })
      .join("");
  }

  function renderDeviceRows(devices) {
    if (!devices || devices.length === 0) {
      return '<tr><td colspan="4" class="cell-muted empty-cell">デバイスが見つかりません</td></tr>';
    }
    return devices
      .map((d) => {
        const kindIcon = DEVICE_KIND_ICONS[d.kind] || "📦";
        const kindLabel = DEVICE_KIND_LABELS[d.kind] || d.kind;
        const statusLabel = DEVICE_STATUS_LABELS[d.status] || d.status;
        return `
        <tr>
          <td><code class="cell-muted">${escapeHtml(d.id)}</code></td>
          <td><span class="device-kind">${kindIcon} ${escapeHtml(kindLabel)}</span></td>
          <td><span class="device-status ${escapeHtml(d.status)}">${escapeHtml(statusLabel)}</span></td>
          <td class="cell-soft">${d.assignedUserId ? escapeHtml(d.assignedUserId) : '<span class="cell-muted">—</span>'}</td>
        </tr>`;
      })
      .join("");
  }

  const USER_STATUS_LABELS = {
    invited: "招待中",
    active: "アクティブ",
    suspended: "停止中",
    deactivated: "無効",
  };

  function renderUserRows(users) {
    if (!users || users.length === 0) {
      return '<tr><td colspan="5" class="empty-cell">ユーザーが見つかりません</td></tr>';
    }
    return users
      .map((u) => {
        const statusLabel = USER_STATUS_LABELS[u.status] || u.status;
        const roles = (u.roleIds || [])
          .map((id) => `<code class="cell-muted">${escapeHtml(id)}</code>`)
          .join(" ");
        return `<tr>
          <td><strong>${escapeHtml(u.displayName)}</strong></td>
          <td class="cell-soft">${escapeHtml(u.email)}</td>
          <td><code class="cell-muted">${escapeHtml(u.organizationId)}</code></td>
          <td class="cell-soft">${roles}</td>
          <td><span class="device-status ${escapeHtml(u.status)}">${escapeHtml(statusLabel)}</span></td>
        </tr>`;
      })
      .join("");
  }

  function renderApprovals(approvals) {
    if (!approvals || approvals.length === 0) {
      return '<div class="empty-state"><div class="empty-state-icon">✅</div>未処理の承認リクエストはありません</div>';
    }
    return approvals
      .map(
        (a) => `
      <div class="approval-item">
        <div class="approval-icon">⏳</div>
        <div class="approval-info">
          <div class="approval-title">ワークフロー: ${escapeHtml(a.workflowId)} — ${escapeHtml(a.stepKey)}</div>
          <div class="approval-meta">リクエスト者: ${escapeHtml(a.requestedBy)} · ID: ${escapeHtml(a.id)}</div>
        </div>
        <div class="approval-time">${formatTime(a.requestedAt)}</div>
      </div>`,
      )
      .join("");
  }

  function renderAuditItems(entries) {
    if (!entries || entries.length === 0) {
      return '<div class="empty-state"><div class="empty-state-icon">📋</div>監査イベントはまだありません</div>';
    }
    return entries
      .slice(-10)
      .reverse()
      .map((e) => {
        const ev = e.event || e;
        const outcome = ["success", "denied", "error"].includes(ev.outcome) ? ev.outcome : "error";
        const label = outcome === "success" ? "許可" : outcome === "denied" ? "拒否" : outcome;
        return `
        <div class="audit-item">
          <div class="audit-outcome ${outcome}"></div>
          <div class="audit-actor">${escapeHtml(ev.actor || "—")}</div>
          <div class="audit-action">${escapeHtml(ev.action || "—")}</div>
          <span class="audit-result ${outcome}">${escapeHtml(label)}</span>
          <div class="audit-time">${formatTime(ev.at || "")}</div>
        </div>`;
      })
      .join("");
  }

  /* ── Dashboard refresh ─────────────────────────────────────── */
  let refreshTimer = null;

  async function refreshDashboard() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.add("active");
    try {
      const res = await fetch("/api/v1/dashboard", { headers: authHeaders() });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const g = data.governance || {};

      const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      };
      set("statTotalUsers", g.totalUsers ?? "—");
      set("statActiveUsers", g.activeUsers ?? "—");
      set("statApps", g.visibleApplications ?? "—");
      set("statUnhealthyApps", g.unhealthyApplications ?? "—");
      set("statDevices", g.visibleDevices ?? "—");
      set("statApprovals", g.openApprovals ?? "—");
      set("statAuditEvents", g.auditEvents ?? "—");
      set("statDenied", g.deniedAccessEvents ?? "—");
      set("statDeniedBig", g.deniedAccessEvents ?? "—");

      const appGrid = document.getElementById("appGrid");
      if (appGrid) appGrid.innerHTML = renderAppCards(data.applications);
      const deviceBody = document.getElementById("deviceTableBody");
      if (deviceBody) deviceBody.innerHTML = renderDeviceRows(data.devices);
      const approvalList = document.getElementById("approvalList");
      if (approvalList) approvalList.innerHTML = renderApprovals(data.pendingApprovals);

      // Users require user:read; a viewer without the permission sees a
      // permission note instead of failing silently.
      const userBody = document.getElementById("userTableBody");
      if (userBody) {
        try {
          const userRes = await fetch("/api/v1/users?limit=200", { headers: authHeaders() });
          if (userRes.ok) {
            const userData = await userRes.json();
            userBody.innerHTML = renderUserRows(userData.users || []);
          } else if (userRes.status === 403) {
            userBody.innerHTML =
              '<tr><td colspan="5" class="cell-muted empty-cell">user:read 権限がありません</td></tr>';
          }
        } catch (_) {
          /* users fetch is best-effort */
        }
      }

      try {
        const auditRes = await fetch("/api/v1/governance/audit?limit=10", {
          headers: authHeaders(),
        });
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          const auditList = document.getElementById("auditList");
          if (auditList) auditList.innerHTML = renderAuditItems(auditData.entries || []);
        }
      } catch (_) {
        /* audit fetch is best-effort */
      }

      const unhealthy = g.unhealthyApplications ?? 0;
      const dot = document.getElementById("healthDot");
      const text = document.getElementById("healthText");
      if (dot) dot.className = "health-dot" + (unhealthy > 0 ? " degraded" : "");
      if (text) text.textContent = unhealthy > 0 ? `障害: ${unhealthy} 件` : "システム正常";

      const generated = document.getElementById("generatedAt");
      if (generated) generated.textContent = formatTime(data.generatedAt);
      const footerRight = document.querySelector(".footer__right");
      if (footerRight) footerRight.textContent = "生成: " + formatTime(data.generatedAt);

      showToast("データを更新しました", "success");
    } catch (err) {
      showToast("更新に失敗しました: " + err.message, "error");
    } finally {
      if (overlay) overlay.classList.remove("active");
    }
  }

  /* ── Governance ────────────────────────────────────────────── */
  async function loadPolicies() {
    const tbody = document.getElementById("policyTableBody");
    if (!tbody) return;
    const apiKey = (document.getElementById("inputApiKey")?.value || "").trim();
    if (!apiKey && !API_TOKEN) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="cell-muted empty-cell">API キーを入力すると最新ポリシーを表示できます</td></tr>';
      return;
    }
    tbody.innerHTML = '<tr><td colspan="6" class="cell-muted empty-cell">読込中...</td></tr>';
    try {
      const res = await fetch("/api/v1/governance/policies?limit=200", {
        headers: authHeaders({ "Content-Type": "application/json" }),
      });
      if (res.status === 403) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="cell-muted empty-cell">policy:read 権限がありません</td></tr>';
        return;
      }
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const policies = data.policies ?? [];
      if (policies.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="cell-muted empty-cell">登録済みポリシーはありません</td></tr>';
        return;
      }
      tbody.innerHTML = policies
        .map((p) => {
          const conditions =
            p.conditions && p.conditions.length > 0
              ? p.conditions
                  .map((c) => `${escapeHtml(c.attribute)}=${escapeHtml(String(c.equals))}`)
                  .join(", ")
              : "—";
          return `<tr>
          <td><code class="cell-muted">${escapeHtml(p.id)}</code></td>
          <td>${escapeHtml(p.name)}</td>
          <td><span class="badge ${p.effect === "allow" ? "badge-green" : "badge-red"}">${escapeHtml(EFFECT_LABELS[p.effect] || p.effect)}</span></td>
          <td class="cell-soft">${escapeHtml((p.actions || []).join(", "))}</td>
          <td class="cell-soft">${escapeHtml((p.resources || []).join(", "))}</td>
          <td class="cell-soft">${conditions}</td>
        </tr>`;
        })
        .join("");
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="cell-muted empty-cell">取得に失敗しました: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  function setExample(subject, resource, action) {
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    };
    set("inputSubject", subject);
    set("inputResource", resource);
    set("inputAction", action);
    clearResult();
  }

  function clearResult() {
    const panel = document.getElementById("resultPanel");
    if (panel) panel.classList.remove("visible");
  }

  async function runEvaluate() {
    const subject = (document.getElementById("inputSubject")?.value || "").trim();
    const resource = (document.getElementById("inputResource")?.value || "").trim();
    const action = (document.getElementById("inputAction")?.value || "").trim();
    const apiKey = (document.getElementById("inputApiKey")?.value || "").trim();
    const btn = document.getElementById("evaluateBtn");

    if (!subject || !resource || !action) {
      alert("サブジェクト・リソース・アクションをすべて入力してください。");
      return;
    }
    if (!apiKey && !API_TOKEN) {
      alert("API キーを入力してください。");
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-inline"></span> 評価中...';
    }
    try {
      const res = await fetch("/api/v1/governance/evaluate", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ subject, resource, action, roleIds: [] }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error("HTTP " + res.status + (errData.message ? ": " + errData.message : ""));
      }
      const data = await res.json();
      const isAllow = data.decision === "allow";
      const decEl = document.getElementById("resultDecision");
      const sumEl = document.getElementById("resultSummary");
      const reasonEl = document.getElementById("resultReason");
      const polRow = document.getElementById("resultPoliciesRow");
      const polEl = document.getElementById("resultPolicies");
      const panel = document.getElementById("resultPanel");
      if (decEl) {
        decEl.textContent = isAllow ? "アクセス許可" : "アクセス拒否";
        decEl.className = "result-decision " + (isAllow ? "allow" : "deny");
      }
      if (sumEl) sumEl.textContent = `${subject} → ${resource}:${action}`;
      if (reasonEl) reasonEl.textContent = data.reason || "—";
      if (polRow && polEl) {
        if (data.matchedPolicyIds && data.matchedPolicyIds.length > 0) {
          polRow.classList.remove("hidden-row");
          polEl.innerHTML = data.matchedPolicyIds
            .map((id) => `<span class="policy-tag">${escapeHtml(id)}</span>`)
            .join("");
        } else {
          polRow.classList.add("hidden-row");
        }
      }
      if (panel) panel.classList.add("visible");
    } catch (err) {
      alert("評価に失敗しました: " + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "評価する";
      }
    }
  }

  async function loadAuditLog() {
    const tbody = document.getElementById("auditTableBody");
    if (!tbody) return;
    const apiKey = (document.getElementById("inputApiKey")?.value || "").trim();
    tbody.innerHTML = '<tr><td colspan="6" class="cell-muted empty-cell">読込中...</td></tr>';
    if (!apiKey && !API_TOKEN) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="cell-muted empty-cell">API キーを入力すると監査ログが表示されます</td></tr>';
      return;
    }
    try {
      const res = await fetch("/api/v1/governance/audit?limit=20", { headers: authHeaders() });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const entries = (data.entries || []).slice().reverse();
      if (entries.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="cell-muted empty-cell">監査ログはまだありません</td></tr>';
        return;
      }
      tbody.innerHTML = entries
        .map((e) => {
          const ev = e.event || e;
          const outcome = ev.outcome || "unknown";
          const badgeClass =
            outcome === "success"
              ? "badge-green"
              : outcome === "denied"
                ? "badge-red"
                : "badge-yellow";
          const label = outcome === "success" ? "許可" : outcome === "denied" ? "拒否" : outcome;
          return `
          <tr>
            <td class="cell-muted">${escapeHtml(String(e.sequence ?? "—"))}</td>
            <td class="cell-muted">${formatTime(ev.at)}</td>
            <td>${escapeHtml(ev.actor || "—")}</td>
            <td class="cell-soft">${escapeHtml(ev.action || "—")}</td>
            <td><code class="cell-muted">${escapeHtml(ev.resource || "—")}</code></td>
            <td><span class="badge ${badgeClass}">${escapeHtml(label)}</span></td>
          </tr>`;
        })
        .join("");
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="cell-muted empty-cell">取得に失敗しました: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  /* ── Navigation / init ─────────────────────────────────────── */
  const DASHBOARD_SECTIONS = ["users", "applications", "devices", "approvals", "audit"];

  function showApiViewer(url) {
    const viewer = document.getElementById("apiViewer");
    const body = document.getElementById("apiViewerBody");
    const title = document.getElementById("apiViewerTitle");
    if (!viewer || !body) return;
    DASHBOARD_SECTIONS.forEach((id) => {
      const section = document.getElementById(id);
      if (section) section.hidden = true;
    });
    viewer.hidden = false;
    if (title) title.textContent = `API レスポンス — ${url}`;
    body.textContent = "読み込み中…";
    fetch(url, { headers: authHeaders() })
      .then((res) => res.text())
      .then((text) => {
        body.textContent = text;
      })
      .catch((err) => {
        body.textContent = `取得に失敗しました: ${err.message}`;
      });
  }

  function showDashboardSections() {
    const viewer = document.getElementById("apiViewer");
    if (viewer) viewer.hidden = true;
    DASHBOARD_SECTIONS.forEach((id) => {
      const section = document.getElementById(id);
      if (section) section.hidden = false;
    });
  }

  function initDashboard() {
    const hamburger = document.getElementById("hamburgerBtn");
    const sidebar = document.getElementById("sidebar");
    if (hamburger && sidebar) {
      hamburger.addEventListener("click", () => sidebar.classList.toggle("open"));
    }
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", refreshDashboard);

    const backBtn = document.getElementById("apiViewerBack");
    if (backBtn) backBtn.addEventListener("click", showDashboardSections);
    document.querySelectorAll(".nav-item[data-api]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        showApiViewer(link.dataset.api || link.getAttribute("href") || "");
      });
    });

    const generated = document.getElementById("generatedAt");
    if (generated && generated.textContent.includes("T")) {
      generated.textContent = formatTime(generated.textContent.trim());
    }
    refreshTimer = setInterval(refreshDashboard, 30000);
    window.addEventListener("beforeunload", () => {
      if (refreshTimer) clearInterval(refreshTimer);
    });
  }

  function initGovernance() {
    const policyRefresh = document.getElementById("policyRefreshBtn");
    if (policyRefresh) policyRefresh.addEventListener("click", loadPolicies);
    const auditRefresh = document.getElementById("auditRefreshBtn");
    if (auditRefresh) auditRefresh.addEventListener("click", loadAuditLog);
    const evaluateBtn = document.getElementById("evaluateBtn");
    if (evaluateBtn) evaluateBtn.addEventListener("click", runEvaluate);
    const clearBtn = document.getElementById("clearResultBtn");
    if (clearBtn) clearBtn.addEventListener("click", clearResult);
    document.querySelectorAll(".js-example").forEach((el) => {
      el.addEventListener("click", () => {
        setExample(el.dataset.subject || "", el.dataset.resource || "", el.dataset.action || "");
      });
    });
    ["inputSubject", "inputResource", "inputAction"].forEach((id) => {
      document.getElementById(id)?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") runEvaluate();
      });
    });
    loadPolicies();
    loadAuditLog();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("statsGrid")) initDashboard();
    if (document.getElementById("policyTable")) initGovernance();
    // Portal (v0.14.1): standalone left-sidebar layout with module cards.
    if (document.querySelector(".portal-grid")) {
      const hamburger = document.getElementById("hamburgerBtn");
      const sidebar = document.getElementById("sidebar");
      if (hamburger && sidebar) {
        hamburger.addEventListener("click", () => sidebar.classList.toggle("open"));
      }
    }
  });
})();
