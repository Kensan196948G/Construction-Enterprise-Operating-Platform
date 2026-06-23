"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  CloudSun,
  Database,
  FileText,
  GitBranch,
  Globe2,
  HardHat,
  MapPin,
  RadioTower,
  Search,
  Shield,
  Ship,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

type Metric = {
  label: string;
  value: string;
  note: string;
  tone: "blue" | "green" | "amber" | "red" | "violet" | "cyan";
};

type DetailTab = {
  id: string;
  label: string;
  route: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  metrics: Metric[];
  rows: Array<Record<string, string>>;
  columns: string[];
  insight: string;
  visual?: "map" | "chart" | "viewer" | "timeline" | "chat";
};

type DetailSection = {
  title: string;
  description: string;
  tabs: DetailTab[];
};

const toneClass: Record<Metric["tone"], string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
};

const baseRows = {
  projects: [
    { name: "品川タワー新築工事", owner: "東京支店", status: "施工中", value: "68%" },
    { name: "横浜分譲マンション", owner: "神奈川支店", status: "注意", value: "42%" },
    { name: "大田区土木工事", owner: "東京支店", status: "順調", value: "85%" },
    { name: "千葉港湾整備", owner: "港湾事業部", status: "海上作業", value: "35%" },
  ],
  approvals: [
    { name: "施工計画書（躯体工事）", owner: "田中 健一", status: "部長承認待ち", value: "高" },
    { name: "資材発注書（鉄筋 SD345）", owner: "渡辺 誠", status: "課長承認待ち", value: "中" },
    { name: "クレーン作業許可", owner: "佐藤 太郎", status: "安全確認", value: "高" },
    { name: "設計変更申請（基礎構造）", owner: "山田 花子", status: "技術審査", value: "中" },
  ],
  security: [
    { name: "ブルートフォース", owner: "203.0.113.55", status: "ブロック済", value: "High" },
    { name: "ポートスキャン", owner: "198.51.100.77", status: "監視中", value: "Medium" },
    { name: "マルウェア検知", owner: "PC-FIELD-023", status: "隔離済", value: "High" },
    { name: "VPN異常接続", owner: "172.16.99.1", status: "解決済", value: "Medium" },
  ],
};

const metrics = {
  standard: [
    { label: "処理件数", value: "1,248", note: "本日 +86", tone: "blue" },
    { label: "正常率", value: "98.7%", note: "SLA内", tone: "green" },
    { label: "要確認", value: "12", note: "優先 3件", tone: "amber" },
    { label: "AI支援", value: "ON", note: "自動分類中", tone: "violet" },
  ] satisfies Metric[],
  field: [
    { label: "稼働現場", value: "13", note: "本日稼働", tone: "blue" },
    { label: "作業員", value: "186", note: "入場済", tone: "green" },
    { label: "安全指摘", value: "3", note: "是正中", tone: "amber" },
    { label: "写真追加", value: "642", note: "AI分類済", tone: "cyan" },
  ] satisfies Metric[],
  risk: [
    { label: "検知", value: "5", note: "24時間", tone: "red" },
    { label: "ブロック", value: "2,481", note: "今月", tone: "blue" },
    { label: "EDR", value: "98.5%", note: "保護率", tone: "green" },
    { label: "未解決", value: "2", note: "SLA内", tone: "amber" },
  ] satisfies Metric[],
};

const makeTab = (
  id: string,
  label: string,
  route: string,
  title: string,
  description: string,
  icon: ComponentType<{ className?: string }>,
  options: Partial<DetailTab> = {},
): DetailTab => ({
  id,
  label,
  route,
  title,
  description,
  icon,
  metrics: options.metrics ?? metrics.standard,
  rows: options.rows ?? baseRows.projects,
  columns: options.columns ?? ["名称", "担当", "状態", "値"],
  insight:
    options.insight ??
    "ダミーデータを用いて、現場・経営・監査の判断に必要な主要情報を同一画面へ集約しています。",
  visual: options.visual,
});

