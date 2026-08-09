import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            🏗️ 建設・土木統合マネジメントシステム
          </h1>
          <p className="text-xl text-gray-600">
            ISO 9001 / 14001 / 45001 / 55001 / 19650 統合プラットフォーム
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          {modules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-blue-400"
            >
              <div className="text-3xl mb-2">{mod.icon}</div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                {mod.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{mod.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ダッシュボードへ →
          </Link>
        </div>
      </div>
    </main>
  );
}

const modules = [
  {
    href: '/quality',
    icon: '✅',
    title: '品質管理',
    description: 'ISO 9001 - 品質計画・検査・不適合',
  },
  {
    href: '/environment',
    icon: '🌿',
    title: '環境管理',
    description: 'ISO 14001 - 環境側面・廃棄物・法令',
  },
  {
    href: '/safety',
    icon: '⛑️',
    title: '安全衛生管理',
    description: 'ISO 45001 - 危険源・ヒヤリハット',
  },
  {
    href: '/assets',
    icon: '🏛️',
    title: '資産管理',
    description: 'ISO 55001 - 台帳・保全・更新計画',
  },
  {
    href: '/bim',
    icon: '🏗️',
    title: 'BIM情報管理',
    description: 'ISO 19650 - EIR/BEP・CDE連携',
  },
  {
    href: '/audits',
    icon: '📋',
    title: '監査・是正',
    description: '内部監査・是正処置・監査証跡',
  },
  {
    href: '/documents',
    icon: '📄',
    title: '文書管理',
    description: '規程・手順書・版管理・承認',
  },
  {
    href: '/projects',
    icon: '🏢',
    title: '工事案件',
    description: '案件管理・横断KPI・報告',
  },
  {
    href: '/dashboard',
    icon: '📊',
    title: 'ダッシュボード',
    description: 'KPI・アラート・統合状況',
  },
];
