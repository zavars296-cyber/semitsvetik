import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/Shell';

export const metadata: Metadata = { title: 'Адмін-панель', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
