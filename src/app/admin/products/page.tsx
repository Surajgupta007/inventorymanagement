import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';
import { eq, ilike, or, and } from 'drizzle-orm';
import Link from 'next/link';
import { formatINR, UNIT_SHORT, SupportedUnit, BASE_UNIT, Dimension } from '@/lib/units';
import DeleteProductButton from './DeleteProductButton';

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; dimension?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? '';
  const categoryFilter = params.category ?? '';
  const dimensionFilter = params.dimension ?? '';

  const allCategories = await db.select().from(categories);

  const conditions = [eq(products.isActive, true)];
  if (q) {
    conditions.push(
      or(ilike(products.name, `%${q}%`), ilike(products.sku, `%${q}%`)) as ReturnType<typeof ilike>
    );
  }
  if (categoryFilter) conditions.push(eq(products.categoryId, categoryFilter));
  if (dimensionFilter)
    conditions.push(eq(products.dimension, dimensionFilter as 'weight' | 'volume' | 'count'));

  const productList = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      dimension: products.dimension,
      baseUnit: products.baseUnit,
      pricePerBaseUnit: products.pricePerBaseUnit,
      stockQuantity: products.stockQuantity,
      lowStockThreshold: products.lowStockThreshold,
      isActive: products.isActive,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(products.name);

  const categoryMap = Object.fromEntries(allCategories.map((c) => [c.id, c.name]));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{productList.length} product(s) found</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <span>+</span> New Product
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="glass-card p-4 mb-6 flex gap-3 flex-wrap">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or SKU…"
          className="input-base"
          style={{ maxWidth: 240 }}
        />
        <select name="category" defaultValue={categoryFilter} className="input-base" style={{ maxWidth: 200 }}>
          <option value="">All Categories</option>
          {allCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="dimension" defaultValue={dimensionFilter} className="input-base" style={{ maxWidth: 180 }}>
          <option value="">All Dimensions</option>
          <option value="weight">Weight</option>
          <option value="volume">Volume</option>
          <option value="count">Count</option>
        </select>
        <button type="submit" className="btn btn-secondary">Filter</button>
        <Link href="/admin/products" className="btn btn-secondary">Clear</Link>
      </form>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {productList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p>No products found. <Link href="/admin/products/new" style={{ color: 'var(--color-brand-400)' }}>Create one →</Link></p>
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Dimension</th>
                <th>Price / Base Unit</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((p) => {
                const stock = parseFloat(p.stockQuantity);
                const threshold = parseFloat(p.lowStockThreshold);
                const isLow = stock <= threshold && threshold > 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.name}</div>
                      {p.sku && <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>SKU: {p.sku}</div>}
                    </td>
                    <td>{p.categoryId ? categoryMap[p.categoryId] ?? '—' : '—'}</td>
                    <td>
                      <span className="badge badge-purple capitalize">{p.dimension}</span>
                    </td>
                    <td>
                      <span className="font-semibold" style={{ color: 'var(--color-success)' }}>
                        {formatINR(parseFloat(p.pricePerBaseUnit))}
                      </span>
                      <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>
                        / {UNIT_SHORT[p.baseUnit as SupportedUnit]}
                      </span>
                    </td>
                    <td>
                      <span className={isLow ? 'text-orange-400 font-medium' : ''}>
                        {parseFloat(p.stockQuantity).toLocaleString('en-IN')} {UNIT_SHORT[p.baseUnit as SupportedUnit]}
                      </span>
                      {isLow && <div className="text-xs" style={{ color: 'var(--color-warning)' }}>⚠ Low stock</div>}
                    </td>
                    <td>
                      <span className={`badge ${p.isActive ? 'badge-green' : 'badge-red'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link href={`/admin/products/${p.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                        <DeleteProductButton id={p.id} name={p.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
