import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import { formatINR } from '@/lib/units';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function SellerDashboard() {
  const session = await getSession();

  const [[orderCount], recentOrders] = await Promise.all([
    db.select({ count: count() }).from(orders).where(eq(orders.sellerId, session!.userId)),
    db
      .select()
      .from(orders)
      .where(eq(orders.sellerId, session!.userId))
      .orderBy(desc(orders.createdAt))
      .limit(5),
  ]);

  const statusColors: Record<string, string> = {
    quotation: 'badge-yellow',
    confirmed: 'badge-blue',
    fulfilled: 'badge-green',
    cancelled: 'badge-red',
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {session?.name}!</h1>
          <p className="page-subtitle">Browse products and place orders</p>
        </div>
        <Link href="/seller/products" className="btn btn-primary">
          🛍️ Browse Products
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="text-2xl mb-1">📋</div>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-brand-400)' }}>
            {orderCount.count}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-success)' }}>
            {recentOrders.filter((o) => o.status === 'fulfilled').length}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Fulfilled (recent)</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-1">🟡</div>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-warning)' }}>
            {recentOrders.filter((o) => o.status === 'quotation').length}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Pending Quotations</div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/seller/orders" style={{ color: 'var(--color-brand-400)', fontSize: '0.8rem' }}>
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="empty-state py-8">
            <div className="empty-state-icon">🛍️</div>
            <p>No orders yet.</p>
            <Link href="/seller/products" className="btn btn-primary mt-4">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/seller/orders/${order.id}`}
                className="flex items-center justify-between p-3 rounded-lg transition-all"
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid color-mix(in oklch, white 5%, transparent)',
                }}
              >
                <div>
                  <div className="text-sm font-medium font-mono">{order.orderNumber}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {order.totalAmount && (
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                      {formatINR(parseFloat(order.totalAmount))}
                    </span>
                  )}
                  <span className={`badge ${statusColors[order.status] ?? 'badge-gray'}`}>
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
