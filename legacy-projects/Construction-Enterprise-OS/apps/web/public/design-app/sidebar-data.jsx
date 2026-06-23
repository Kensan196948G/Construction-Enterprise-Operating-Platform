/* ========================================
   Construction Enterprise OS — Sidebar Menu Data
   3-tier accordion menu structure + role definitions
   ======================================== */

const ROLES = {
  admin: { id: "admin", label: "IT管理者", color: "#7c3aed" },
  field: { id: "field", label: "現場監督", color: "#f97316" },
  exec: { id: "exec", label: "経営層", color: "#1a56db" },
  partner: { id: "partner", label: "協力会社", color: "#16a34a" },
  safety: { id: "safety", label: "安全管理者", color: "#dc2626" },
  maintain: { id: "maintain", label: "維持管理", color: "#92400e" },
};

const MENU_STRUCTURE = [
  {
    id: "dashboard",
    icon: "chart-bar",
    label: "ダッシュボード",
    sections: [
      {
        id: "dash-main",
        label: "統合ダッシュボード",
        defaultOpen: true,
        pages: [
          {
            id: "dash-all",
            label: "全社統合",
            href: "/dashboard",
            badge: null,
          },
          {
            id: "dash-field",
            label: "現場ダッシュボード",
            href: "/dashboard/field",
            badge: null,
          },
          {
            id: "dash-exec",
            label: "経営ダッシュボード",
            href: "/dashboard/exec",
            badge: null,
          },
          {
            id: "dash-ai",
            label: "AI分析",
            href: "/dashboard/ai",
            badge: null,
          },
          {
            id: "dash-kpi",
            label: "KPI/アラート",
            href: "/dashboard/kpi",
            badge: "3",
          },
        ],
      },
    ],
  },
  {
    id: "common",
    icon: "building",
    label: "共通基盤",
    sections: [
      {
        id: "auth",
        label: "認証管理",
        roles: ["admin"],
        pages: [
          { id: "auth-entra", label: "Entra ID", href: "/common/auth/entra" },
          { id: "auth-ad", label: "AD連携", href: "/common/auth/ad" },
          { id: "auth-mfa", label: "MFA", href: "/common/auth/mfa" },
          { id: "auth-sso", label: "SSO", href: "/common/auth/sso" },
        ],
      },
      {
        id: "user-mgmt",
        label: "ユーザー管理",
        roles: ["admin"],
        pages: [
          { id: "user-list", label: "ユーザー一覧", href: "/common/users" },
          { id: "user-roles", label: "権限管理", href: "/common/roles" },
        ],
      },
      {
        id: "api-mgmt",
        label: "API管理",
        roles: ["admin"],
        pages: [
          { id: "api-list", label: "API一覧", href: "/common/api" },
          { id: "api-logs", label: "APIログ", href: "/common/api/logs" },
        ],
      },
      {
        id: "master",
        label: "マスタ管理",
        roles: ["admin"],
        pages: [
          { id: "master-data", label: "マスタデータ", href: "/common/master" },
          { id: "sys-config", label: "システム設定", href: "/common/config" },
        ],
      },
    ],
  },
  {
    id: "documents",
    icon: "folder",
    label: "文書・図面管理",
    sections: [
      {
        id: "doc-files",
        label: "ファイル管理",
        defaultOpen: true,
        pages: [
          { id: "doc-pdf", label: "PDF管理", href: "/documents/pdf" },
          { id: "doc-cad", label: "CAD図面", href: "/documents/cad" },
          { id: "doc-bim", label: "BIM/CIM", href: "/documents/bim" },
          { id: "doc-photo", label: "写真管理", href: "/documents/photo" },
          { id: "doc-video", label: "動画管理", href: "/documents/video" },
        ],
      },
      {
        id: "doc-tools",
        label: "ツール",
        pages: [
          { id: "doc-ocr", label: "OCR", href: "/documents/ocr" },
          { id: "doc-board", label: "電子黒板", href: "/documents/board" },
          {
            id: "doc-deliver",
            label: "電子納品",
            href: "/documents/deliver",
            badge: "2",
          },
          {
            id: "doc-ver",
            label: "バージョン管理",
            href: "/documents/version",
          },
          { id: "doc-ai", label: "AI文書検索", href: "/documents/ai-search" },
        ],
      },
    ],
  },
  {
    id: "field-dx",
    icon: "hard-hat",
    label: "現場DX",
    sections: [
      {
        id: "field-proj",
        label: "工事管理",
        defaultOpen: true,
        roles: ["field", "exec", "safety"],
        pages: [
          { id: "field-list", label: "工事一覧", href: "/field/projects" },
          { id: "field-progress", label: "現場進捗", href: "/field/progress" },
          { id: "field-schedule", label: "工程管理", href: "/field/schedule" },
          {
            id: "field-daily",
            label: "作業日報",
            href: "/field/daily",
            badge: "5",
          },
        ],
      },
      {
        id: "field-work",
        label: "現場作業",
        roles: ["field", "safety"],
        pages: [
          { id: "field-photo", label: "現場写真", href: "/field/photos" },
          { id: "field-measure", label: "出来形管理", href: "/field/measure" },
          {
            id: "field-safety",
            label: "安全管理",
            href: "/field/safety",
            badge: "!",
          },
          { id: "field-ky", label: "KY活動", href: "/field/ky" },
        ],
      },
      {
        id: "field-resource",
        label: "リソース管理",
        roles: ["field"],
        pages: [
          { id: "field-equip", label: "重機管理", href: "/field/equipment" },
          { id: "field-worker", label: "作業員管理", href: "/field/workers" },
          { id: "field-live", label: "現場ライブビュー", href: "/field/live" },
        ],
      },
    ],
  },
  {
    id: "partner",
    icon: "handshake",
    label: "協力会社連携",
    sections: [
      {
        id: "partner-mgmt",
        label: "協力会社管理",
        roles: ["field", "partner"],
        pages: [
          { id: "partner-list", label: "協力会社一覧", href: "/partner/list" },
          { id: "partner-entry", label: "入退場管理", href: "/partner/entry" },
          {
            id: "partner-docs",
            label: "提出書類",
            href: "/partner/docs",
            badge: "4",
          },
          { id: "partner-edu", label: "安全教育", href: "/partner/education" },
          {
            id: "partner-contract",
            label: "契約管理",
            href: "/partner/contract",
          },
          {
            id: "partner-invoice",
            label: "請求管理",
            href: "/partner/invoice",
          },
        ],
      },
    ],
  },
  {
    id: "gis",
    icon: "globe",
    label: "GIS / 地図",
    sections: [
      {
        id: "gis-map",
        label: "地図情報",
        pages: [
          { id: "gis-project", label: "工事位置", href: "/gis/projects" },
          { id: "gis-ocean", label: "海域マップ", href: "/gis/ocean" },
          { id: "gis-disaster", label: "災害情報", href: "/gis/disaster" },
          { id: "gis-drone", label: "ドローン地図", href: "/gis/drone" },
          { id: "gis-point", label: "点群データ", href: "/gis/pointcloud" },
          { id: "gis-hazard", label: "ハザードマップ", href: "/gis/hazard" },
          {
            id: "gis-realtime",
            label: "リアルタイム位置",
            href: "/gis/realtime",
          },
        ],
      },
    ],
  },
  {
    id: "ai",
    icon: "brain",
    label: "AI・分析基盤",
    sections: [
      {
        id: "ai-tools",
        label: "AIツール",
        pages: [
          { id: "ai-chat", label: "AIチャット", href: "/ai/chat" },
          { id: "ai-knowledge", label: "ナレッジAI", href: "/ai/knowledge" },
          { id: "ai-ocr", label: "OCR AI", href: "/ai/ocr" },
          { id: "ai-vision", label: "画像解析AI", href: "/ai/vision" },
          { id: "ai-predict", label: "予測AI", href: "/ai/predict" },
          { id: "ai-anomaly", label: "異常検知AI", href: "/ai/anomaly" },
          { id: "ai-agent", label: "AI Agent", href: "/ai/agent" },
        ],
      },
    ],
  },
  {
    id: "iot",
    icon: "signal",
    label: "IoT・リアルタイム監視",
    sections: [
      {
        id: "iot-monitor",
        label: "監視",
        pages: [
          { id: "iot-sensors", label: "センサ一覧", href: "/iot/sensors" },
          { id: "iot-weather", label: "気象情報", href: "/iot/weather" },
          { id: "iot-wave", label: "波浪監視", href: "/iot/wave" },
          { id: "iot-water", label: "水位監視", href: "/iot/water" },
          { id: "iot-gateway", label: "IoT Gateway", href: "/iot/gateway" },
          { id: "iot-edge", label: "Edge AI", href: "/iot/edge" },
          {
            id: "iot-alerts",
            label: "アラート管理",
            href: "/iot/alerts",
            badge: "3",
          },
          {
            id: "iot-realtime",
            label: "リアルタイム監視",
            href: "/iot/realtime",
          },
        ],
      },
    ],
  },
  {
    id: "erp",
    icon: "building-2",
    label: "ERP・経営管理",
    sections: [
      {
        id: "erp-finance",
        label: "財務管理",
        roles: ["exec"],
        pages: [
          { id: "erp-cost", label: "原価管理", href: "/erp/cost" },
          { id: "erp-budget", label: "予算管理", href: "/erp/budget" },
          { id: "erp-contract", label: "契約管理", href: "/erp/contract" },
          { id: "erp-purchase", label: "購買管理", href: "/erp/purchase" },
          { id: "erp-sales", label: "売上管理", href: "/erp/sales" },
        ],
      },
      {
        id: "erp-ops",
        label: "業務管理",
        roles: ["exec"],
        pages: [
          { id: "erp-labor", label: "労務管理", href: "/erp/labor" },
          { id: "erp-stock", label: "在庫管理", href: "/erp/stock" },
          { id: "erp-ledger", label: "工事台帳", href: "/erp/ledger" },
          { id: "erp-bi", label: "BIレポート", href: "/erp/bi" },
        ],
      },
    ],
  },
  {
    id: "security",
    icon: "shield",
    label: "セキュリティ・監査",
    sections: [
      {
        id: "sec-monitor",
        label: "監視",
        roles: ["admin"],
        pages: [
          { id: "sec-siem", label: "SIEM", href: "/security/siem" },
          { id: "sec-soc", label: "SOC", href: "/security/soc" },
          { id: "sec-vpn", label: "VPN監視", href: "/security/vpn" },
          { id: "sec-edr", label: "EDR", href: "/security/edr" },
          { id: "sec-ot", label: "OT監視", href: "/security/ot" },
          {
            id: "sec-incident",
            label: "インシデント",
            href: "/security/incident",
          },
          { id: "sec-audit", label: "監査レポート", href: "/security/audit" },
        ],
      },
    ],
  },
  {
    id: "workflow",
    icon: "git-branch",
    label: "ワークフロー",
    sections: [
      {
        id: "wf-process",
        label: "承認プロセス",
        pages: [
          {
            id: "wf-approval",
            label: "承認一覧",
            href: "/workflow/approval",
            badge: "5",
          },
          { id: "wf-ringi", label: "稟議", href: "/workflow/ringi" },
          { id: "wf-permit", label: "作業許可", href: "/workflow/permit" },
          { id: "wf-esign", label: "電子決裁", href: "/workflow/esign" },
          { id: "wf-change", label: "変更管理", href: "/workflow/change" },
        ],
      },
    ],
  },
  {
    id: "robotics",
    icon: "bot",
    label: "自動化・ロボティクス",
    sections: [
      {
        id: "robo-ops",
        label: "ロボティクス",
        pages: [
          { id: "robo-auto", label: "自動施工", href: "/robotics/auto" },
          { id: "robo-drone", label: "ドローン", href: "/robotics/drone" },
          { id: "robo-rov", label: "ROV", href: "/robotics/rov" },
          { id: "robo-twin", label: "デジタルツイン", href: "/robotics/twin" },
        ],
      },
    ],
  },
  {
    id: "system",
    icon: "settings",
    label: "システム管理",
    sections: [
      {
        id: "sys-ops",
        label: "運用",
        roles: ["admin"],
        pages: [
          { id: "sys-server", label: "サーバ監視", href: "/system/server" },
          { id: "sys-db", label: "DB管理", href: "/system/db" },
          { id: "sys-backup", label: "バックアップ", href: "/system/backup" },
          { id: "sys-api", label: "API状態", href: "/system/api-status" },
          { id: "sys-devops", label: "DevOps/CI-CD", href: "/system/devops" },
        ],
      },
    ],
  },
];

// Role-based default open categories
const ROLE_DEFAULTS = {
  admin: ["common", "security", "system"],
  field: ["field-dx", "documents", "partner"],
  exec: ["dashboard", "erp"],
  partner: ["partner"],
  safety: ["field-dx", "iot"],
  maintain: ["iot", "gis", "documents"],
};

window.MENU_STRUCTURE = MENU_STRUCTURE;
window.ROLES = ROLES;
window.ROLE_DEFAULTS = ROLE_DEFAULTS;
