/* Construction Hub — Phase 1 PoC tab + card renderer.
 * No build step, no deps — vanilla DOM so it runs on a fresh Debian XFCE.
 * All DOM mutation goes via createElement + textContent — no innerHTML — so
 * future migration to fetched / user-supplied content cannot regress to XSS.
 */

const CARDS_BY_PROFILE = {
    standard: [
        { icon: "📋", title: "日報入力", sub: "現場別・案件別の日報" },
        { icon: "📷", title: "写真ライブラリ", sub: "案件別アルバム" },
        { icon: "📐", title: "図面ビューア", sub: "PDF / DWG / IFC" },
        { icon: "📦", title: "案件 / 原価", sub: "進行中の案件一覧" },
        { icon: "📥", title: "申請ポータル", sub: "稟議・購買・休暇" },
        { icon: "📚", title: "ナレッジ Hub", sub: "標準書・技術資料" },
        { icon: "✉️", title: "メール / Teams", sub: "M365 連携" },
        { icon: "📞", title: "IT サポート", sub: "ヘルプデスクへ申請" },
    ],
    field: [
        { icon: "📋", title: "日報入力", sub: "オフライン入力対応" },
        { icon: "📷", title: "写真アップロード", sub: "Wi-Fi 復旧後再送" },
        { icon: "📐", title: "図面ビューア", sub: "ローカルキャッシュ" },
        { icon: "🔔", title: "作業指示", sub: "本日の指示確認" },
        { icon: "🌦️", title: "現場気象", sub: "風速・雨量警告" },
        { icon: "📍", title: "現場マップ", sub: "オフライン地図" },
    ],
    kiosk: [
        { icon: "🌐", title: "業務ポータル", sub: "ブラウザのみ" },
        { icon: "🆘", title: "ヘルプデスク", sub: "電話番号 / FAQ" },
    ],
};

const grid = document.getElementById("hub-grid");
const tabs = document.querySelectorAll(".tab");
const statusText = document.getElementById("status-text");
const agentVersion = document.getElementById("agent-version");

function makeCardElement(card) {
    const button = document.createElement("button");
    button.className = "card";

    const icon = document.createElement("span");
    icon.className = "card-icon";
    icon.textContent = card.icon;
    button.appendChild(icon);

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = card.title;
    button.appendChild(title);

    const sub = document.createElement("div");
    sub.className = "card-sub";
    sub.textContent = card.sub;
    button.appendChild(sub);

    button.addEventListener("click", () => {
        statusText.textContent = `クリック: ${card.title} (PoC: 未実装)`;
    });
    return button;
}

function renderCards(profile) {
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }
    const cards = CARDS_BY_PROFILE[profile] || [];
    for (const card of cards) {
        grid.appendChild(makeCardElement(card));
    }
}

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        renderCards(tab.dataset.profile);
    });
});

// Probe cdx-server (best-effort): the URL comes from a <meta> tag injected
// by the launcher's Python server (driven by CDX_API_BASE env var). When the
// page is migrated to https in Phase 2, this avoids hardcoded mixed content.
function getCdxServerUrl() {
    const meta = document.querySelector('meta[name="cdx-server-url"]');
    return (meta && meta.content) || "http://127.0.0.1:8080";
}

const statusDot = document.querySelector(".status-dot");

function setStatus(state, text) {
    // state: "ok" | "error" | "connecting"
    statusDot.className = "status-dot " + state;
    statusText.textContent = text;
}

setStatus("connecting", "接続確認中…");

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

fetch(`${getCdxServerUrl()}/api/v1/health`, { signal: controller.signal })
    .then((r) => {
        clearTimeout(timeoutId);
        return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status));
    })
    .then((data) => {
        if (data && typeof data.version === "string") {
            setStatus("ok", "接続: cdx-server " + data.version);
            agentVersion.textContent = "cdx-server v" + data.version;
        } else {
            setStatus("ok", "接続: cdx-server (バージョン不明)");
        }
    })
    .catch((err) => {
        clearTimeout(timeoutId);
        const reason = err && err.name === "AbortError" ? "タイムアウト" : "未接続";
        setStatus("error", "cdx-server: " + reason);
        agentVersion.textContent = "cdx-server: --";
    });

renderCards("standard");
