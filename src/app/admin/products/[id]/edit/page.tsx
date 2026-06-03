import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ProductForm from '../../ProductForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Edit Product' };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) notFound();

  const allCategories = await db.select().from(categories);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Product</h1>
          <p className="page-subtitle">{product.name}</p>
        </div>
      </div>
      <div className="glass-card p-8 max-w-2xl">
        <ProductForm categories={allCategories} product={product} />
      </div>
    </div>
  );
}
