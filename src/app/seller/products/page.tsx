import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';
import { eq, ilike, and, or } from 'drizzle-orm';
import { formatINR, UNIT_SHORT, SupportedUnit, UNIT_LABELS, getUnitsForDimension, Dimension } from '@/lib/units';
import AddToCartButton from './AddToCartButton';

export const metadata: Metadata = { title: 'Browse Products' };

export default async function SellerProductsPage({
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
  if (dimensionFilter) {
    conditions.push(eq(products.dimension, dimensionFilter as 'weight' | 'volume' | 'count'));
  }

  const productList = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(products.name);

  const categoryMap = Object.fromEntries(allCategories.map((c) => [c.id, c.name]));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Browse Products</h1>
          <p className="page-subtitle">{productList.length} product(s) available</p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="glass-card p-4 mb-6 flex gap-3 flex-wrap">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products…"
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
        <a href="/seller/products" className="btn btn-secondary">Clear</a>
      </form>

      {productList.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <p>No products match your search.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {productList.map((p) => {
            const supportedUnits = getUnitsForDimension(p.dimension as Dimension);
            const stock = parseFloat(p.stockQuantity);
            const inStock = stock > 0;

            return (
              <div key={p.id} className="glass-card p-5 flex flex-col gap-3 transition-all hover:border-[var(--color-brand-600)]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{p.name}</h3>
                    {p.sku && <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>SKU: {p.sku}</div>}
                    {p.categoryId && (
                      <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {categoryMap[p.categoryId]}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${inStock ? 'badge-green' : 'badge-red'} flex-shrink-0`}>
                    {inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                {p.description && (
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {p.description}
                  </p>
                )}

                {/* Pricing */}
                <div
                  className="rounded-lg p-3"
                  style={{ background: 'var(--color-surface-3)', border: '1px solid color-mix(in oklch, white 6%, transparent)' }}
                >
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Base price</div>
                  <div className="text-lg font-bold" style={{ color: 'var(--color-success)' }}>
                    {formatINR(parseFloat(p.pricePerBaseUnit))}
                    <span className="text-sm font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>
                      / {UNIT_SHORT[p.baseUnit as SupportedUnit]}
                    </span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Stock: {stock.toLocaleString('en-IN', { maximumFractionDigits: 4 })} {p.baseUnit}
                  </div>
                </div>

                {/* Units info */}
                <div className="flex flex-wrap gap-1">
                  {supportedUnits.map((u) => (
                    <span key={u} className="badge badge-gray text-xs">
                      {UNIT_LABELS[u]}
                    </span>
                  ))}
                </div>

                {/* Add to cart */}
                {inStock && (
                  <AddToCartButton
                    product={{
                      id: p.id,
                      name: p.name,
                      dimension: p.dimension as Dimension,
                      baseUnit: p.baseUnit as SupportedUnit,
                      pricePerBaseUnit: p.pricePerBaseUnit,
                      stockQuantity: p.stockQuantity,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
