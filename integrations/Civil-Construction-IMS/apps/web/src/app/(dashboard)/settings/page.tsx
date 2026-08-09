'use client';

import { Settings, Bell, Shield, User, Globe, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SettingSection {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'available' | 'coming_soon';
  items: string[];
}

const SETTING_SECTIONS: SettingSection[] = [
  {
    icon: <User className="h-5 w-5 text-blue-500" />,
    title: 'プロフィール',
    description: 'ユーザー情報・パスワード変更',
    status: 'coming_soon',
    items: ['表示名', 'メールアドレス', 'パスワード変更', '2要素認証'],
  },
  {
    icon: <Bell className="h-5 w-5 text-orange-500" />,
    title: '通知設定',
    description: '是正処置・監査・期限アラートの通知先設定',
    status: 'coming_soon',
    items: ['メール通知', 'プッシュ通知', '通知頻度', 'アラートしきい値'],
  },
  {
    icon: <Shield className="h-5 w-5 text-green-500" />,
    title: 'セキュリティ・アクセス制御',
    description: 'ロール・権限・シングルサインオン設定',
    status: 'coming_soon',
    items: ['ロール管理', 'Microsoft Entra ID 連携', 'セッション管理', 'API トークン'],
  },
  {
    icon: <Globe className="h-5 w-5 text-purple-500" />,
    title: '組織・プロジェクト設定',
    description: '組織情報・デフォルト設定',
    status: 'coming_soon',
    items: ['組織名・ロゴ', 'タイムゾーン', 'デフォルト言語', 'ISO適合スコア基準値'],
  },
  {
    icon: <Database className="h-5 w-5 text-gray-500" />,
    title: 'データ管理',
    description: 'バックアップ・エクスポート・インポート',
    status: 'coming_soon',
    items: ['データエクスポート', 'バックアップスケジュール', 'データ保持期間', '監査ログ設定'],
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
          <p className="text-gray-500 text-sm mt-0.5">システム設定・プロフィール・通知設定</p>
        </div>
      </div>

      {/* Notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-2">
        <Settings className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">設定機能は順次実装予定です</p>
          <p className="mt-0.5 text-blue-700">現在は Microsoft Entra ID (OIDC) 経由でのログインが利用可能です。</p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SETTING_SECTIONS.map((section) => (
          <Card key={section.title} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  {section.icon}
                  {section.title}
                </span>
                {section.status === 'coming_soon' && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    実装予定
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
            {section.status === 'coming_soon' && (
              <div className="absolute inset-0 bg-gray-50/60 cursor-not-allowed" />
            )}
          </Card>
        ))}
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">システム情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">システム名</dt>
              <dd className="font-medium mt-0.5">建設・土木 IMS</dd>
            </div>
            <div>
              <dt className="text-gray-500">バージョン</dt>
              <dd className="font-medium mt-0.5">0.1.0</dd>
            </div>
            <div>
              <dt className="text-gray-500">対応規格</dt>
              <dd className="font-medium mt-0.5">ISO 9001/14001/45001/55001/19650</dd>
            </div>
            <div>
              <dt className="text-gray-500">認証方式</dt>
              <dd className="font-medium mt-0.5">Microsoft Entra ID (OIDC)</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
