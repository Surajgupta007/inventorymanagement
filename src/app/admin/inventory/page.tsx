import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { formatINR, UNIT_SHORT, SupportedUnit } from '@/lib/units';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Inventory' };

export default async function InventoryPage() {
  const productList = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.name));

  const totalValue = productList.reduce((sum, p) => {
    return sum + parseFloat(p.stockQuantity) * parseFloat(p.pricePerBaseUnit);
  }, 0);

  const lowStockItems = productList.filter(
    (p) => parseFloat(p.lowStockThreshold) > 0 && parseFloat(p.stockQuantity) <= parseFloat(p.lowStockThreshold)
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Real-time stock levels across all products</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">+ Add Product</Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-2xl mb-1">📦</div>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-brand-400)' }}>
            {productList.length}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Active Products</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
            {formatINR(totalValue)}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Estimated Inventory Value</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-1">⚠️</div>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-warning)' }}>
            {lowStockItems.length}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Low Stock Alerts</div>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <div
          className="rounded-xl p-4 mb-6"
          style={{
            background: 'color-mix(in oklch, var(--color-warning) 10%, transparent)',
            border: '1px solid color-mix(in oklch, var(--color-warning) 25%, transparent)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span>⚠️</span>
            <span className="font-semibold text-sm" style={{ color: 'var(--color-warning)' }}>
              Low Stock Alerts ({lowStockItems.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((p) => (
              <Link key={p.id} href={`/admin/products/${p.id}/edit`}>
                <span className="badge badge-yellow">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="glass-card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Product</th>
              <th>Dimension</th>
              <th>Base Unit</th>
              <th>Stock</th>
              <th>Price / Base Unit</th>
              <th>Stock Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {productList.map((p) => {
              const stock = parseFloat(p.stockQuantity);
              const price = parseFloat(p.pricePerBaseUnit);
              const threshold = parseFloat(p.lowStockThreshold);
              const value = stock * price;
              const isLow = threshold > 0 && stock <= threshold;

              return (
                <tr key={p.id}>
                  <td>
                    <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {p.name}
                    </div>
                    {p.sku && (
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        SKU: {p.sku}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-purple capitalize">{p.dimension}</span>
                  </td>
                  <td className="font-mono text-sm">{p.baseUnit}</td>
                  <td>
                    <div className={isLow ? 'font-semibold' : ''} style={{ color: isLow ? 'var(--color-warning)' : 'inherit' }}>
                      {stock.toLocaleString('en-IN', { maximumFractionDigits: 4 })} {UNIT_SHORT[p.baseUnit as SupportedUnit]}
                    </div>
                    {isLow && (
                      <div className="text-xs" style={{ color: 'var(--color-warning)' }}>
                        ⚠ Below {threshold.toLocaleString()} {p.baseUnit}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ color: 'var(--color-success)' }}>{formatINR(price)}</span>
                    <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>
                      / {p.baseUnit}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold" style={{ color: 'var(--color-brand-400)' }}>
                      {formatINR(value)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${isLow ? 'badge-yellow' : 'badge-green'}`}>
                      {isLow ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
