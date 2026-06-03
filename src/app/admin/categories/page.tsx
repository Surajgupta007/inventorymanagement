import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import CategoryActions from './CategoryActions';

export const metadata: Metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  const allCategories = await db.select().from(categories).orderBy(categories.name);

  // Count products per category
  const productCounts = await db
    .select({ categoryId: products.categoryId, count: count() })
    .from(products)
    .where(eq(products.isActive, true))
    .groupBy(products.categoryId);

  const countMap = Object.fromEntries(
    productCounts.map((r) => [r.categoryId, r.count])
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organise your products into categories</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Category list */}
        <div className="glass-card overflow-hidden">
          {allCategories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏷️</div>
              <p>No categories yet. Create one →</p>
            </div>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{cat.name}</div>
                      {cat.description && (
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{cat.description}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-purple">{countMap[cat.id] ?? 0}</span>
                    </td>
                    <td>
                      <CategoryActions id={cat.id} name={cat.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create form */}
        <CategoryActions.CreateForm />
      </div>
    </div>
  );
}
