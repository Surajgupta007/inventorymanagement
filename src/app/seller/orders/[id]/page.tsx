import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { formatINR, UNIT_SHORT, SupportedUnit } from '@/lib/units';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Order Detail' };

export default async function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.sellerId, session!.userId)))
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

  const statusMessages: Record<string, string> = {
    quotation: 'Your quotation has been submitted and is awaiting admin review.',
    confirmed: 'Your order has been confirmed and is being processed.',
    fulfilled: 'Your order has been fulfilled. Thank you!',
    cancelled: 'This order has been cancelled.',
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title font-mono">{order.orderNumber}</h1>
          <p className="page-subtitle">
            Placed on{' '}
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
          <Link href="/seller/orders" className="btn btn-secondary">← Back</Link>
        </div>
      </div>

      {/* Status message */}
      <div
        className="rounded-xl p-4 mb-6 text-sm"
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid color-mix(in oklch, white 8%, transparent)',
        }}
      >
        ℹ️ {statusMessages[order.status]}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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
        <div className="stat-card">
          <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Status</div>
          <span className={`badge ${statusColors[order.status] ?? 'badge-gray'} text-sm`}>
            {order.status}
          </span>
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
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Your Notes: </span>
          {order.notes}
        </div>
      )}

      {/* Line items */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'color-mix(in oklch, white 8%, transparent)' }}>
          <h2 className="font-semibold">Order Items</h2>
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Product</th>
              <th>You Ordered</th>
              <th>Stored As</th>
              <th>Unit Price</th>
              <th>Line Total</th>
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
                </td>
                <td className="font-semibold">
                  {parseFloat(item.orderedQuantity).toLocaleString('en-IN', { maximumFractionDigits: 6 })}{' '}
                  <span className="font-mono text-xs">{item.orderedUnit}</span>
                </td>
                <td className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {parseFloat(item.baseQuantity).toLocaleString('en-IN', { maximumFractionDigits: 6 })}{' '}
                  <span className="font-mono">{item.productBaseUnit}</span>
                </td>
                <td>
                  <span style={{ color: 'var(--color-success)' }}>
                    {formatINR(parseFloat(item.unitPrice))}
                  </span>
                  <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>
                    / {item.productBaseUnit}
                  </span>
                </td>
                <td className="font-bold" style={{ color: 'var(--color-brand-400)' }}>
                  {formatINR(parseFloat(item.lineTotal))}
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
