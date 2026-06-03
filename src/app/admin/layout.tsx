import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Sidebar from '@/components/Sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: { template: '%s | Admin — InventoryPro', default: 'Admin' } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');

  return (
    <div>
      <Sidebar role="admin" userName={session.name} />
      <main className="main-with-sidebar">{children}</main>
    </div>
  );
}
