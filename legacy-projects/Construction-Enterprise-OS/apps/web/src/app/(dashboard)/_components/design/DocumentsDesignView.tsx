"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Box,
  Brain,
  Camera,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Folder,
  GitBranch,
  History,
  PenLine,
  Plus,
  ScanLine,
  Search,
  Video,
  X,
} from "lucide-react";
import {
  CARD,
  T_HEADING,
  T_BODY,
  T_SECOND,
  T_MUTED,
  T_FAINT,
  BORDER,
  BORDER_LIGHT,
  SUBTLE_BG,
} from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — 文書・図面管理 (DocumentsPDFView faithful port)
// SlideTabPanel via inline translateX slide. Covers all 10 sub-items.
// ────────────────────────────────────────────────────────────────────────────

type TabId =
  | "pdf"
  | "cad"
  | "bim"
  | "photo"
  | "video"
  | "ocr"
  | "board"
  | "deliver"
  | "version"
  | "aiSearch";

const TABS: { id: TabId; label: string }[] = [
  { id: "pdf", label: "PDF管理" },
  { id: "cad", label: "CAD図面" },
  { id: "bim", label: "BIM/CIM" },
  { id: "photo", label: "写真管理" },
  { id: "video", label: "動画管理" },
  { id: "ocr", label: "OCR" },
  { id: "board", label: "電子黒板" },
  { id: "deliver", label: "電子納品" },
  { id: "version", label: "バージョン管理" },
  { id: "aiSearch", label: "AI文書検索" },
];

const tabFromPath: Record<string, TabId> = {
  "/documents/pdf": "pdf",
  "/documents/cad": "cad",
  "/documents/bim": "bim",
  "/documents/photo": "photo",
  "/documents/video": "video",
  "/documents/ocr": "ocr",
  "/documents/board": "board",
  "/documents/deliver": "deliver",
  "/documents/version": "version",
  "/documents/ai-search": "aiSearch",
};

// ── shared data (PDF panel) ─────────────────────────────────────────────────
type FolderItem = { name: string; count: number; updated: string };

type DocType = "PDF" | "CAD" | "BIM" | "Excel";
type DocStatus = "承認済" | "承認待ち" | "新規" | "最新" | "配布済";

type Document = {
  name: string;
  type: string;
  size: string;
  date: string;
  status: string;
  author: string;
  version: string;
};

const folders: FolderItem[] = [
  { name: "品川タワー新築工事", count: 142, updated: "2026/05/24" },
  { name: "横浜分譲マンション", count: 87, updated: "2026/05/23" },
  { name: "大田区土木工事", count: 63, updated: "2026/05/22" },
  { name: "共通図面", count: 215, updated: "2026/05/20" },
];

const documents: Document[] = [
  { name: "構造図_7F_鉄骨配置図.pdf", type: "PDF", size: "4.2MB", date: "2026/05/24", status: "承認済", author: "佐藤", version: "v3.1" },
  { name: "施工計画書_躯体工事_Rev2.pdf", type: "PDF", size: "8.7MB", date: "2026/05/23", status: "承認待ち", author: "田中", version: "v2.0" },
  { name: "配筋図_6F_スラブ.dwg", type: "CAD", size: "12.1MB", date: "2026/05/22", status: "承認済", author: "山田", version: "v1.2" },
  { name: "安全パトロール報告_0524.pdf", type: "PDF", size: "1.8MB", date: "2026/05/24", status: "新規", author: "鈴木", version: "v1.0" },
  { name: "BIMモデル_品川タワー.ifc", type: "BIM", size: "245MB", date: "2026/05/21", status: "最新", author: "高橋", version: "v4.0" },
  { name: "コンクリート強度試験_5F.pdf", type: "PDF", size: "2.4MB", date: "2026/05/24", status: "新規", author: "渡辺", version: "v1.0" },
  { name: "足場計画図.pdf", type: "PDF", size: "3.6MB", date: "2026/05/20", status: "承認済", author: "伊藤", version: "v2.1" },
  { name: "週間工程表_W22.xlsx", type: "Excel", size: "0.8MB", date: "2026/05/24", status: "配布済", author: "田中", version: "v1.0" },
];

