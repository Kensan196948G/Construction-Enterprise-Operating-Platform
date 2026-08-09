'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { MOCK_MODE } from '@/lib/mock/flag';

export default function LoginPage() {
  // モックモードではデモ資格情報を初期入力し、ワンクリックでログインできるようにする
  const [email, setEmail] = useState(MOCK_MODE ? 'admin@civil-ims.local' : '');
  const [password, setPassword] = useState(MOCK_MODE ? 'demo' : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 開発環境、またはモックモード(デモ環境)では Email/Password ログイン欄を表示する
  const isDev = process.env.NODE_ENV !== 'production' || MOCK_MODE;

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError(null);
    await signIn('microsoft-entra-id', { callbackUrl: '/dashboard' });
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError('メールアドレスまたはパスワードが正しくありません');
      setIsLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">🏗️ Civil Construction IMS</h1>
          <p className="mt-2 text-sm text-gray-500">建設・土木統合マネジメントシステム</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <button
          type="button"
          onClick={handleMicrosoftLogin}
          disabled={isLoading}
          className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          🏢 Microsoft アカウントでログイン (Entra ID)
        </button>

        {isDev && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-400">
                  {MOCK_MODE ? '🎭 デモ環境 — 任意のID/パスワードでログイン可' : '開発環境専用'}
                </span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleCredentialsLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="example@company.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  パスワード
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