const sections: Record<string, DetailSection> = {
  dashboard: {
    title: "ダッシュボード",
    description: "全社、現場、経営、AI、KPIを横断して確認します。",
    tabs: [
      makeTab("all", "全社統合", "all", "全社統合ダッシュボード", "工事、承認、安全、原価、文書を横断表示します。", BarChart3, {
        metrics: [
          { label: "進行中工事", value: "42", note: "全国拠点", tone: "blue" },
          { label: "要承認", value: "73", note: "至急 12", tone: "amber" },
          { label: "安全アラート", value: "9", note: "未対応 4", tone: "red" },
          { label: "原価見通し", value: "97.8%", note: "予算内", tone: "green" },
        ],
        visual: "map",
      }),
      makeTab("field", "現場ダッシュボード", "field", "現場ダッシュボード", "作業員、重機、気象、安全を現場目線で表示します。", HardHat, { metrics: metrics.field, visual: "timeline" }),
      makeTab("exec", "経営ダッシュボード", "exec", "経営ダッシュボード", "売上、粗利、受注残、原価差異を経営目線で表示します。", Building2, { visual: "chart" }),
      makeTab("ai", "AI分析", "ai", "AI分析ダッシュボード", "工程遅延、原価超過、安全リスクをAIでモック分析します。", Brain, { visual: "chart" }),
      makeTab("kpi", "KPI/アラート", "kpi", "KPI/アラート", "工程、安全、原価、品質のKPIと重要アラートを一覧化します。", AlertTriangle, { metrics: metrics.risk }),
    ],
  },
  common: {
    title: "共通基盤",
    description: "認証、ユーザー、API、マスタを横スライドで確認します。",
    tabs: [
      makeTab("auth-entra", "Entra ID", "auth-entra", "Entra ID連携", "Microsoft Entra IDとのユーザー同期、条件付きアクセス、アプリ連携を表示します。", Shield),
      makeTab("auth-ad", "AD連携", "auth-ad", "Active Directory連携", "AD Forest、OU、LDAPS、差分同期の状態を表示します。", Database),
      makeTab("auth-mfa", "MFA", "auth-mfa", "MFA運用", "TOTP、SMS、未設定ユーザー、適用率を確認します。", CheckCircle2),
      makeTab("auth-sso", "SSO", "auth-sso", "SSOアプリ連携", "SAML/OIDC/OAuth連携アプリの状態を一覧化します。", Globe2),
      makeTab("users", "ユーザー一覧", "users", "ユーザー一覧", "社員、協力会社、役職、MFA状態を横断管理します。", Users),
      makeTab("roles", "権限管理", "roles", "ロール・権限管理", "現場監督、経営層、IT管理者、協力会社などの見える範囲を定義します。", Shield),
      makeTab("api", "API一覧", "api", "API一覧", "API Gateway配下のエンドポイント、成功率、遅延を表示します。", RadioTower),
      makeTab("api-logs", "APIログ", "api-logs", "APIログ", "時刻、メソッド、エンドポイント、利用者、結果を表示します。", FileText),
      makeTab("master", "マスタデータ", "master", "マスタデータ", "工種、資材、単価、協力会社、重機などのマスタ件数を表示します。", Database),
      makeTab("config", "システム設定", "config", "システム設定", "システム名、バージョン、認証、DB、イベント基盤の設定を確認します。", Wrench),
    ],
  },
  documents: {
    title: "文書・図面管理",
    description: "PDF、CAD、BIM/CIM、写真、動画、OCR、電子納品を統合管理します。",
    tabs: [
      makeTab("pdf", "PDF管理", "pdf", "PDF管理", "施工計画書、検査記録、報告書をAI要約付きで管理します。", FileText),
      makeTab("cad", "CAD図面", "cad", "CAD図面", "DWG図面の版、作成者、承認状態を表示します。", FileText),
      makeTab("bim", "BIM/CIM", "bim", "BIM/CIMビューア", "3Dモデル、属性、干渉チェック、計測機能をモック表示します。", Building2, { visual: "viewer" }),
      makeTab("photo", "写真管理", "photo", "写真管理", "工事写真アルバム、タグ、撮影者を表示します。", Camera),
      makeTab("video", "動画管理", "video", "動画管理", "現場動画、ドローン映像、タイムラプスを管理します。", Camera),
      makeTab("ocr", "OCR", "ocr", "OCR", "紙文書、PDF、写真をAIで文字認識する画面です。", Search),
      makeTab("board", "電子黒板", "board", "電子黒板", "工事写真撮影黒板テンプレートを作成します。", ClipboardCheck),
      makeTab("deliver", "電子納品", "deliver", "電子納品", "CALS/EC準拠の納品進捗を管理します。", CheckCircle2),
      makeTab("version", "バージョン管理", "version", "バージョン管理", "変更履歴と差分を一覧表示します。", GitBranch),
      makeTab("ai-search", "AI文書検索", "ai-search", "AI文書検索", "自然言語で図面、PDF、BIM属性を横断検索します。", Brain),
    ],
  },
  field: {
    title: "現場DX",
    description: "工事、工程、日報、写真、安全、重機、作業員、ライブ映像を管理します。",
    tabs: [
      makeTab("projects", "工事一覧", "projects", "工事一覧", "工事ごとの進捗、作業員、重機、安全アラートを表示します。", HardHat, { metrics: metrics.field }),
      makeTab("progress", "現場進捗", "progress", "現場進捗", "全工事の進捗率、工程フェーズ、作業人数を比較します。", Activity, { metrics: metrics.field }),
      makeTab("schedule", "工程管理", "schedule", "工程管理", "ガントチャート風の工程と今日位置を表示します。", GitBranch, { visual: "timeline" }),
      makeTab("daily", "作業日報", "daily", "作業日報", "日報の作成、承認、天候、作業内容を管理します。", FileText),
      makeTab("photos", "現場写真", "photos", "現場写真", "工事写真、AIタグ、撮影者、日時を表示します。", Camera),
      makeTab("measure", "出来形管理", "measure", "出来形管理", "設計値と実測値の照合結果を一覧化します。", CheckCircle2),
      makeTab("safety", "安全管理", "safety", "安全管理", "安全パトロール、是正、重大指摘を管理します。", Shield, { metrics: metrics.risk }),
      makeTab("ky", "KY活動", "ky", "KY活動", "危険要因と対策を班別に記録します。", AlertTriangle),
      makeTab("equipment", "重機管理", "equipment", "重機管理", "重機の稼働、点検、GPS、AI自動運転を表示します。", Wrench),
      makeTab("workers", "作業員管理", "workers", "作業員管理", "入退場、資格、会社、配置を表示します。", Users),
      makeTab("live", "現場ライブビュー", "live", "現場ライブビュー", "現場カメラ、タイムラプス、ライブ状態を表示します。", Camera, { visual: "viewer" }),
    ],
  },
  partner: {
    title: "協力会社連携",
    description: "協力会社、入退場、提出書類、安全教育、契約、請求を管理します。",
    tabs: [
      makeTab("list", "協力会社一覧", "list", "協力会社一覧", "会社別のランク、安全スコア、未提出書類を表示します。", Users),
      makeTab("entry", "入退場管理", "entry", "入退場管理", "本日の入場時刻、装備チェック、現場配置を管理します。", HardHat),
      makeTab("docs", "提出書類", "docs", "提出書類", "安全書類、契約書類、資格書類の提出状態を確認します。", FileText),
      makeTab("education", "安全教育", "education", "安全教育", "新規入場者教育、特別教育、講習履歴を管理します。", Shield),
      makeTab("contract", "契約管理", "contract", "契約管理", "協力会社契約、契約形態、評価ランクを表示します。", ClipboardCheck),
      makeTab("invoice", "請求管理", "invoice", "請求管理", "請求金額、対象月、承認状態、支払期限を管理します。", BarChart3),
    ],
  },
  gis: {
    title: "GIS / 地図",
    description: "工事位置、海域、災害、ドローン、点群、ハザード、リアルタイム位置を表示します。",
    tabs: [
      makeTab("projects", "工事位置", "projects", "工事位置", "全国工事の位置、種別、作業員、進捗を地図上に表示します。", MapPin, { visual: "map" }),
      makeTab("ocean", "海域マップ", "ocean", "海域マップ", "作業海域、潮位、波高、海水温を表示します。", Ship, { visual: "map" }),
      makeTab("disaster", "災害情報", "disaster", "災害情報", "地震、台風、大雨、土砂災害の注意情報を重ねます。", AlertTriangle, { visual: "map", metrics: metrics.risk }),
      makeTab("drone", "ドローン地図", "drone", "ドローン地図", "飛行経路、機体、バッテリー、任務状態を表示します。", Camera, { visual: "map" }),
      makeTab("pointcloud", "点群データ", "pointcloud", "点群データ", "LiDAR、ドローン測量の3D点群ビューアです。", Globe2, { visual: "viewer" }),
      makeTab("hazard", "ハザードマップ", "hazard", "ハザードマップ", "浸水、液状化、津波、崖崩れリスクを表示します。", AlertTriangle, { visual: "map", metrics: metrics.risk }),
      makeTab("realtime", "リアルタイム位置", "realtime", "リアルタイム位置", "GPS追跡中の重機、作業車、ドローンを表示します。", RadioTower, { visual: "map" }),
    ],
  },
  ai: {
    title: "AI・分析基盤",
    description: "AIチャット、ナレッジ、OCR、画像解析、予測、異常検知、AI Agentを表示します。",
    tabs: [
      makeTab("chat", "AIチャット", "chat", "AIチャット", "工事、図面、安全、原価について対話する画面です。", Brain, { visual: "chat" }),
      makeTab("knowledge", "ナレッジAI", "knowledge", "ナレッジAI", "手順書、基準書、テンプレートを意味検索します。", Search),
      makeTab("ocr", "OCR AI", "ocr", "OCR AI", "PDF、写真、紙文書から文字を抽出します。", FileText),
      makeTab("vision", "画像解析AI", "vision", "画像解析AI", "安全装備、ひび割れ、立入禁止、配筋異常を検知します。", Camera),
      makeTab("predict", "予測AI", "predict", "予測AI", "完工予定、原価着地、工程遅延を予測します。", BarChart3, { visual: "chart" }),
      makeTab("anomaly", "異常検知AI", "anomaly", "異常検知AI", "重機稼働率、原価消化率、工程遅延の異常スコアを表示します。", AlertTriangle, { metrics: metrics.risk }),
      makeTab("agent", "AI Agent", "agent", "AI Agent", "日報、安全巡視、原価予測、品質検査などの自律Agentを表示します。", Bot),
    ],
  },
  iot: {
    title: "IoT・リアルタイム監視",
    description: "センサ、気象、波浪、水位、Gateway、Edge AI、アラートを管理します。",
    tabs: [
      makeTab("sensors", "センサ一覧", "sensors", "センサ一覧", "波高、風速、水位、温度、振動、騒音センサを表示します。", RadioTower, { visual: "chart" }),
      makeTab("weather", "気象情報", "weather", "気象情報", "気温、風速、降水確率、WBGTを表示します。", CloudSun),
      makeTab("wave", "波浪監視", "wave", "波浪監視", "港湾・海域の有義波高、周期、作業可否を表示します。", Activity, { visual: "chart" }),
      makeTab("water", "水位監視", "water", "水位監視", "排水、河川、地下水の水位を監視します。", Activity),
      makeTab("gateway", "IoT Gateway", "gateway", "IoT Gateway", "ゲートウェイ、接続デバイス、プロトコルを表示します。", RadioTower),
      makeTab("edge", "Edge AI", "edge", "Edge AI", "Jetson等のエッジAIデバイスと推論状態を表示します。", Brain),
      makeTab("alerts", "アラート管理", "alerts", "アラート管理", "センサアラートの確認、対応、履歴を管理します。", AlertTriangle, { metrics: metrics.risk }),
      makeTab("realtime", "リアルタイム監視", "realtime", "リアルタイム監視", "リアルタイムチャートとAI異常検知を表示します。", Zap, { visual: "chart" }),
    ],
  },
  erp: {
    title: "ERP・経営管理",
    description: "原価、予算、契約、購買、売上、労務、在庫、工事台帳、BIを管理します。",
    tabs: [
      makeTab("cost", "原価管理", "cost", "原価管理", "工事別の予算、実績、予測、差異を表示します。", BarChart3, { visual: "chart" }),
      makeTab("budget", "予算管理", "budget", "予算管理", "予算配分、消化率、残額を管理します。", BarChart3),
      makeTab("contract", "契約管理", "contract", "契約管理", "請負契約、工期、契約形態、履行状況を表示します。", ClipboardCheck),
      makeTab("purchase", "購買管理", "purchase", "購買管理", "資材発注、納期、サプライヤー、発注状態を表示します。", Wrench),
      makeTab("sales", "売上管理", "sales", "売上管理", "出来高、請求、回収、売上進捗を表示します。", BarChart3),
      makeTab("labor", "労務管理", "labor", "労務管理", "労務費、勤怠、配置を表示します。", Users),
      makeTab("stock", "在庫管理", "stock", "在庫管理", "資材在庫、発注点、保管場所を管理します。", Database),
      makeTab("ledger", "工事台帳", "ledger", "工事台帳", "契約額、出来高、実行予算、実績原価、粗利率を表示します。", FileText),
      makeTab("bi", "BIレポート", "bi", "BIレポート", "売上推移、原価分析、受注、安全のBIを表示します。", BarChart3, { visual: "chart" }),
    ],
  },
  security: {
    title: "セキュリティ・監査",
    description: "SIEM、SOC、VPN、EDR、OT、インシデント、監査レポートを表示します。",
    tabs: [
      makeTab("siem", "SIEM", "siem", "SIEM", "脅威検知イベント、送信元、対象、深刻度を表示します。", Shield, { rows: baseRows.security, metrics: metrics.risk }),
      makeTab("soc", "SOC", "soc", "SOC", "SOC監視対象、アラート、SLA達成率を表示します。", Activity, { visual: "chart", metrics: metrics.risk }),
      makeTab("vpn", "VPN監視", "vpn", "VPN監視", "VPNアクティブセッション、接続場所、プロトコルを表示します。", Globe2),
      makeTab("edr", "EDR", "edr", "EDR", "端末保護率、隔離、要確認端末を表示します。", Shield, { metrics: metrics.risk }),
      makeTab("ot", "OT監視", "ot", "OT監視", "IoT、重機制御、BAS、SCADA/PLCのOTネットワークを表示します。", RadioTower),
      makeTab("incident", "インシデント", "incident", "インシデント管理", "インシデントID、重要度、状態、担当者を表示します。", AlertTriangle, { rows: baseRows.security, metrics: metrics.risk }),
      makeTab("audit", "監査レポート", "audit", "監査レポート", "ログイン、権限変更、文書操作、バックアップの監査ログを表示します。", FileText),
    ],
  },
  workflow: {
    title: "ワークフロー",
    description: "承認一覧、稟議、作業許可、電子決裁、変更管理をスライド表示します。",
    tabs: [
      makeTab("approval", "承認一覧", "approval", "承認一覧", "承認待ち、期限、申請者、承認ステップを表示します。", ClipboardCheck, { rows: baseRows.approvals, metrics: metrics.standard, visual: "timeline" }),
      makeTab("ringi", "稟議", "ringi", "稟議", "資材発注、外注費、出張申請などの稟議を表示します。", FileText, { rows: baseRows.approvals }),
      makeTab("permit", "作業許可", "permit", "作業許可", "クレーン、高所、火気使用などの作業許可を表示します。", Shield, { rows: baseRows.approvals }),
      makeTab("esign", "電子決裁", "esign", "電子決裁", "電子署名、役員決裁、決裁証跡を表示します。", CheckCircle2, { rows: baseRows.approvals }),
      makeTab("change", "変更管理", "change", "変更管理", "設計変更、工程変更、発注者確認を表示します。", GitBranch, { rows: baseRows.approvals }),
    ],
  },
  robotics: {
    title: "自動化・ロボティクス",
    description: "自動施工、ドローン、ROV、デジタルツインを順番に表示します。",
    tabs: [
      makeTab("auto", "自動施工", "auto", "自動施工", "自動ブルドーザ、振動ローラ、マシンガイダンスを表示します。", HardHat, { visual: "timeline" }),
      makeTab("drone", "ドローン", "drone", "ドローン", "機体、飛行状態、バッテリー、任務を表示します。", Camera, { visual: "map" }),
      makeTab("rov", "ROV", "rov", "ROV", "水中ロボット、深度、水温、視界、映像記録を表示します。", Ship, { visual: "viewer" }),
      makeTab("twin", "デジタルツイン", "twin", "デジタルツイン", "BIM/CIM、IoT、GISを統合した3Dモックビューです。", Globe2, { visual: "viewer" }),
    ],
  },
  system: {
    title: "システム管理",
    description: "サーバ、DB、バックアップ、API状態、DevOpsを表示します。",
    tabs: [
      makeTab("server", "サーバ監視", "server", "サーバ監視", "Kubernetes、DB、Redis、Kafka、MinIOの稼働を表示します。", Activity),
      makeTab("db", "DB管理", "db", "DB管理", "PostgreSQL、TimescaleDB、接続数、レプリケーションを表示します。", Database),
      makeTab("backup", "バックアップ", "backup", "バックアップ", "DB、MinIO、Elasticsearch、Redis、etcdのバックアップを表示します。", CheckCircle2),
      makeTab("api-status", "API状態", "api-status", "API状態", "API Gateway、Auth、Workflow、各エンドポイントの健康状態を表示します。", RadioTower, { metrics: metrics.risk }),
      makeTab("devops", "DevOps/CI-CD", "devops", "DevOps/CI-CD", "GitHub Actions、ビルド、テスト、デプロイ状態を表示します。", GitBranch),
    ],
  },
};