const typeColor: Record<DocType, string> = {
  PDF: "#dc2626",
  CAD: "#1a56db",
  BIM: "#7c3aed",
  Excel: "#16a34a",
};

const statusColor: Record<DocStatus, { bg: string; color: string }> = {
  承認済: { bg: "#dcfce7", color: "#166534" },
  承認待ち: { bg: "#fff7ed", color: "#92400e" },
  新規: { bg: "#dbeafe", color: "#1e40af" },
  最新: { bg: "#f0fdf4", color: "#166534" },
  配布済: { bg: "#f1f5f9", color: "#475569" },
};

const ROW_GRID = "1fr 60px 70px 90px 80px 50px";

function resolveTypeColor(type: string): string {
  return typeColor[type as DocType] ?? "#94a3b8";
}

function resolveStatusColor(status: string): { bg: string; color: string } {
  return statusColor[status as DocStatus] ?? statusColor["新規"];
}

// ── shared layout primitives ────────────────────────────────────────────────
const panelStyle: React.CSSProperties = { minWidth: "100%", flexShrink: 0, padding: 20 };

function PanelHeading({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T_HEADING }}>{title}</div>
        <div style={{ fontSize: 11, color: T_MUTED, marginTop: 1 }}>{desc}</div>
      </div>
    </div>
  );
}

