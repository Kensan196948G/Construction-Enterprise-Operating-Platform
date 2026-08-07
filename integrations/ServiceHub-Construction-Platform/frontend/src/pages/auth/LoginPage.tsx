import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HardHat } from "lucide-react";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { Button, Card, ErrorBanner, FormField, Input } from "@/components/ui";

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 21 21" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
      <rect width="10" height="10" fill="#f25022"/>
      <rect x="11" width="10" height="10" fill="#7fba00"/>
      <rect y="11" width="10" height="10" fill="#00a4ef"/>
      <rect x="11" y="11" width="10" height="10" fill="#ffb900"/>
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleMicrosoftLogin = async () => {
    setSsoLoading(true);
    setError("");
    try {
      // Redirect to backend SSO initiation endpoint (EntraID Client Credentials flow)
      window.location.href = "/api/v1/auth/sso/microsoft";
    } catch {
      setError("Microsoft SSO の開始に失敗しました。システム管理者に連絡してください。");
      setSsoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await authApi.login({ email, password });
      // Store token temporarily to fetch user info
      useAuthStore.setState({ token: token.access_token });
      const user = await authApi.me();
      setAuth(token.access_token, token.refresh_token, user);
      navigate("/dashboard");
    } catch {
      setError("メールアドレスまたはパスワードが正しくありません");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <HardHat className="w-12 h-12 text-primary-600" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            ServiceHub 工事管理
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">アカウントにサインイン</p>
        </div>

        <Card className="mt-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <ErrorBanner>{error}</ErrorBanner>
            )}

            <div className="space-y-4">
              <FormField label="メールアドレス" htmlFor="email" required>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </FormField>

              <FormField label="パスワード" htmlFor="password" required>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormField>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
            >
              ログイン
            </Button>

            {/* Microsoft SSO divider */}
            <div className="flex items-center gap-3">
              <hr className="flex-1 border-gray-200 dark:border-gray-600" />
              <span className="text-xs text-gray-400 whitespace-nowrap">または</span>
              <hr className="flex-1 border-gray-200 dark:border-gray-600" />
            </div>

            {/* Microsoft EntraID sign-in (non-interactive / Client Credentials) */}
            <button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={ssoLoading || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {ssoLoading ? (
                <svg className="w-5 h-5 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : (
                <MicrosoftLogo />
              )}
              Microsoft アカウントでサインイン（非対話式）
            </button>
          </form>
        </Card>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          Microsoft サインインは EntraID（旧 Azure AD）非対話式認証を使用します
        </p>
      </div>
    </div>
  );
}