function MetricCards({ tab }: { tab: DetailTab }) {
  const MetricIcon = tab.icon;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {tab.metrics.map((metric) => (
        <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className={`inline-flex rounded-lg p-2 ring-1 ${toneClass[metric.tone]}`}>
            <MetricIcon className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-950">{metric.value}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{metric.label}</p>
          <p className="mt-1 text-xs text-slate-500">{metric.note}</p>
        </div>
      ))}
    </div>
  );
}

function Visual({ type }: { type?: DetailTab["visual"] }) {
  if (type === "chat") {
    return (
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="max-w-[82%] rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
          Construction Enterprise OS AIです。工事、図面、安全、原価について質問できます。
        </div>
        <div className="ml-auto max-w-[82%] rounded-lg bg-blue-600 p-3 text-sm text-white">
          品川タワーの工程遅延リスクを教えて
        </div>
        <div className="max-w-[82%] rounded-lg border border-violet-100 bg-violet-50 p-3 text-sm text-slate-700">
          鉄骨建方が2日遅延する可能性があります。クレーン作業は15時以降の風速予報を確認してください。
        </div>
      </div>
    );
  }

  if (type === "map") {
    return (
      <div className="relative h-72 overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50">
        <div className="absolute left-[48%] top-[7%] h-[88%] w-[22%] -rotate-12 rounded-[48%] border border-slate-300 bg-white/70" />
        <div className="absolute left-[20%] top-[48%] h-[34%] w-[42%] -rotate-12 rounded-[45%] border border-slate-300 bg-white/60" />
        {[
          ["品川", "14", "60%", "50%", "bg-blue-600"],
          ["横浜", "9", "48%", "63%", "bg-emerald-600"],
          ["大田", "5", "55%", "59%", "bg-amber-500"],
          ["千葉", "4", "70%", "46%", "bg-violet-600"],
          ["港湾", "3", "76%", "58%", "bg-cyan-600"],
        ].map(([city, count, left, top, color]) => (
          <div key={city} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
            <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md ${color}`}>
              {count}
            </div>
            <p className="mt-1 rounded bg-white/90 px-1.5 py-0.5 text-center text-[10px] font-semibold text-slate-700 shadow-sm">
              {city}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (type === "viewer") {
    return (
      <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-lg bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(96,165,250,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.16)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="relative h-40 w-40 rotate-[-12deg] border border-blue-300/70">
          <div className="absolute -right-8 -top-8 h-40 w-40 border border-cyan-300/50" />
          <div className="absolute left-0 top-1/4 h-px w-full bg-blue-300/40" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-blue-300/40" />
          <div className="absolute left-0 top-3/4 h-px w-full bg-blue-300/40" />
        </div>
        <div className="absolute bottom-5 text-center">
          <p className="text-sm font-bold text-blue-200">3D / BIM / Digital Twin Viewer</p>
          <p className="mt-1 text-xs text-slate-400">ダミー3Dワイヤーフレーム表示</p>
        </div>
      </div>
    );
  }

  if (type === "timeline") {
    return (
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        {["申請", "課長確認", "部長承認", "完了"].map((step, index) => (
          <div key={step} className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${index < 2 ? "bg-emerald-500" : index === 2 ? "bg-blue-600" : "bg-slate-300"}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">{step}</p>
              <p className="text-xs text-slate-500">{index < 2 ? "完了" : index === 2 ? "対応中" : "待機"}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <svg viewBox="0 0 600 180" className="h-52 w-full">
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="0" y1={20 + i * 45} x2="600" y2={20 + i * 45} stroke="#e2e8f0" />
        ))}
        <path d="M0 145 L55 130 L110 136 L165 105 L220 112 L275 82 L330 90 L385 65 L440 72 L495 48 L550 54 L600 32" fill="none" stroke="#1a56db" strokeWidth="4" />
        <path d="M0 145 L55 130 L110 136 L165 105 L220 112 L275 82 L330 90 L385 65 L440 72 L495 48 L550 54 L600 32 L600 180 L0 180 Z" fill="#1a56db18" />
      </svg>
    </div>
  );
}

function DetailTable({ tab }: { tab: DetailTab }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
          <tr>
            {tab.columns.map((column) => (
              <th key={column} className="px-4 py-3">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tab.rows.map((row, index) => (
            <tr key={`${row.name}-${index}`}>
              <td className="px-4 py-3 font-semibold text-slate-950">{row.name}</td>
              <td className="px-4 py-3 text-slate-600">{row.owner}</td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-3 font-semibold text-blue-700">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DesignMockPage({
  category,
  item,
}: {
  category: string;
  item: string;
}) {
  const section = sections[category] ?? sections.dashboard;
  const activeIndex = Math.max(
    0,
    section.tabs.findIndex((tab) => tab.route === item || tab.id === item),
  );
  const activeTab = section.tabs[activeIndex] ?? section.tabs[0];
  const Icon = activeTab.icon;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                  Claude Design 実装
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                  モックデータ
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold text-slate-950">{section.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {section.description}
              </p>
            </div>
            <div className="flex min-w-[230px] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">表示中</p>
                <p className="text-sm font-bold text-slate-950">{activeTab.label}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto border-b border-slate-200 px-2">
            <div className="flex min-w-max gap-1">
              {section.tabs.map((tab) => {
                const TabIcon = tab.icon;
                const active = tab.id === activeTab.id;
                return (
                  <Link
                    key={tab.id}
                    href={`/design/${category}/${tab.route}`}
                    className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
                      active
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {section.tabs.map((tab) => (
                <div key={tab.id} className="min-w-full flex-shrink-0 p-5">
                  <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-lg font-bold text-slate-950">{tab.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {tab.description}
                        </p>
                      </div>

                      <MetricCards tab={tab} />

                      <DetailTable tab={tab} />
                    </div>

                    <div className="space-y-5">
                      <Visual type={tab.visual} />
                      <div className="rounded-lg border border-violet-100 bg-violet-50 p-4">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-violet-700" />
                          <h3 className="text-sm font-bold text-violet-800">AI補助コメント</h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{tab.insight}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {["承認", "通知", "CSV", "詳細"].map((action) => (
                          <button
                            key={action}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
