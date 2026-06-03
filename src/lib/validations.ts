import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email({ error: 'Invalid email address' }),
  password: z.string().min(1, { error: 'Password is required' }),
});

export const ProductSchema = z.object({
  name: z.string().min(1, { error: 'Product name is required' }).max(200),
  sku: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  dimension: z.enum(['weight', 'volume', 'count']),
  pricePerBaseUnit: z.string().regex(/^\d+(\.\d{1,6})?$/, {
    error: 'Price must be a positive number with up to 6 decimal places',
  }),
  stockQuantity: z.string().regex(/^\d+(\.\d{1,6})?$/, {
    error: 'Stock must be a positive number with up to 6 decimal places',
  }),
  lowStockThreshold: z.string().regex(/^\d+(\.\d{1,6})?$/).optional().default('0'),
  isActive: z.boolean().optional().default(true),
});

export const CategorySchema = z.object({
  name: z.string().min(1, { error: 'Category name is required' }).max(100),
  description: z.string().max(500).optional().nullable(),
});

export const OrderItemInputSchema = z.object({
  productId: z.string().uuid(),
  orderedUnit: z.string(),
  orderedQuantity: z.string().regex(/^\d+(\.\d{1,6})?$/, {
    error: 'Quantity must be a positive number',
  }),
});

export const PlaceOrderSchema = z.object({
  notes: z.string().max(1000).optional(),
  items: z.array(OrderItemInputSchema).min(1, { error: 'At least one item is required' }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;
export type CategoryInput = z.infer<typeof CategorySchema>;
export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;
