"use client";

import { useEffect, useState, type ComponentType } from "react";
import { Activity, AlertTriangle, Bot, Brain, Eye, FileText, Search, Shield, TrendingDown, TrendingUp } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_MUTED, BORDER, BORDER_LIGHT, SUBTLE_BG } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — AI・分析基盤 (AIPage faithful port, inline slide). 7 tabs.
// ────────────────────────────────────────────────────────────────────────────

type AITabId = "chat" | "knowledge" | "ocr" | "vision" | "predict" | "anomaly" | "agent";

const TABS: { id: AITabId; label: string }[] = [
  { id: "chat", label: "AIチャット" },
  { id: "knowledge", label: "ナレッジAI" },
  { id: "ocr", label: "OCR AI" },
  { id: "vision", label: "画像解析AI" },
  { id: "predict", label: "予測AI" },
  { id: "anomaly", label: "異常検知AI" },
  { id: "agent", label: "AI Agent" },
];

const tabFromPath: Record<string, AITabId> = {
  "/ai/chat": "chat", "/ai/knowledge": "knowledge", "/ai/ocr": "ocr",
  "/ai/vision": "vision", "/ai/predict": "predict", "/ai/anomaly": "anomaly", "/ai/agent": "agent",
};

const BG_CARD = "var(--bg-card, #fff)";
const BG_INPUT = "var(--bg-input, #f8fafc)";

const knowledge = [
  { title: "鉄骨建方の品質管理基準", source: "ナレッジベース", relevance: 98, type: "マニュアル" },
  { title: "コンクリート打設手順書 Rev.3", source: "文書管理", relevance: 95, type: "手順書" },
  { title: "安全管理計画書テンプレート", source: "テンプレート", relevance: 90, type: "テンプレート" },
  { title: "足場組立基準 JIS規格対応", source: "ナレッジベース", relevance: 87, type: "基準書" },
  { title: "土工事 出来形管理基準 国交省準拠", source: "ナレッジベース", relevance: 84, type: "基準書" },
  { title: "BIM/CIM 運用ガイドライン Rev.2", source: "文書管理", relevance: 81, type: "ガイドライン" },
  { title: "建設業 労働安全衛生規則 抜粋", source: "法令データベース", relevance: 79, type: "法令" },
  { title: "重機作業安全チェックリスト", source: "安全管理", relevance: 85, type: "チェックリスト" },
];

const ocrStats = [
  { l: "処理済み文書", v: "2,481", c: "#1a56db", bg: "#eff6ff" },
  { l: "認識精度", v: "97.8%", c: "#16a34a", bg: "#f0fdf4" },
  { l: "本日処理", v: "12", c: "#7c3aed", bg: "#f5f3ff" },
];

const visionIconMap: Record<string, ComponentType<{ className?: string; style?: React.CSSProperties }>> = { "alert-triangle": AlertTriangle, eye: Eye, shield: Shield };
const visionRows = [
  { title: "安全装備未着用検知", site: "品川タワー 7F", time: "09:12", confidence: "96.2%", type: "ヘルメット未着用", icon: "alert-triangle", color: "#dc2626" },
  { title: "ひび割れ検知", site: "横浜マンション 2F", time: "08:45", confidence: "89.1%", type: "幅0.2mm クラック", icon: "eye", color: "#f97316" },
  { title: "立入禁止区域侵入", site: "川崎物流 ヤード", time: "08:20", confidence: "94.5%", type: "人物検知", icon: "alert-triangle", color: "#dc2626" },
  { title: "足場不備検知", site: "横浜マンション 3F", time: "昨日 16:30", confidence: "87.3%", type: "手すり欠損", icon: "shield", color: "#f97316" },
  { title: "重機接近検知", site: "川崎物流基地 ヤード", time: "07:55", confidence: "93.8%", type: "作業員-重機 距離不足", icon: "alert-triangle", color: "#dc2626" },
  { title: "出来形判定", site: "大田区土木工事 A区間", time: "昨日 11:20", confidence: "90.4%", type: "床版厚 規格内", icon: "eye", color: "#16a34a" },
  { title: "安全装備検知", site: "千葉港湾整備 護岸部", time: "昨日 09:40", confidence: "95.1%", type: "安全帯未装着", icon: "shield", color: "#f97316" },
  { title: "配筋間隔異常", site: "新宿再開発 基礎", time: "昨日 14:00", confidence: "82.7%", type: "間隔不足", icon: "eye", color: "#eab308" },
];

