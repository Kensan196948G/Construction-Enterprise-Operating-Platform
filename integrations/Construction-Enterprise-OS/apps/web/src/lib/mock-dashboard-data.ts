import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Building2,
  Camera,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  HardHat,
  MapPin,
  RadioTower,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";

export type StatCard = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  color: string;
};

export type ProjectSnapshot = {
  name: string;
  branch: string;
  manager: string;
  progress: number;
  budgetUsed: number;
  safetyScore: string;
  status: "順調" | "注意" | "要確認";
};

export const mockStats: StatCard[] = [
  {
    label: "稼働中の工事",
    value: "42",
    note: "本社 8 / 支店 19 / 現場 15",
    icon: Building2,
    color: "blue",
  },
  {
    label: "本日の作業班",
    value: "186",
    note: "入場済 1,248 名、未入場 32 名",
    icon: Users,
    color: "emerald",
  },
  {
    label: "承認待ち",
    value: "73",
    note: "至急 12、監査確認 6",
    icon: ClipboardCheck,
    color: "amber",
  },
  {
    label: "安全アラート",
    value: "9",
    note: "熱中症 4、重機接近 3、高所 2",
    icon: AlertTriangle,
    color: "red",
  },
  {
    label: "図面・写真",
    value: "18,420",
    note: "本日追加 642 件",
    icon: Camera,
    color: "cyan",
  },
  {
    label: "原価見通し",
    value: "97.8%",
    note: "予算内 35 件、要説明 7 件",
    icon: Banknote,
    color: "violet",
  },
];

export const projectSnapshots: ProjectSnapshot[] = [
  {
    name: "首都圏環状道路 橋梁下部工",
    branch: "東京支店",
    manager: "佐藤 現場所長",
    progress: 68,
    budgetUsed: 61,
    safetyScore: "A",
    status: "順調",
  },
  {
    name: "大阪湾岸 物流センター造成",
    branch: "関西支店",
    manager: "山本 工事長",
    progress: 44,
    budgetUsed: 52,
    safetyScore: "B",
    status: "注意",
  },
  {
    name: "仙台市雨水幹線シールド",
    branch: "東北支店",
    manager: "伊藤 監理技術者",
    progress: 31,
    budgetUsed: 29,
    safetyScore: "A",
    status: "順調",
  },
  {
    name: "福岡空港アクセス道路改良",
    branch: "九州支店",
    manager: "中村 現場代理人",
    progress: 82,
    budgetUsed: 91,
    safetyScore: "C",
    status: "要確認",
  },
  {
    name: "品川タワー新築工事",
    branch: "東京支店",
    manager: "田中 現場所長",
    progress: 73,
    budgetUsed: 68,
    safetyScore: "A",
    status: "順調",
  },
  {
    name: "横浜分譲マンション建設",
    branch: "横浜支店",
    manager: "山田 工事長",
    progress: 55,
    budgetUsed: 49,
    safetyScore: "B",
    status: "順調",
  },
  {
    name: "大田区土木 下水道整備",
    branch: "東京支店",
    manager: "鈴木 監理技術者",
    progress: 38,
    budgetUsed: 41,
    safetyScore: "A",
    status: "順調",
  },
  {
    name: "川崎物流基地 造成工事",
    branch: "関東支店",
    manager: "渡辺 現場代理人",
    progress: 89,
    budgetUsed: 86,
    safetyScore: "B",
    status: "注意",
  },
  {
    name: "千葉港湾 護岸補強工事",
    branch: "千葉支店",
    manager: "高橋 工事長",
    progress: 22,
    budgetUsed: 18,
    safetyScore: "A",
    status: "順調",
  },
];

export const dailyOperations = [
  {
    time: "08:10",
    title: "朝礼・KY活動が完了",
    site: "首都圏環状道路 橋梁下部工",
    owner: "一次協力会社 12社",
    icon: HardHat,
  },
  {
    time: "09:25",
    title: "BIM/CIMモデルの干渉候補を検出",
    site: "大阪湾岸 物流センター造成",
    owner: "設計照査AI",
    icon: BadgeCheck,
  },
  {
    time: "10:40",
    title: "重機接近アラートを現場端末へ通知",
    site: "福岡空港アクセス道路改良",
    owner: "IoTゲートウェイ",
    icon: RadioTower,
  },
  {
    time: "13:15",
    title: "出来形写真 186 件を電子納品フォルダへ分類",
    site: "仙台市雨水幹線シールド",
    owner: "画像AI/OCR",
    icon: FileCheck2,
  },
  {
    time: "15:30",
    title: "監査法人向け証跡パッケージを更新",
    site: "全社統制",
    owner: "内部統制ワークフロー",
    icon: ShieldCheck,
  },
  {
    time: "06:45",
    title: "始業前の重機点検記録を自動収集",
    site: "品川タワー新築工事",
    owner: "機械管理AI",
    icon: ClipboardCheck,
  },
  {
    time: "11:50",
    title: "配筋検査の出来形をAI自動判定（合格）",
    site: "横浜分譲マンション建設",
    owner: "画像AI/出来形管理",
    icon: BadgeCheck,
  },
  {
    time: "16:20",
    title: "協力会社 248 名の入退場ログを締め処理",
    site: "川崎物流基地 造成工事",
    owner: "入退場ゲート連携",
    icon: Users,
  },
];

export const riskItems = [
  {
    label: "熱中症指数",
    value: "WBGT 29.1",
    detail: "屋外作業は休憩間隔を短縮",
    level: "high",
  },
  {
    label: "資材搬入",
    value: "2便遅延",
    detail: "生コン車と鉄筋搬入の再調整",
    level: "medium",
  },
  {
    label: "設計変更",
    value: "5件確認中",
    detail: "発注者回答待ち 2 件",
    level: "medium",
  },
  {
    label: "監査証跡",
    value: "99.4%",
    detail: "承認ログ欠落なし",
    level: "low",
  },
  {
    label: "品質管理",
    value: "2件指摘",
    detail: "コンクリート供試体を再試験中",
    level: "medium",
  },
];

export const regionalSites = [
  { city: "札幌", count: 3, x: "58%", y: "13%" },
  { city: "仙台", count: 5, x: "62%", y: "32%" },
  { city: "東京", count: 14, x: "60%", y: "52%" },
  { city: "名古屋", count: 7, x: "50%", y: "57%" },
  { city: "大阪", count: 9, x: "43%", y: "63%" },
  { city: "広島", count: 4, x: "32%", y: "64%" },
  { city: "福岡", count: 6, x: "23%", y: "72%" },
  { city: "那覇", count: 2, x: "14%", y: "90%" },
];

export const equipmentStatus = [
  { name: "バックホウ", active: 38, maintenance: 3, icon: Truck },
  { name: "クレーン", active: 17, maintenance: 1, icon: Clock3 },
  { name: "測量機器", active: 64, maintenance: 2, icon: MapPin },
  { name: "ダンプトラック", active: 52, maintenance: 4, icon: Truck },
  { name: "高所作業車", active: 28, maintenance: 2, icon: HardHat },
  { name: "コンクリートポンプ車", active: 12, maintenance: 1, icon: RadioTower },
];
