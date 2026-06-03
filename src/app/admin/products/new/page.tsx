import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import ProductForm from '../ProductForm';

export const metadata: Metadata = { title: 'New Product' };

export default async function NewProductPage() {
  const allCategories = await db.select().from(categories);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Product</h1>
          <p className="page-subtitle">Add a new product to your inventory</p>
        </div>
      </div>
      <div className="glass-card p-8 max-w-2xl">
        <ProductForm categories={allCategories} />
      </div>
    </div>
  );
}