function MetricGrid({ items, cols = 4 }: { items: { l: string; v: string; c: string; s?: string }[]; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, marginBottom: 16 }}>
      {items.map((m) => (
        <div key={m.l} style={{ padding: 14, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}`, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: m.c }}>{m.v}</div>
          <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{m.l}{m.s ? ` · ${m.s}` : ""}</div>
        </div>
      ))}
    </div>
  );
}

function Table<T>({ cols, grid, rows, render }: { cols: string[]; grid: string; rows: T[]; render: (row: T, i: number) => ReactNode }) {
  return (
    <div style={{ ...CARD }}>
      <div style={{ display: "grid", gridTemplateColumns: grid, gap: 12, padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_FAINT }}>
        {cols.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: grid,
            gap: 12,
            padding: "12px 16px",
            alignItems: "center",
            borderBottom: i < rows.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none",
            fontSize: 12,
            color: T_SECOND,
          }}
        >
          {render(row, i)}
        </div>
      ))}
    </div>
  );
}

function Badge({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: bg, color, justifySelf: "start" }}>{text}</span>
  );
}

// ── per-tab data ────────────────────────────────────────────────────────────
const cadDrawings = [
  { no: "S-201", name: "7F 鉄骨配置図", scale: "1:100", author: "佐藤", version: "v3.1", status: "承認済" },
  { no: "S-301", name: "6F 配筋図 スラブ", scale: "1:50", author: "山田", version: "v1.2", status: "承認済" },
  { no: "A-105", name: "基準階 平面詳細図", scale: "1:50", author: "伊藤", version: "v2.0", status: "承認待ち" },
  { no: "M-401", name: "空調ダクト系統図", scale: "1:100", author: "渡辺", version: "v1.0", status: "新規" },
  { no: "E-501", name: "電気幹線系統図", scale: "1:100", author: "高橋", version: "v1.1", status: "承認待ち" },
];

const bimModels = [
  { name: "品川タワー 統合モデル", lod: "LOD400", elements: "284,120", size: "245MB", phase: "実施設計" },
  { name: "横浜マンション 構造モデル", lod: "LOD300", elements: "98,540", size: "112MB", phase: "施工" },
  { name: "大田区橋梁 CIMモデル", lod: "LOD350", elements: "42,310", size: "78MB", phase: "詳細設計" },
  { name: "川崎物流 設備モデル", lod: "LOD300", elements: "65,890", size: "96MB", phase: "実施設計" },
];

const photoAlbums = [
  { name: "品川タワー 7F 躯体", count: 248, date: "2026/05/24", geo: "あり" },
  { name: "横浜マンション 配筋検査", count: 132, date: "2026/05/23", geo: "あり" },
  { name: "大田区 掘削状況", count: 86, date: "2026/05/22", geo: "あり" },
  { name: "安全パトロール 5月", count: 412, date: "2026/05/24", geo: "なし" },
];

const videoClips = [
  { name: "7F 鉄骨建方 タイムラプス", duration: "03:24", res: "4K", size: "1.8GB", date: "2026/05/24" },
  { name: "ドローン空撮 全景", duration: "06:12", res: "4K", size: "3.4GB", date: "2026/05/23" },
  { name: "コンクリート打設 記録", duration: "12:45", res: "1080p", size: "2.1GB", date: "2026/05/22" },
  { name: "安全教育 朝礼", duration: "08:30", res: "1080p", size: "1.2GB", date: "2026/05/24" },
];

const ocrResults = [
  { doc: "工事打合せ簿_0524.pdf", chars: 1842, confidence: 98.4, status: "完了" },
  { doc: "材料受入検査票.jpg", chars: 412, confidence: 96.1, status: "完了" },
  { doc: "手書き作業日報_0523.pdf", chars: 968, confidence: 89.7, status: "要確認" },
  { doc: "出来形管理記録.pdf", chars: 2204, confidence: 97.2, status: "完了" },
  { doc: "納品書_鉄筋_05.jpg", chars: 286, confidence: 84.3, status: "要確認" },
];

const boardEntries = [
  { site: "品川タワー 7F", item: "鉄骨建方 出来形", inspector: "佐藤", date: "2026/05/24", status: "記録済" },
  { site: "横浜マンション 2F", item: "配筋 かぶり厚", inspector: "山田", date: "2026/05/23", status: "記録済" },
  { site: "大田区 土工", item: "掘削深さ 確認", inspector: "鈴木", date: "2026/05/22", status: "承認待ち" },
  { site: "川崎物流 基礎", item: "スランプ試験", inspector: "渡辺", date: "2026/05/24", status: "記録済" },
];

const deliverItems = [
  { item: "工事完成図書", standard: "CALS/EC", progress: 78, status: "作成中" },
  { item: "電子納品要領 適合チェック", standard: "国交省 R5", progress: 92, status: "検査中" },
  { item: "デジタル写真管理情報基準", standard: "PHOTO.XML", progress: 100, status: "完了" },
  { item: "出来形管理資料", standard: "CALS/EC", progress: 64, status: "作成中" },
  { item: "施工管理データ (XML)", standard: "i-Construction", progress: 55, status: "作成中" },
];

const versionHistory = [
  { file: "構造図_7F_鉄骨配置図.pdf", version: "v3.1", author: "佐藤", date: "2026/05/24", note: "梁接合部ボルト仕様変更 M22→M24" },
  { file: "構造図_7F_鉄骨配置図.pdf", version: "v3.0", author: "佐藤", date: "2026/05/18", note: "柱断面サイズ修正" },
  { file: "施工計画書_躯体工事.pdf", version: "v2.0", author: "田中", date: "2026/05/23", note: "養生期間の見直し" },
  { file: "配筋図_6F_スラブ.dwg", version: "v1.2", author: "山田", date: "2026/05/22", note: "開口補強筋の追加" },
];

const aiSearchResults = [
  { title: "構造図_7F_鉄骨配置図.pdf", snippet: "梁接合部のボルト仕様 M24、フランジ厚 22mm…", source: "PDF管理", relevance: 98 },
  { title: "施工計画書_躯体工事_Rev2.pdf", snippet: "コンクリート打設後の養生期間は7日以上を確保…", source: "PDF管理", relevance: 94 },
  { title: "BIMモデル_品川タワー.ifc", snippet: "7F 鉄骨部材数 1,284、総重量 482t…", source: "BIM/CIM", relevance: 90 },
  { title: "工事打合せ簿_0524.pdf", snippet: "ボルト仕様変更について監理者承認を取得…", source: "OCR", relevance: 86 },
  { title: "配筋図_6F_スラブ.dwg", snippet: "スラブ配筋 D13@200、上端筋・下端筋ダブル…", source: "CAD図面", relevance: 83 },
];

export function DocumentsDesignView({ subPath }: { subPath?: string }) {
  const [activeTab, setActiveTab] = useState<TabId>((subPath && tabFromPath[subPath]) || "pdf");
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);

  useEffect(() => {
    if (subPath && tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]);
  }, [subPath]);

  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === activeTab));
  const panelsRef = useRef<HTMLDivElement>(null);
  // a11y: keep off-screen (inactive) slide panels out of tab order / SR tree
  useEffect(() => {
    const kids = panelsRef.current?.children;
    if (!kids) return;
    Array.from(kids).forEach((el, i) => {
      const panel = el as HTMLElement;
      panel.inert = i !== activeIndex;
      panel.setAttribute("aria-hidden", String(i !== activeIndex));
    });
  }, [activeIndex]);
  const detailDoc = selectedDoc !== null ? documents[selectedDoc] : null;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>文書・図面管理</h1>
          <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>PDF・CAD・BIM・写真・動画・OCR・電子黒板・電子納品の統合管理</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: T_SECOND, fontFamily: "inherit" }}>
            <Download className="h-3.5 w-3.5" />
            電子納品
          </button>
          <button style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#1a56db", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
            <Plus className="h-3.5 w-3.5" />
            アップロード
          </button>
        </div>
      </div>

      <div style={CARD}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, padding: "0 8px", overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "12px 16px",
                fontSize: 12,
                fontWeight: activeTab === t.id ? 600 : 400,
                color: activeTab === t.id ? "#1a56db" : T_MUTED,
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: "none",
                border: "none",
                borderBottom: activeTab === t.id ? "2px solid #1a56db" : "2px solid transparent",
                fontFamily: "inherit",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sliding panels */}
        <div style={{ overflow: "hidden" }}>
          <div ref={panelsRef} style={{ display: "flex", transition: "transform 0.35s cubic-bezier(.4,0,.2,1)", transform: `translateX(-${activeIndex * 100}%)` }}>
            {/* ── PDF管理 (faithful) ───────────────────────────────────────── */}
            <div style={panelStyle}>
              <div style={{ ...CARD, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: SUBTLE_BG, borderRadius: 8, padding: "6px 12px", border: `1px solid ${BORDER}` }}>
                  <Search className="h-4 w-4" style={{ color: T_FAINT }} aria-hidden="true" />
                  <input
                    aria-label="AI文書検索"
                    placeholder="AI文書検索... ファイル名、内容、図面番号で検索"
                    style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: T_BODY, flex: 1, fontFamily: "inherit" }}
                  />
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#7c3aed", color: "#fff", fontWeight: 600 }}>
                    AI
                  </span>
                </div>
                {["PDF", "CAD", "BIM", "写真"].map((f) => (
                  <button key={f} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 11, color: T_MUTED, cursor: "pointer", fontFamily: "inherit" }}>
                    {f}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: selectedDoc !== null ? "1fr 340px" : "1fr", gap: 20 }}>
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T_MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      プロジェクトフォルダ
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 10 }}>
                      {folders.map((f, i) => (
                        <div
                          key={i}
                          style={{ ...CARD, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "box-shadow 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)")}
                          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Folder className="h-[18px] w-[18px]" style={{ color: "#1a56db" }} />
                          </div>
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: T_BODY, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                              {f.name}
                            </div>
                            <div style={{ fontSize: 10, color: T_FAINT, marginTop: 2 }}>
                              {f.count}件 · {f.updated}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: T_MUTED, marginBottom: 8 }}>最近のファイル</div>
                  <div style={CARD}>
                    <div style={{ display: "grid", gridTemplateColumns: ROW_GRID, gap: 12, padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_FAINT }}>
                      <span>ファイル名</span>
                      <span>種類</span>
                      <span>サイズ</span>
                      <span>更新日</span>
                      <span>ステータス</span>
                      <span></span>
                    </div>
                    {documents.map((doc, i) => {
                      const sc = resolveStatusColor(doc.status);
                      const tc = resolveTypeColor(doc.type);
                      return (
                        <div
                          key={i}
                          onClick={() => setSelectedDoc(i)}
                          style={{
                            display: "grid",
                            gridTemplateColumns: ROW_GRID,
                            gap: 12,
                            padding: "12px 16px",
                            alignItems: "center",
                            borderBottom: i < documents.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none",
                            cursor: "pointer",
                            background: selectedDoc === i ? SUBTLE_BG : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedDoc !== i) e.currentTarget.style.background = "#fafbfc";
                          }}
                          onMouseLeave={(e) => {
                            if (selectedDoc !== i) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                            <div style={{ width: 28, height: 28, borderRadius: 4, flexShrink: 0, background: tc + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: tc }}>
                              {doc.type}
                            </div>
                            <div style={{ overflow: "hidden" }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: T_BODY, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                                {doc.name}
                              </div>
                              <div style={{ fontSize: 10, color: T_FAINT }}>
                                {doc.author} · {doc.version}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, color: T_MUTED }}>{doc.type}</span>
                          <span style={{ fontSize: 11, color: T_MUTED }}>{doc.size}</span>
                          <span style={{ fontSize: 11, color: T_MUTED }}>{doc.date}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: sc.bg, color: sc.color, justifySelf: "start" }}>
                            {doc.status}
                          </span>
                          <button aria-label="詳細を表示" style={{ padding: 4, border: "none", background: "transparent", cursor: "pointer", color: T_FAINT }}>
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {detailDoc !== null && (
                  <div style={{ ...CARD, padding: 0, position: "sticky", top: 24 }}>
                    <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>ファイル詳細</span>
                      <button onClick={() => setSelectedDoc(null)} aria-label="閉じる" style={{ border: "none", background: "transparent", cursor: "pointer", color: T_FAINT }}>
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ height: 180, borderRadius: 8, background: BORDER_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, marginBottom: 16, border: "1px dashed #d1d5db" }}>
                        <FileText className="h-8 w-8" style={{ color: T_FAINT }} />
                        <span style={{ fontSize: 11, color: T_FAINT }}>プレビュー</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T_BODY, marginBottom: 12 }}>{detailDoc.name}</div>
                      {(
                        [
                          ["種類", detailDoc.type],
                          ["サイズ", detailDoc.size],
                          ["作成者", detailDoc.author],
                          ["バージョン", detailDoc.version],
                          ["更新日", detailDoc.date],
                        ] as const
                      ).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${BORDER_LIGHT}` }}>
                          <span style={{ color: T_FAINT }}>{k}</span>
                          <span style={{ color: T_BODY, fontWeight: 500 }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                        <button style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", background: "#1a56db", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          開く
                        </button>
                        <button style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: `1px solid ${BORDER}`, background: "#fff", color: T_SECOND, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                          ダウンロード
                        </button>
                      </div>
                      <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#f5f3ff", border: "1px solid #ede9fe" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                          <Brain className="h-3 w-3" aria-hidden="true" />
                          AI要約
                        </div>
                        <div style={{ fontSize: 11, color: T_SECOND, lineHeight: 1.6 }}>
                          7階鉄骨配置図の最新版。前版からの変更点：梁接合部のボルト仕様変更（M22→M24）。
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── CAD図面 ──────────────────────────────────────────────────── */}
            <div style={panelStyle}>
              <PanelHeading icon={<FileText className="h-[18px] w-[18px]" style={{ color: "#1a56db" }} />} title="CAD図面" desc="DWG / DXF 図面の版管理・作成者・承認状況" />
              <MetricGrid
                cols={4}
                items={[
                  { l: "図面総数", v: "318", c: "#1a56db" },
                  { l: "承認済", v: "264", c: "#16a34a" },
                  { l: "承認待ち", v: "41", c: "#f97316" },
                  { l: "新規", v: "13", c: "#7c3aed" },
                ]}
              />
              <Table
                cols={["図面番号", "図面名", "縮尺", "作成者", "版", "承認"]}
                grid="80px 1fr 70px 70px 60px 80px"
                rows={cadDrawings}
                render={(d) => {
                  const sc = resolveStatusColor(d.status);
                  return (
                    <>
                      <span style={{ fontWeight: 600, color: "#1a56db" }}>{d.no}</span>
                      <span style={{ fontWeight: 500, color: T_BODY }}>{d.name}</span>
                      <span style={{ color: T_MUTED }}>{d.scale}</span>
                      <span style={{ color: T_MUTED }}>{d.author}</span>
                      <span style={{ color: T_MUTED }}>{d.version}</span>
                      <Badge text={d.status} bg={sc.bg} color={sc.color} />
                    </>
                  );
                }}
              />
            </div>

            {/* ── BIM/CIM ──────────────────────────────────────────────────── */}
            <div style={panelStyle}>
              <PanelHeading icon={<Box className="h-[18px] w-[18px]" style={{ color: "#7c3aed" }} />} title="BIM/CIM" desc="統合モデルの LOD・構成要素・フェーズ管理" />
              <MetricGrid
                cols={4}
                items={[
                  { l: "登録モデル", v: "12", c: "#7c3aed" },
                  { l: "総要素数", v: "490K", c: "#1a56db" },
                  { l: "干渉チェック", v: "8件", c: "#f97316" },
                  { l: "最新LOD", v: "400", c: "#16a34a" },
                ]}
              />
              <Table
                cols={["モデル名", "LOD", "構成要素", "サイズ", "フェーズ"]}
                grid="1fr 80px 90px 80px 100px"
                rows={bimModels}
                render={(m) => (
                  <>
                    <span style={{ fontWeight: 600, color: T_BODY }}>{m.name}</span>
                    <Badge text={m.lod} bg="#f5f3ff" color="#7c3aed" />
                    <span style={{ color: T_MUTED }}>{m.elements}</span>
                    <span style={{ color: T_MUTED }}>{m.size}</span>
                    <span style={{ color: T_SECOND }}>{m.phase}</span>
                  </>
                )}
              />
            </div>

            {/* ── 写真管理 ─────────────────────────────────────────────────── */}
            <div style={panelStyle}>
              <PanelHeading icon={<Camera className="h-[18px] w-[18px]" style={{ color: "#16a34a" }} />} title="写真管理" desc="工事写真の電子小黒板・位置情報・アルバム整理" />
              <MetricGrid
                cols={4}
                items={[
                  { l: "総写真数", v: "12,840", c: "#1a56db" },
                  { l: "本日撮影", v: "186", c: "#16a34a" },
                  { l: "位置情報付", v: "94%", c: "#7c3aed" },
                  { l: "未整理", v: "32", c: "#f97316" },
                ]}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 12 }}>
                {photoAlbums.map((a) => (
                  <div key={a.name} style={{ ...CARD, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Camera className="h-5 w-5" style={{ color: "#16a34a" }} />
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T_BODY, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{a.name}</div>
                      <div style={{ fontSize: 10, color: T_FAINT, marginTop: 2 }}>{a.count}枚 · {a.date} · GPS{a.geo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 動画管理 ─────────────────────────────────────────────────── */}
            <div style={panelStyle}>
              <PanelHeading icon={<Video className="h-[18px] w-[18px]" style={{ color: "#dc2626" }} />} title="動画管理" desc="施工記録・タイムラプス・空撮動画の保管" />
              <MetricGrid
                cols={4}
                items={[
                  { l: "総動画数", v: "248", c: "#1a56db" },
                  { l: "総容量", v: "1.2TB", c: "#7c3aed" },
                  { l: "4K動画", v: "86", c: "#dc2626" },
                  { l: "本日追加", v: "5", c: "#16a34a" },
                ]}
              />
              <Table
                cols={["動画名", "長さ", "解像度", "サイズ", "撮影日"]}
                grid="1fr 80px 80px 90px 100px"
                rows={videoClips}
                render={(v) => (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 4, flexShrink: 0, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Video className="h-3.5 w-3.5" style={{ color: "#dc2626" }} />
                      </div>
                      <span style={{ fontWeight: 500, color: T_BODY, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{v.name}</span>
                    </div>
                    <span style={{ color: T_MUTED }}>{v.duration}</span>
                    <Badge text={v.res} bg={v.res === "4K" ? "#fef2f2" : "#f1f5f9"} color={v.res === "4K" ? "#991b1b" : "#475569"} />
                    <span style={{ color: T_MUTED }}>{v.size}</span>
                    <span style={{ color: T_MUTED }}>{v.date}</span>
                  </>
                )}
              />
            </div>

            {/* ── OCR ──────────────────────────────────────────────────────── */}
            <div style={panelStyle}>
              <PanelHeading icon={<ScanLine className="h-[18px] w-[18px]" style={{ color: "#7c3aed" }} />} title="OCR" desc="文書・手書き帳票の文字認識結果と信頼度" />
              <MetricGrid
                cols={3}
                items={[
                  { l: "処理済み文書", v: "2,481", c: "#1a56db" },
                  { l: "平均認識精度", v: "94.7%", c: "#16a34a" },
                  { l: "要確認", v: "18", c: "#f97316" },
                ]}
              />
              <Table
                cols={["文書", "認識文字数", "信頼度", "状態"]}
                grid="1fr 90px 90px 90px"
                rows={ocrResults}
                render={(o) => {
                  const high = o.confidence >= 95;
                  return (
                    <>
                      <span style={{ fontWeight: 500, color: T_BODY, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{o.doc}</span>
                      <span style={{ color: T_MUTED }}>{o.chars.toLocaleString()}字</span>
                      <span style={{ fontWeight: 600, color: high ? "#16a34a" : "#f97316" }}>{o.confidence}%</span>
                      <Badge text={o.status} bg={o.status === "完了" ? "#dcfce7" : "#fff7ed"} color={o.status === "完了" ? "#166534" : "#92400e"} />
                    </>
                  );
                }}
              />
            </div>

            {/* ── 電子黒板 ─────────────────────────────────────────────────── */}
            <div style={panelStyle}>
              <PanelHeading icon={<PenLine className="h-[18px] w-[18px]" style={{ color: "#1a56db" }} />} title="電子黒板" desc="工事写真に紐づく電子小黒板の記録・承認" />
              <MetricGrid
                cols={4}
                items={[
                  { l: "黒板記録数", v: "1,284", c: "#1a56db" },
                  { l: "本日記録", v: "42", c: "#16a34a" },
                  { l: "承認待ち", v: "9", c: "#f97316" },
                  { l: "テンプレート", v: "24", c: "#7c3aed" },
                ]}
              />
              <Table
                cols={["工事箇所", "測定項目", "検査員", "記録日", "状態"]}
                grid="1fr 1fr 80px 100px 90px"
                rows={boardEntries}
                render={(b) => (
                  <>
                    <span style={{ fontWeight: 600, color: T_BODY }}>{b.site}</span>
                    <span style={{ color: T_SECOND }}>{b.item}</span>
                    <span style={{ color: T_MUTED }}>{b.inspector}</span>
                    <span style={{ color: T_MUTED }}>{b.date}</span>
                    <Badge text={b.status} bg={b.status === "記録済" ? "#dcfce7" : "#fff7ed"} color={b.status === "記録済" ? "#166534" : "#92400e"} />
                  </>
                )}
              />
            </div>

            {/* ── 電子納品 ─────────────────────────────────────────────────── */}
            <div style={panelStyle}>
              <PanelHeading icon={<Download className="h-[18px] w-[18px]" style={{ color: "#16a34a" }} />} title="電子納品" desc="CALS/EC・i-Construction 準拠の納品成果物進捗" />
              <MetricGrid
                cols={4}
                items={[
                  { l: "納品成果物", v: "5", c: "#1a56db" },
                  { l: "平均進捗", v: "78%", c: "#16a34a" },
                  { l: "適合率", v: "96%", c: "#7c3aed" },
                  { l: "要修正", v: "3", c: "#f97316" },
                ]}
              />
              <div style={{ ...CARD, padding: 16 }}>
                {deliverItems.map((d, i) => (
                  <div key={d.item} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < deliverItems.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none" }}>
                    <div style={{ width: 200, overflow: "hidden" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{d.item}</div>
                      <div style={{ fontSize: 10, color: T_FAINT, marginTop: 2 }}>{d.standard}</div>
                    </div>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: BORDER_LIGHT, overflow: "hidden" }}>
                      <div style={{ width: `${d.progress}%`, height: "100%", borderRadius: 4, background: d.progress === 100 ? "#16a34a" : "#1a56db" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: d.progress === 100 ? "#16a34a" : "#1a56db", width: 44, textAlign: "right" }}>{d.progress}%</span>
                    <span style={{ fontSize: 11, color: T_MUTED, width: 60 }}>{d.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── バージョン管理 ───────────────────────────────────────────── */}
            <div style={panelStyle}>
              <PanelHeading icon={<GitBranch className="h-[18px] w-[18px]" style={{ color: "#7c3aed" }} />} title="バージョン管理" desc="図面・文書の改訂履歴と変更内容の追跡" />
              <MetricGrid
                cols={4}
                items={[
                  { l: "管理対象", v: "1,842", c: "#1a56db" },
                  { l: "本日改訂", v: "14", c: "#16a34a" },
                  { l: "平均版数", v: "2.4", c: "#7c3aed" },
                  { l: "ロック中", v: "6", c: "#f97316" },
                ]}
              />
              <div style={{ ...CARD, padding: 16 }}>
                {versionHistory.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < versionHistory.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2 }}>
                      <History className="h-4 w-4" style={{ color: "#7c3aed" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>{h.file}</span>
                        <Badge text={h.version} bg="#f5f3ff" color="#7c3aed" />
                      </div>
                      <div style={{ fontSize: 11, color: T_SECOND, marginTop: 4 }}>{h.note}</div>
                      <div style={{ fontSize: 10, color: T_FAINT, marginTop: 2 }}>{h.author} · {h.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── AI文書検索 ───────────────────────────────────────────────── */}
            <div style={panelStyle}>
              <PanelHeading icon={<Brain className="h-[18px] w-[18px]" style={{ color: "#7c3aed" }} />} title="AI文書検索" desc="全文書を横断するセマンティック検索とAI要約" />
              <div style={{ ...CARD, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, background: SUBTLE_BG }}>
                <Search className="h-4 w-4" style={{ color: T_FAINT }} aria-hidden="true" />
                <input
                  aria-label="自然言語で検索"
                  placeholder="自然言語で検索... 例: ボルト仕様の変更点は?"
                  style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: T_BODY, flex: 1, fontFamily: "inherit" }}
                />
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#7c3aed", color: "#fff", fontWeight: 600 }}>AI</span>
              </div>
              <MetricGrid
                cols={3}
                items={[
                  { l: "索引済み文書", v: "12,840", c: "#1a56db" },
                  { l: "平均応答", v: "0.8秒", c: "#16a34a" },
                  { l: "本日検索", v: "327", c: "#7c3aed" },
                ]}
              />
              <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 10 }}>関連文書 ({aiSearchResults.length}件)</div>
              {aiSearchResults.map((r) => (
                <div key={r.title} style={{ ...CARD, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText className="h-4 w-4" style={{ color: "#7c3aed" }} />
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: T_SECOND, marginTop: 2, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{r.snippet}</div>
                    <div style={{ fontSize: 10, color: T_FAINT, marginTop: 2 }}>{r.source}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#16a34a" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{r.relevance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
