'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { products, categories, orders, orderItems, users } from '@/lib/db/schema';
import { eq, desc, ilike, and, or } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { ProductSchema, CategorySchema } from '@/lib/validations';
import { BASE_UNIT } from '@/lib/units';

// ─── Helper ───────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');
  return session;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function createProduct(
  state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();

  const raw = {
    name: formData.get('name'),
    sku: formData.get('sku') || null,
    description: formData.get('description') || null,
    categoryId: formData.get('categoryId') || null,
    dimension: formData.get('dimension'),
    pricePerBaseUnit: formData.get('pricePerBaseUnit'),
    stockQuantity: formData.get('stockQuantity'),
    lowStockThreshold: formData.get('lowStockThreshold') || '0',
    isActive: formData.get('isActive') === 'true',
  };

  const parsed = ProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const baseUnit = BASE_UNIT[data.dimension];

  await db.insert(products).values({
    name: data.name,
    sku: data.sku ?? null,
    description: data.description ?? null,
    categoryId: data.categoryId ?? null,
    dimension: data.dimension,
    baseUnit,
    pricePerBaseUnit: data.pricePerBaseUnit,
    stockQuantity: data.stockQuantity,
    lowStockThreshold: data.lowStockThreshold,
    isActive: data.isActive,
  });

  revalidatePath('/admin/products');
  redirect('/admin/products');
}

export async function updateProduct(
  id: string,
  state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();

  const raw = {
    name: formData.get('name'),
    sku: formData.get('sku') || null,
    description: formData.get('description') || null,
    categoryId: formData.get('categoryId') || null,
    dimension: formData.get('dimension'),
    pricePerBaseUnit: formData.get('pricePerBaseUnit'),
    stockQuantity: formData.get('stockQuantity'),
    lowStockThreshold: formData.get('lowStockThreshold') || '0',
    isActive: formData.get('isActive') === 'true',
  };

  const parsed = ProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const baseUnit = BASE_UNIT[data.dimension];

  await db
    .update(products)
    .set({
      name: data.name,
      sku: data.sku ?? null,
      description: data.description ?? null,
      categoryId: data.categoryId ?? null,
      dimension: data.dimension,
      baseUnit,
      pricePerBaseUnit: data.pricePerBaseUnit,
      stockQuantity: data.stockQuantity,
      lowStockThreshold: data.lowStockThreshold,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath('/admin/products');
  redirect('/admin/products');
}

export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin();
  await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  revalidatePath('/admin/products');
}

// ─── Categories ───────────────────────────────────────────────────────────────

export type CategoryFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function createCategory(
  state: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAdmin();
  const parsed = CategorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || null,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await db.insert(categories).values(parsed.data);
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath('/admin/categories');
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  status: 'confirmed' | 'fulfilled' | 'cancelled'
): Promise<void> {
  await requireAdmin();

  if (status === 'confirmed') {
    // Deduct stock for each item when confirming an order
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (product) {
        const currentStock = parseFloat(product.stockQuantity);
        const deduct = parseFloat(item.baseQuantity);
        const newStock = Math.max(0, currentStock - deduct);
        await db
          .update(products)
          .set({ stockQuantity: newStock.toString(), updatedAt: new Date() })
          .where(eq(products.id, item.productId));
      }
    }
  }

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  revalidatePath('/admin/orders');
}
