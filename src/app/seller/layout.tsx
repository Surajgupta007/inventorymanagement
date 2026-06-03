import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Sidebar from '@/components/Sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: { template: '%s | Seller — InventoryPro', default: 'Seller' } };

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div>
      <Sidebar role={session.role} userName={session.name} />
      <main className="main-with-sidebar">{children}</main>
    </div>
  );
}
