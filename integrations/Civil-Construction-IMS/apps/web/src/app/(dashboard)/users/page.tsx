'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  AlertTriangle,
  Search,
  UserCheck,
  UserX,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

interface UserRole {
  role: {
    id: string;
    name: string;
    displayName: string;
  };
}

interface User {
  id: string;
  email: string;
  displayName: string;
  employeeNo: string | null;
  departmentId: string | null;
  organizationId: string;
  lastLoginAt: string | null;
  roles: UserRole[];
}

const ROLE_COLOR: Record<string, string> = {
  SYSTEM_ADMIN: 'bg-purple-100 text-purple-800',
  QUALITY_MANAGER: 'bg-blue-100 text-blue-800',
  SAFETY_MANAGER: 'bg-orange-100 text-orange-800',
  ENVIRONMENT_MANAGER: 'bg-green-100 text-green-800',
  AUDITOR: 'bg-yellow-100 text-yellow-800',
  VIEWER: 'bg-gray-100 text-gray-600',
};

function RoleBadge({ role }: { role: UserRole['role'] }) {
  const color = ROLE_COLOR[role.name] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <ShieldCheck className="h-3 w-3" />
      {role.displayName}
    </span>
  );
}

function formatLastLogin(isoDate: string | null): string {
  if (!isoDate) return '未ログイン';
  return new Date(isoDate).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function UsersPage() {
  const [searchText, setSearchText] = useState('');

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get<User[]>('/users'),
  });

  const filtered = users.filter((u) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.employeeNo?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            組織ユーザー・ロール一覧 (ISO 27001 アクセス管理)
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-indigo-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-600">総ユーザー数</p>
                <p className="text-2xl font-bold mt-0.5">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-gray-300" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-green-500">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-600">ログイン済み</p>
                <p className="text-2xl font-bold mt-0.5">
                  {users.filter((u) => u.lastLoginAt).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-gray-300" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-gray-400">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-600">未ログイン</p>
                <p className="text-2xl font-bold mt-0.5">
                  {users.filter((u) => !u.lastLoginAt).length}
                </p>
              </div>
              <UserX className="h-8 w-8 text-gray-300" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="名前・メール・社員番号で検索"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          データの読み込みに失敗しました。APIサーバーの接続を確認してください。
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">
              {searchText ? '検索条件に一致するユーザーがいません' : 'ユーザーが登録されていません'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!isLoading && filtered.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ユーザー一覧</CardTitle>
            <CardDescription>
              {filtered.length} 件表示{searchText && ` (全 ${users.length} 件中)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">社員番号</th>
                    <th className="px-4 py-3 text-left">氏名</th>
                    <th className="px-4 py-3 text-left">メールアドレス</th>
                    <th className="px-4 py-3 text-left">ロール</th>
                    <th className="px-4 py-3 text-left">最終ログイン</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                        {user.employeeNo ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{user.displayName}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <span className="text-xs text-gray-400">ロールなし</span>
                          ) : (
                            user.roles.map((r) => (
                              <RoleBadge key={r.role.id} role={r.role} />
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatLastLogin(user.lastLoginAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
