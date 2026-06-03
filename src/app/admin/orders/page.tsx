import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { orders, users, orderItems, products } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { formatINR, UNIT_SHORT, SupportedUnit } from '@/lib/units';
import Link from 'next/link';
import OrderStatusActions from './OrderStatusActions';

export const metadata: Metadata = { title: 'Orders' };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? '';

  const conditions = statusFilter
    ? [eq(orders.status, statusFilter as 'quotation' | 'confirmed' | 'fulfilled' | 'cancelled')]
    : [];

  const orderList = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalAmount: orders.totalAmount,
      notes: orders.notes,
      createdAt: orders.createdAt,
      sellerName: users.name,
      sellerEmail: users.email,
    })
    .from(orders)
    .innerJoin(users, eq(orders.sellerId, users.id))
    .where(conditions.length > 0 ? conditions[0] : undefined)
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
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{orderList.length} order(s)</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'quotation', 'confirmed', 'fulfilled', 'cancelled'].map((s) => (
          <Link
            key={s || 'all'}
            href={s ? `/admin/orders?status=${s}` : '/admin/orders'}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {orderList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No orders found</p>
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Seller</th>
                <th>Date</th>
                <th>Total (INR)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderList.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono font-medium hover:underline"
                      style={{ color: 'var(--color-brand-400)' }}
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td>
                    <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{order.sellerName}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{order.sellerEmail}</div>
                  </td>
                  <td className="text-sm">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
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
                    <div className="flex gap-2">
                      <Link href={`/admin/orders/${order.id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                      <OrderStatusActions orderId={order.id} currentStatus={order.status} />
                    </div>
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
