import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { products, orders, users, categories } from '@/lib/db/schema';
import { count, eq, sql } from 'drizzle-orm';
import { formatINR } from '@/lib/units';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function AdminDashboard() {
  const [[productCount], [orderCount], [userCount], [categoryCount], recentOrders, lowStock] =
    await Promise.all([
      db.select({ count: count() }).from(products).where(eq(products.isActive, true)),
      db.select({ count: count() }).from(orders),
      db.select({ count: count() }).from(users).where(eq(users.role, 'seller')),
      db.select({ count: count() }).from(categories),
      db
        .select()
        .from(orders)
        .orderBy(sql`${orders.createdAt} desc`)
        .limit(5),
      db
        .select()
        .from(products)
        .where(eq(products.isActive, true))
        .limit(5),
    ]);

  const stats = [
    { label: 'Active Products', value: productCount.count, icon: '📦', color: 'var(--color-brand-400)' },
    { label: 'Total Orders', value: orderCount.count, icon: '📋', color: 'var(--color-success)' },
    { label: 'Sellers', value: userCount.count, icon: '👥', color: 'var(--color-info)' },
    { label: 'Categories', value: categoryCount.count, icon: '🏷️', color: 'var(--color-warning)' },
  ];

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
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your inventory and orders</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <span>+</span> Add Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: stat.color, boxShadow: `0 0 8px ${stat.color}` }}
              />
            </div>
            <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs" style={{ color: 'var(--color-brand-400)' }}>
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon">📋</div>
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg transition-all"
                  style={{
                    background: 'var(--color-surface-3)',
                    border: '1px solid color-mix(in oklch, white 5%, transparent)',
                  }}
                >
                  <div>
                    <div className="text-sm font-medium">{order.orderNumber}</div>
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

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add Product', href: '/admin/products/new', icon: '➕' },
              { label: 'Add Category', href: '/admin/categories', icon: '🏷️' },
              { label: 'View Orders', href: '/admin/orders', icon: '📋' },
              { label: 'Inventory', href: '/admin/inventory', icon: '🗃️' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-xl transition-all"
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid color-mix(in oklch, white 6%, transparent)',
                }}
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
