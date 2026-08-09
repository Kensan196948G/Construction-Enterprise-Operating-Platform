import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'ログイン — Civil Construction IMS' };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
