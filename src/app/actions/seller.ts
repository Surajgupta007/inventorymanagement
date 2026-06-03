'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { PlaceOrderSchema } from '@/lib/validations';
import { toBaseUnit, calculateLineTotal, SupportedUnit } from '@/lib/units';
import { nanoid } from 'nanoid';

async function requireSeller() {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = nanoid(6).toUpperCase();
  return `ORD-${dateStr}-${rand}`;
}

export type PlaceOrderState = {
  errors?: Record<string, string[] | string>;
  message?: string;
} | undefined;

export async function placeOrder(
  state: PlaceOrderState,
  formData: FormData
): Promise<PlaceOrderState> {
  const session = await requireSeller();

  const rawItems = formData.get('items');
  const notes = formData.get('notes') as string | null;

  let parsedItems: unknown;
  try {
    parsedItems = JSON.parse(rawItems as string);
  } catch {
    return { message: 'Invalid order data.' };
  }

  const parsed = PlaceOrderSchema.safeParse({ notes, items: parsedItems });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { items, notes: orderNotes } = parsed.data;

  // Validate each item and compute totals
  let grandTotal = 0;
  const resolvedItems: {
    productId: string;
    orderedUnit: string;
    orderedQuantity: string;
    baseQuantity: string;
    unitPrice: string;
    lineTotal: string;
  }[] = [];

  for (const item of items) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (!product || !product.isActive) {
      return { message: `Product not found or inactive: ${item.productId}` };
    }

    const qty = parseFloat(item.orderedQuantity);
    const pricePerBase = parseFloat(product.pricePerBaseUnit);
    const { baseQty, lineTotal } = calculateLineTotal(
      qty,
      item.orderedUnit as SupportedUnit,
      pricePerBase
    );

    grandTotal += lineTotal;
    resolvedItems.push({
      productId: product.id,
      orderedUnit: item.orderedUnit,
      orderedQuantity: qty.toString(),
      baseQuantity: baseQty.toString(),
      unitPrice: pricePerBase.toString(),
      lineTotal: lineTotal.toString(),
    });
  }

  // Insert order + items in one transaction-like sequence
  const [newOrder] = await db
    .insert(orders)
    .values({
      orderNumber: generateOrderNumber(),
      sellerId: session.userId,
      status: 'quotation',
      notes: orderNotes ?? null,
      totalAmount: grandTotal.toString(),
    })
    .returning();

  await db.insert(orderItems).values(
    resolvedItems.map((item) => ({
      orderId: newOrder.id,
      ...item,
    }))
  );

  revalidatePath('/seller/orders');
  redirect(`/seller/orders/${newOrder.id}`);
}