const riskBg: Record<string, string> = { 低: "#dcfce7", 中: "#fff7ed", 高: "#fef2f2" };
const riskColor: Record<string, string> = { 低: "#166534", 中: "#92400e", 高: "#991b1b" };
const predictRows = [
  { project: "品川タワー新築", metric: "完工予定", current: "2027/03", predicted: "2027/04", confidence: 72, risk: "中" },
  { project: "横浜分譲マンション", metric: "完工予定", current: "2027/09", predicted: "2027/09", confidence: 88, risk: "低" },
  { project: "川崎物流センター", metric: "原価着地", current: "¥3,200M", predicted: "¥3,380M", confidence: 65, risk: "高" },
  { project: "大田区土木工事", metric: "完工予定", current: "2026/12", predicted: "2026/12", confidence: 92, risk: "低" },
  { project: "川崎物流基地", metric: "完工予定", current: "2027/02", predicted: "2027/03", confidence: 69, risk: "中" },
  { project: "千葉港湾整備", metric: "原価着地", current: "¥5,800M", predicted: "¥5,820M", confidence: 84, risk: "低" },
  { project: "大田区土木工事", metric: "原価着地", current: "¥1,450M", predicted: "¥1,610M", confidence: 61, risk: "高" },
  { project: "新宿再開発ビル", metric: "完工予定", current: "2028/06", predicted: "2028/07", confidence: 58, risk: "中" },
];

const anomalyStatusColor: Record<string, string> = { 正常: "#16a34a", 注意: "#f97316", 警告: "#dc2626" };
const anomalyRows = [
  { metric: "鉄骨建方速度", project: "品川タワー", status: "正常", score: 0.12, trend: "安定" },
  { metric: "コンクリート強度", project: "横浜マンション", status: "正常", score: 0.08, trend: "安定" },
  { metric: "重機稼働率", project: "川崎物流", status: "注意", score: 0.67, trend: "低下" },
  { metric: "安全スコア", project: "大田区土木", status: "正常", score: 0.15, trend: "安定" },
  { metric: "原価消化率", project: "川崎物流", status: "警告", score: 0.82, trend: "上昇" },
  { metric: "重機接近回数", project: "川崎物流基地", status: "警告", score: 0.78, trend: "上昇" },
  { metric: "出来形誤差", project: "大田区土木工事", status: "正常", score: 0.19, trend: "安定" },
  { metric: "資材搬入遅延", project: "千葉港湾整備", status: "注意", score: 0.52, trend: "上昇" },
  { metric: "工程遅延率", project: "品川タワー", status: "注意", score: 0.45, trend: "上昇" },
];
const trendIcon = (t: string) => (t === "安定" ? Activity : t === "上昇" ? TrendingUp : TrendingDown);

const agents = [
  { name: "日報自動生成 Agent", desc: "IoT・写真・工程データから日報を自動作成", status: "稼働中", tasks: 12, accuracy: "91%" },
  { name: "安全巡視 Agent", desc: "カメラ映像からリアルタイム安全チェック", status: "稼働中", tasks: 891, accuracy: "94%" },
  { name: "原価予測 Agent", desc: "資材価格・進捗から原価着地を予測", status: "稼働中", tasks: 24, accuracy: "83%" },
  { name: "品質検査 Agent", desc: "出来形データの自動照合・合否判定", status: "稼働中", tasks: 156, accuracy: "88%" },
  { name: "工程最適化 Agent", desc: "リソース配分と工程の最適化提案", status: "稼働中", tasks: 8, accuracy: "79%" },
  { name: "ひび割れ検知 Agent", desc: "構造物画像から YOLOv8 でひび割れを自動検出", status: "稼働中", tasks: 342, accuracy: "92%" },
  { name: "重機接近警報 Agent", desc: "カメラ映像から作業員と重機の距離を常時監視", status: "稼働中", tasks: 1247, accuracy: "96%" },
  { name: "資材発注 Agent", desc: "在庫・進捗から発注量と納期を自動算出", status: "待機", tasks: 0, accuracy: "86%" },
  { name: "文書分類 Agent", desc: "アップロード文書の自動分類・タグ付け", status: "待機", tasks: 0, accuracy: "95%" },
];

const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 16 };

