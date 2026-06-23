"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type Lang = "ja" | "en";

const dict = {
  ja: {
    nav: {
      dashboard: "ダッシュボード",
      issues: "イシュー",
      approvals: "承認",
      aiGovernance: "AI ガバナンス",
      federation: "フェデレーション",
      auditLog: "監査ログ",
    },
    sidebar: {
      signOut: "サインアウト",
      lightMode: "ライトモード",
      darkMode: "ダークモード",
    },
    dashboard: {
      title: "エンタープライズ健全性ダッシュボード",
      subtitle: "Synapse-OS — AI ガバナンス & フェデレーション統制プラットフォーム",
      sprintBadge: "Sprint 8 — G5 フロントエンド認証",
      sprintKpis: "スプリント KPI",
      sprintProgress: "スプリント進捗",
      architectureOverview: "アーキテクチャ概要",
      liveGovernance: "ライブガバナンス",
      apiOffline: "API オフライン — デフォルト値を表示",
      aiActivity: "AI アクティビティ",
      dlpFederation: "DLP & フェデレーション",
      tests: "テスト通過",
      ciStatus: "CI ステータス",
      governanceGate: "ガバナンスゲート",
      releaseTarget: "リリース目標",
      testsCumulative: "Sprint 1〜7 累計",
      ciJobs: "6 ジョブ通過",
      g5Subtitle: "フロントエンド認証 + ダッシュボード",
      pilotRc: "パイロット RC",
      allGreen: "すべて正常",
      g5InProgress: "G5 進行中",
      sprintCol: "スプリント",
      statusCol: "ステータス",
      testsCol: "テスト数",
      descriptionCol: "説明",
      merged: "マージ済み",
      openPr: "PR オープン中",
      inProgress: "進行中",
      planned: "計画中",
      openIssues: "未解決イシュー",
      pendingApprovals: "承認待ち",
      criticalAudit: "重大監査イベント",
      aiActions: "AI アクション数",
      highRisk: "高リスク AI アクション",
      aiBlocks: "AI ブロック（外部）",
      dlpViolations: "DLP 違反",
      federationRequests: "フェデレーションリクエスト",
    },
    auth: {
      pageTitle: "Synapse OS",
      pageSubtitle: "Enterprise Operating Platform",
      formTitle: "アカウントにサインイン",
      emailLabel: "メールアドレス",
      passwordLabel: "パスワード",
      signIn: "サインイン",
      signingIn: "サインイン中…",
      networkError: "ネットワークエラー — 再試行してください",
      devHint: "開発用:",
    },
    service: {
      healthy: "正常",
      degraded: "低下",
      down: "停止",
      services: "サービス",
    },
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      issues: "Issues",
      approvals: "Approvals",
      aiGovernance: "AI Governance",
      federation: "Federation",
      auditLog: "Audit Log",
    },
    sidebar: {
      signOut: "Sign out",
      lightMode: "Light mode",
      darkMode: "Dark mode",
    },
    dashboard: {
      title: "Enterprise Health Dashboard",
      subtitle: "Synapse-OS — AI Governance & Federation Native Platform",
      sprintBadge: "Sprint 8 — G5 Frontend Auth",
      sprintKpis: "Sprint KPIs",
      sprintProgress: "Sprint Progress",
      architectureOverview: "Architecture Overview",
      liveGovernance: "Live Governance",
      apiOffline: "API offline — showing defaults",
      aiActivity: "AI Activity",
      dlpFederation: "DLP & Federation",
      tests: "Tests Passing",
      ciStatus: "CI Status",
      governanceGate: "Governance Gate",
      releaseTarget: "Release Target",
      testsCumulative: "Sprint 1–7 cumulative",
      ciJobs: "6 jobs passing",
      g5Subtitle: "Frontend Auth + Dashboard",
      pilotRc: "Pilot RC",
      allGreen: "All Green",
      g5InProgress: "G5 In Progress",
      sprintCol: "Sprint",
      statusCol: "Status",
      testsCol: "Tests",
      descriptionCol: "Description",
      merged: "Merged",
      openPr: "Open PR",
      inProgress: "In Progress",
      planned: "Planned",
      openIssues: "Open Issues",
      pendingApprovals: "Pending Approvals",
      criticalAudit: "Critical Audit Events",
      aiActions: "AI Actions",
      highRisk: "High AI Risk Actions",
      aiBlocks: "AI Blocks (external)",
      dlpViolations: "DLP Violations",
      federationRequests: "Federation Requests",
    },
    auth: {
      pageTitle: "Synapse OS",
      pageSubtitle: "Enterprise Operating Platform",
      formTitle: "Sign in to your account",
      emailLabel: "Email",
      passwordLabel: "Password",
      signIn: "Sign in",
      signingIn: "Signing in…",
      networkError: "Network error — please try again",
      devHint: "Dev:",
    },
    service: {
      healthy: "Healthy",
      degraded: "Degraded",
      down: "Down",
      services: "Services",
    },
  },
} as const;

// Structural interface so both ja/en satisfy the type without string-literal conflicts.
export interface Translations {
  nav: { dashboard: string; issues: string; approvals: string; aiGovernance: string; federation: string; auditLog: string };
  sidebar: { signOut: string; lightMode: string; darkMode: string };
  dashboard: {
    title: string; subtitle: string; sprintBadge: string;
    sprintKpis: string; sprintProgress: string; architectureOverview: string;
    liveGovernance: string; apiOffline: string; aiActivity: string; dlpFederation: string;
    tests: string; ciStatus: string; governanceGate: string; releaseTarget: string;
    testsCumulative: string; ciJobs: string; g5Subtitle: string; pilotRc: string;
    allGreen: string; g5InProgress: string;
    sprintCol: string; statusCol: string; testsCol: string; descriptionCol: string;
    merged: string; openPr: string; inProgress: string; planned: string;
    openIssues: string; pendingApprovals: string; criticalAudit: string;
    aiActions: string; highRisk: string; aiBlocks: string;
    dlpViolations: string; federationRequests: string;
  };
  auth: { pageTitle: string; pageSubtitle: string; formTitle: string; emailLabel: string; passwordLabel: string; signIn: string; signingIn: string; networkError: string; devHint: string };
  service: { healthy: string; degraded: string; down: string; services: string };
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LangContext = createContext<LangCtx>({
  lang: "ja",
  setLang: () => {},
  t: dict.ja,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ja");

  useEffect(() => {
    const stored = localStorage.getItem("synapse_lang") as Lang | null;
    if (stored === "en" || stored === "ja") setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    localStorage.setItem("synapse_lang", l);
    setLangState(l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: dict[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LangContext);
}
