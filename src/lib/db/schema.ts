import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum('role', ['admin', 'seller']);

export const dimensionEnum = pgEnum('dimension', ['weight', 'volume', 'count']);

export const orderStatusEnum = pgEnum('order_status', [
  'quotation',
  'confirmed',
  'fulfilled',
  'cancelled',
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull().default('seller'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Products ─────────────────────────────────────────────────────────────────
//
// All quantities are stored in the BASE UNIT for the product's dimension:
//   weight  → grams (g)
//   volume  → milliliters (mL)
//   count   → units (unit)
//
// pricePerBaseUnit is stored as NUMERIC(20,6) — INR per single base unit
// stockQuantity is stored in the same base unit
//
// We use NUMERIC (exact fixed-point) rather than FLOAT to avoid any
// floating-point drift when dealing with large quantities or sub-paisa pricing.

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  sku: text('sku').unique(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id),

  // Dimension tells us which base unit applies
  dimension: dimensionEnum('dimension').notNull(),
  // baseUnit is always 'g', 'mL', or 'unit' — the canonical storage unit
  baseUnit: text('base_unit').notNull(),

  // INR price per single base unit (e.g., ₹0.10 per gram = ₹100/kg)
  // NUMERIC(20,6): up to 14 digits before decimal + 6 after → handles very
  // large or very small prices without floating-point errors
  pricePerBaseUnit: numeric('price_per_base_unit', { precision: 20, scale: 6 }).notNull(),

  // Stock in base unit — NUMERIC(20,6) handles fractional grams or mL
  stockQuantity: numeric('stock_quantity', { precision: 20, scale: 6 }).notNull().default('0'),

  lowStockThreshold: numeric('low_stock_threshold', { precision: 20, scale: 6 }).notNull().default('0'),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Unit Conversions (reference / lookup table) ──────────────────────────────
//
// Conversion factor: multiply fromUnit qty by factor to get toUnit qty
// Example: from=kg, to=g, factor=1000  →  1 kg × 1000 = 1000 g

export const unitConversions = pgTable('unit_conversions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromUnit: text('from_unit').notNull(),
  toUnit: text('to_unit').notNull(),
  // NUMERIC(20,10) for high precision — some conversions (e.g., oz→g) need many decimals
  factor: numeric('factor', { precision: 20, scale: 10 }).notNull(),
  dimension: dimensionEnum('dimension').notNull(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').unique().notNull(),
  sellerId: uuid('seller_id').notNull().references(() => users.id),
  status: orderStatusEnum('status').notNull().default('quotation'),
  notes: text('notes'),
  // Total in INR — sum of all line_total values at time of order
  totalAmount: numeric('total_amount', { precision: 20, scale: 6 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Order Items ──────────────────────────────────────────────────────────────
//
// We store BOTH the ordered unit/qty (what the seller chose) AND the base qty
// (converted, what we store internally) for full auditability.
//
// unitPrice is a snapshot of pricePerBaseUnit at time of order so historical
// orders reflect the price that was actually charged, not the current price.

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),

  // The unit the seller chose when placing the order (e.g., 'kg', 'L')
  orderedUnit: text('ordered_unit').notNull(),
  // The quantity in the ordered unit
  orderedQuantity: numeric('ordered_quantity', { precision: 20, scale: 6 }).notNull(),

  // The quantity converted to the product's base unit (for stock deduction)
  baseQuantity: numeric('base_quantity', { precision: 20, scale: 6 }).notNull(),

  // Snapshot of price per base unit at time of order
  unitPrice: numeric('unit_price', { precision: 20, scale: 6 }).notNull(),

  // baseQuantity × unitPrice
  lineTotal: numeric('line_total', { precision: 20, scale: 6 }).notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  seller: one(users, {
    fields: [orders.sellerId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

// ─── TypeScript types ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type UnitConversion = typeof unitConversions.$inferSelect;
