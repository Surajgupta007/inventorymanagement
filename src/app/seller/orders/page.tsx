import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { formatINR } from '@/lib/units';
import Link from 'next/link';

export const metadata: Metadata = { title: 'My Orders' };

export default async function SellerOrdersPage() {
  const session = await getSession();
  const orderList = await db
    .select()
    .from(orders)
    .where(eq(orders.sellerId, session!.userId))
    .orderBy(desc(orders.createdAt));

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
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle">{orderList.length} order(s)</p>
        </div>
        <Link href="/seller/products" className="btn btn-primary">🛍️ New Order</Link>
      </div>

      <div className="glass-card overflow-hidden">
        {orderList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No orders yet. <Link href="/seller/products" style={{ color: 'var(--color-brand-400)' }}>Browse products →</Link></p>
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orderList.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="font-mono font-medium" style={{ color: 'var(--color-brand-400)' }}>
                      {order.orderNumber}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <span className="font-semibold" style={{ color: 'var(--color-success)' }}>
                      {order.totalAmount ? formatINR(parseFloat(order.totalAmount)) : '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${statusColors[order.status] ?? 'badge-gray'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <Link href={`/seller/orders/${order.id}`} className="btn btn-secondary btn-sm">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
