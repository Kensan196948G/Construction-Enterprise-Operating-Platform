import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Providers } from "@/components/Providers";
import { SESSION_COOKIE } from "@/lib/session";
import { AUTH_API } from "@/lib/api";

const inter = Inter({ subsets: ["latin"] });

/** Paths that are allowed to render without an authenticated user. */
const PUBLIC_PREFIXES = ["/login"];

export const metadata: Metadata = {
  title: "Synapse OS",
  description:
    "AI Governance & Federation Native Enterprise Operating Platform",
};

/** Fetch current user from the auth service using the session cookie token. */
async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${AUTH_API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<{
      username: string;
      tenant_id: string;
      role: string;
    }>;
  } catch {
    return null;
  }
}

function currentPathname(): string {
  // `x-pathname` is set by middleware on every request that reaches the app.
  return headers().get("x-pathname") ?? "/";
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const pathname = currentPathname();

  // Defense in depth: middleware already gates protected routes by JWT signature,
  // but if /auth/me rejects the token (revoked user, secret rotation, service
  // outage…) we must NOT render protected content. Redirect instead.
  if (!user && !isPublicPath(pathname)) {
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  const isAuthenticated = user !== null;

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
        <Providers>
          {isAuthenticated ? (
            <div className="flex min-h-screen">
              <Sidebar user={user} />
              <main className="flex-1 ml-60 p-6">{children}</main>
            </div>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  );
}