function AIChatPanel() {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: "assistant" | "user"; text: string }[]>([
    { role: "assistant", text: "Construction Enterprise OS AIアシスタントです。工事・図面・安全・原価など、何でもお聞きください。" },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setChatInput("");
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", text: `「${q}」について分析しています。\n\n品川タワー新築工事のデータによると、現在の工程進捗率は68%で、鉄骨建方が7階まで完了しています。\n\n関連文書として「構造図_7F_鉄骨配置図.pdf（v3.1）」が最新版です。` }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 500 }}>
      <div style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 10, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#7c3aed12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Brain className="h-4 w-4" style={{ color: "#7c3aed" }} />
              </div>
            )}
            <div style={{ maxWidth: "70%", padding: "12px 16px", borderRadius: 12, background: m.role === "user" ? "#1a56db" : SUBTLE_BG, color: m.role === "user" ? "#fff" : T_BODY, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", border: m.role === "assistant" ? `1px solid ${BORDER}` : "none" }}>{m.text}</div>
          </div>
        ))}
        {isTyping && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#7c3aed12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Brain className="h-4 w-4" style={{ color: "#7c3aed" }} />
            </div>
            <div style={{ padding: "12px 16px", borderRadius: 12, background: SUBTLE_BG, border: `1px solid ${BORDER}`, display: "flex", gap: 4 }}>
              {[0, 1, 2].map((d) => (
                <span key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: T_MUTED, animation: `aiDot 1.2s ease-in-out ${d * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "8px 20px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["品川タワーの進捗は？", "安全管理の改善点", "原価超過の原因分析", "明日の天候リスク"].map((s) => (
          <button key={s} onClick={() => setChatInput(s)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${BORDER}`, background: BG_CARD, fontSize: 11, color: T_MUTED, cursor: "pointer", fontFamily: "inherit" }}>{s}</button>
        ))}
      </div>
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${BORDER}`, display: "flex", gap: 10 }}>
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="AIに質問する..."
          aria-label="AIに質問する"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: BG_INPUT, color: T_BODY }}
        />
        <button onClick={handleSend} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#1a56db", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>送信</button>
      </div>
      <style>{`@keyframes aiDot { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}

