import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { orders, orderItems, products, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { formatINR, UNIT_SHORT, SupportedUnit, fromBaseUnit } from '@/lib/units';
import Link from 'next/link';
import OrderStatusActions from '../OrderStatusActions';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Order Detail' };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      notes: orders.notes,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      sellerName: users.name,
      sellerEmail: users.email,
    })
    .from(orders)
    .innerJoin(users, eq(orders.sellerId, users.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) notFound();

  const items = await db
    .select({
      id: orderItems.id,
      orderedUnit: orderItems.orderedUnit,
      orderedQuantity: orderItems.orderedQuantity,
      baseQuantity: orderItems.baseQuantity,
      unitPrice: orderItems.unitPrice,
      lineTotal: orderItems.lineTotal,
      productName: products.name,
      productSku: products.sku,
      productBaseUnit: products.baseUnit,
      productDimension: products.dimension,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

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
          <h1 className="page-title font-mono">{order.orderNumber}</h1>
          <p className="page-subtitle">
            Placed by {order.sellerName} on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${statusColors[order.status] ?? 'badge-gray'} text-sm px-4 py-2`}>
            {order.status}
          </span>
          <OrderStatusActions orderId={order.id} currentStatus={order.status} />
          <Link href="/admin/orders" className="btn btn-secondary">← Back</Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Seller</div>
          <div className="font-semibold">{order.sellerName}</div>
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{order.sellerEmail}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Order Total</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
            {order.totalAmount ? formatINR(parseFloat(order.totalAmount)) : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Items</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--color-brand-400)' }}>{items.length}</div>
        </div>
      </div>

      {order.notes && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid color-mix(in oklch, white 8%, transparent)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Notes: </span>
          {order.notes}
        </div>
      )}

      {/* Line items */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'color-mix(in oklch, white 8%, transparent)' }}>
          <h2 className="font-semibold">Order Items — Unit Conversion Audit</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Both ordered unit and base unit quantities shown for verification
          </p>
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Product</th>
              <th>Ordered (user unit)</th>
              <th>Base Qty (stored)</th>
              <th>Price / Base Unit</th>
              <th>Line Total (INR)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {item.productName}
                  </div>
                  {item.productSku && (
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      SKU: {item.productSku}
                    </div>
                  )}
                  <span className="badge badge-purple text-xs capitalize mt-1">{item.productDimension}</span>
                </td>
                <td>
                  <div className="font-semibold">
                    {parseFloat(item.orderedQuantity).toLocaleString('en-IN', { maximumFractionDigits: 6 })}{' '}
                    <span className="font-mono text-xs">{item.orderedUnit}</span>
                  </div>
                </td>
                <td>
                  <div>
                    {parseFloat(item.baseQuantity).toLocaleString('en-IN', { maximumFractionDigits: 6 })}{' '}
                    <span className="font-mono text-xs">{item.productBaseUnit}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    base unit
                  </div>
                </td>
                <td>
                  <span style={{ color: 'var(--color-success)' }}>
                    {formatINR(parseFloat(item.unitPrice))}
                  </span>
                  <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>
                    / {item.productBaseUnit}
                  </span>
                </td>
                <td>
                  <span className="font-bold" style={{ color: 'var(--color-brand-400)' }}>
                    {formatINR(parseFloat(item.lineTotal))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-right font-semibold pr-4 py-4" style={{ color: 'var(--color-text-secondary)' }}>
                Grand Total
              </td>
              <td className="py-4">
                <span className="text-xl font-bold" style={{ color: 'var(--color-success)' }}>
                  {order.totalAmount ? formatINR(parseFloat(order.totalAmount)) : '—'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