export function AIDesignView({ subPath }: { subPath?: string }) {
  const [activeTab, setActiveTab] = useState<AITabId>((subPath && tabFromPath[subPath]) || "chat");

  useEffect(() => {
    if (subPath && tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]);
  }, [subPath]);

  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === activeTab));

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>AI・分析基盤</h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>AIチャット・ナレッジ・OCR・画像解析・予測・異常検知・Agent</p>
      </div>

      <div style={CARD}>
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, padding: "0 8px", overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{ padding: "12px 16px", fontSize: 12, fontWeight: activeTab === t.id ? 600 : 400, color: activeTab === t.id ? "#1a56db" : T_MUTED, cursor: "pointer", whiteSpace: "nowrap", background: "none", border: "none", borderBottom: activeTab === t.id ? "2px solid #1a56db" : "2px solid transparent", fontFamily: "inherit" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", transition: "transform 0.35s cubic-bezier(.4,0,.2,1)", transform: `translateX(-${activeIndex * 100}%)` }}>
            {/* AIチャット */}
            <div style={{ minWidth: "100%", flexShrink: 0 }}><AIChatPanel /></div>

            {/* ナレッジAI */}
            <div style={{ minWidth: "100%", flexShrink: 0, padding: 20 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: SUBTLE_BG, borderRadius: 8, padding: "8px 14px", border: `1px solid ${BORDER}` }}>
                  <Search className="h-4 w-4" style={{ color: T_MUTED }} aria-hidden="true" />
                  <input placeholder="ナレッジ検索... マニュアル・手順書・基準書を横断検索" aria-label="ナレッジ検索" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, flex: 1, fontFamily: "inherit", color: T_BODY }} />
                </div>
                <span style={{ fontSize: 10, padding: "8px 12px", borderRadius: 6, background: "#7c3aed", color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <Brain className="h-3 w-3" aria-hidden="true" />AI検索
                </span>
              </div>
              {knowledge.map((r) => (
                <div key={r.title} style={{ padding: 14, borderRadius: 8, border: `1px solid ${BORDER}`, marginBottom: 8, cursor: "pointer", transition: "border-color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#93c5fd")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border, #e2e8f0)")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: T_MUTED, marginTop: 3 }}>{r.source} · {r.type}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#1a56db", background: "#eff6ff", padding: "2px 8px", borderRadius: 10, height: "fit-content" }}>関連度 {r.relevance}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* OCR AI */}
            <div style={{ minWidth: "100%", flexShrink: 0, padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
                {ocrStats.map((s) => (
                  <div key={s.l} style={{ padding: 14, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FileText className="h-4 w-4" style={{ color: s.c }} />
                    </div>
                    <div><div style={{ fontSize: 10, color: T_MUTED }}>{s.l}</div><div style={{ fontSize: 20, fontWeight: 700, color: T_BODY }}>{s.v}</div></div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 40, borderRadius: 8, border: `2px dashed ${BORDER}`, textAlign: "center", background: SUBTLE_BG }}>
                <FileText className="mx-auto mb-3 h-10 w-10" style={{ color: "#94a3b8" }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: T_BODY }}>文書をドラッグ＆ドロップでアップロード</div>
                <div style={{ fontSize: 12, color: T_MUTED, marginTop: 4 }}>PDF・JPEG・PNG・TIFF対応 — AIが自動でテキスト抽出</div>
              </div>
            </div>

            {/* 画像解析AI */}
            <div style={{ minWidth: "100%", flexShrink: 0, padding: 20 }}>
              <div style={sectionTitle}>画像解析AI — 検知結果一覧</div>
              {visionRows.map((d) => {
                const VIcon = visionIconMap[d.icon] ?? Eye;
                return (
                  <div key={d.title} style={{ padding: 14, borderRadius: 8, border: `1px solid ${BORDER}`, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: d.color + "12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <VIcon className="h-[18px] w-[18px]" style={{ color: d.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>{d.title}</div>
                      <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{d.site} · {d.type}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>{d.confidence}</div>
                      <div style={{ fontSize: 10, color: T_MUTED, marginTop: 2 }}>{d.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 予測AI */}
            <div style={{ minWidth: "100%", flexShrink: 0, padding: 20 }}>
              <div style={sectionTitle}>AI予測分析</div>
              <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.3fr 80px 100px 100px 100px 60px", gap: 12, padding: "10px 16px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_MUTED }}>
                  <span>工事</span><span>指標</span><span>計画値</span><span>AI予測</span><span>信頼度</span><span>リスク</span>
                </div>
                {predictRows.map((p) => (
                  <div key={p.project} style={{ display: "grid", gridTemplateColumns: "1.3fr 80px 100px 100px 100px 60px", gap: 12, padding: "12px 16px", alignItems: "center", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12 }}>
                    <span style={{ fontWeight: 500, color: T_BODY }}>{p.project}</span>
                    <span style={{ color: T_MUTED, fontSize: 11 }}>{p.metric}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", color: T_MUTED, fontSize: 11 }}>{p.current}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: p.predicted !== p.current ? "#dc2626" : "#16a34a", fontSize: 11 }}>{p.predicted}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: BORDER, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p.confidence}%`, borderRadius: 3, background: "#1a56db" }} />
                      </div>
                      <span style={{ fontSize: 10, color: T_MUTED }}>{p.confidence}%</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: riskBg[p.risk], color: riskColor[p.risk] }}>{p.risk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 異常検知AI */}
            <div style={{ minWidth: "100%", flexShrink: 0, padding: 20 }}>
              <div style={sectionTitle}>AI異常検知ダッシュボード</div>
              <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 70px 100px 70px", gap: 12, padding: "10px 16px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_MUTED }}>
                  <span>監視メトリクス</span><span>対象工事</span><span>状態</span><span>異常スコア</span><span>傾向</span>
                </div>
                {anomalyRows.map((a) => {
                  const TIcon = trendIcon(a.trend);
                  return (
                    <div key={a.metric} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 70px 100px 70px", gap: 12, padding: "12px 16px", alignItems: "center", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12 }}>
                      <span style={{ fontWeight: 500, color: T_BODY }}>{a.metric}</span>
                      <span style={{ color: T_MUTED }}>{a.project}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: anomalyStatusColor[a.status] }} />
                        <span style={{ fontSize: 11, color: anomalyStatusColor[a.status], fontWeight: 500 }}>{a.status}</span>
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 6, background: BORDER, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${a.score * 100}%`, borderRadius: 3, background: a.score > 0.7 ? "#dc2626" : a.score > 0.4 ? "#f97316" : "#16a34a" }} />
                        </div>
                        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: T_MUTED }}>{a.score.toFixed(2)}</span>
                      </div>
                      <span style={{ fontSize: 11, color: a.trend === "上昇" ? "#dc2626" : a.trend === "低下" ? "#f97316" : "#16a34a", display: "flex", alignItems: "center", gap: 3 }}>
                        <TIcon className="h-3 w-3" />{a.trend}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Agent */}
            <div style={{ minWidth: "100%", flexShrink: 0, padding: 20 }}>
              <div style={sectionTitle}>AI Agent — 自律型タスク実行</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                {agents.map((a) => (
                  <div key={a.name} style={{ padding: 16, borderRadius: 10, border: `1px solid ${BORDER}`, background: a.status === "稼働中" ? "#f5f3ff" : SUBTLE_BG }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Bot className="h-[18px] w-[18px]" style={{ color: "#7c3aed" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>{a.name}</span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: a.status === "稼働中" ? "#dcfce7" : "#f1f5f9", color: a.status === "稼働中" ? "#166534" : "#64748b" }}>{a.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: T_MUTED, marginBottom: 10 }}>{a.desc}</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 500 }}>本日: {a.tasks}タスク</span>
                      <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 500 }}>精度: {a.accuracy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
