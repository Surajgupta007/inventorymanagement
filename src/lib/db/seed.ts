/**
 * Database seed script
 * Run: npx tsx src/lib/db/seed.ts
 *
 * Creates:
 * - 1 admin user  (admin@demo.com / Admin@123)
 * - 1 seller user (seller@demo.com / Seller@123)
 * - 3 categories
 * - 8 sample products across weight/volume/count dimensions
 * - Unit conversion reference data
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Starting seed...');

  // ── Users ─────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const sellerHash = await bcrypt.hash('Seller@123', 12);

  await db
    .insert(schema.users)
    .values([
      {
        email: 'admin@demo.com',
        passwordHash: adminHash,
        name: 'Admin User',
        role: 'admin',
      },
      {
        email: 'seller@demo.com',
        passwordHash: sellerHash,
        name: 'Demo Seller',
        role: 'seller',
      },
    ])
    .onConflictDoNothing();

  console.log('✅ Users seeded');

  // ── Unit Conversions ──────────────────────────────────────────────────────
  // These are reference data for the UI and any future automated conversion.
  // The code uses the constants in lib/units.ts directly, but this table
  // documents the conversion factors in the DB for auditability.
  await db
    .insert(schema.unitConversions)
    .values([
      // Weight
      { fromUnit: 'g', toUnit: 'g', factor: '1', dimension: 'weight' },
      { fromUnit: 'g', toUnit: 'kg', factor: '0.001', dimension: 'weight' },
      { fromUnit: 'g', toUnit: 'mg', factor: '1000', dimension: 'weight' },
      { fromUnit: 'kg', toUnit: 'g', factor: '1000', dimension: 'weight' },
      { fromUnit: 'kg', toUnit: 'kg', factor: '1', dimension: 'weight' },
      { fromUnit: 'mg', toUnit: 'g', factor: '0.001', dimension: 'weight' },
      // Volume
      { fromUnit: 'mL', toUnit: 'mL', factor: '1', dimension: 'volume' },
      { fromUnit: 'mL', toUnit: 'L', factor: '0.001', dimension: 'volume' },
      { fromUnit: 'L', toUnit: 'mL', factor: '1000', dimension: 'volume' },
      { fromUnit: 'L', toUnit: 'L', factor: '1', dimension: 'volume' },
      // Count
      { fromUnit: 'unit', toUnit: 'unit', factor: '1', dimension: 'count' },
    ])
    .onConflictDoNothing();

  console.log('✅ Unit conversions seeded');

  // ── Categories ────────────────────────────────────────────────────────────
  const [chemCat, labCat, reagCat] = await db
    .insert(schema.categories)
    .values([
      { name: 'Chemicals', description: 'Laboratory and industrial chemicals' },
      { name: 'Lab Equipment Consumables', description: 'Disposable lab supplies' },
      { name: 'Reagents', description: 'High-purity reagents and solvents' },
    ])
    .onConflictDoNothing()
    .returning();

  console.log('✅ Categories seeded');

  // ── Products ──────────────────────────────────────────────────────────────
  // All prices and quantities stored in BASE UNITS (g, mL, unit)
  // pricePerBaseUnit = INR per 1 base unit
  await db
    .insert(schema.products)
    .values([
      // Weight products (base: grams)
      {
        name: 'Sodium Chloride (NaCl)',
        sku: 'NaCl-001',
        description: 'Analytical grade sodium chloride, 99.5% purity',
        categoryId: chemCat?.id ?? null,
        dimension: 'weight',
        baseUnit: 'g',
        pricePerBaseUnit: '0.05',     // ₹0.05 per gram = ₹50/kg
        stockQuantity: '50000',       // 50,000g = 50kg
        lowStockThreshold: '5000',    // alert at 5kg
      },
      {
        name: 'Potassium Permanganate',
        sku: 'KMnO4-001',
        description: 'KMnO4, oxidising agent, lab grade',
        categoryId: chemCat?.id ?? null,
        dimension: 'weight',
        baseUnit: 'g',
        pricePerBaseUnit: '0.80',     // ₹0.80 per gram = ₹800/kg
        stockQuantity: '10000',       // 10kg
        lowStockThreshold: '1000',
      },
      {
        name: 'Activated Charcoal',
        sku: 'CHAR-001',
        description: 'High surface area activated charcoal, 200 mesh',
        categoryId: chemCat?.id ?? null,
        dimension: 'weight',
        baseUnit: 'g',
        pricePerBaseUnit: '0.12',
        stockQuantity: '20000',
        lowStockThreshold: '2000',
      },
      // Volume products (base: milliliters)
      {
        name: 'Ethanol (95%)',
        sku: 'ETOH-001',
        description: '95% ethanol for extraction and cleaning',
        categoryId: reagCat?.id ?? null,
        dimension: 'volume',
        baseUnit: 'mL',
        pricePerBaseUnit: '0.08',     // ₹0.08 per mL = ₹80/L
        stockQuantity: '100000',      // 100L
        lowStockThreshold: '10000',   // 10L
      },
      {
        name: 'Acetone (HPLC Grade)',
        sku: 'ACE-001',
        description: 'High-purity acetone for HPLC applications',
        categoryId: reagCat?.id ?? null,
        dimension: 'volume',
        baseUnit: 'mL',
        pricePerBaseUnit: '0.15',     // ₹0.15 per mL = ₹150/L
        stockQuantity: '50000',       // 50L
        lowStockThreshold: '5000',
      },
      {
        name: 'Distilled Water',
        sku: 'DW-001',
        description: 'Double-distilled water, endotoxin-free',
        categoryId: chemCat?.id ?? null,
        dimension: 'volume',
        baseUnit: 'mL',
        pricePerBaseUnit: '0.005',    // ₹0.005 per mL = ₹5/L
        stockQuantity: '500000',      // 500L
        lowStockThreshold: '50000',
      },
      // Count products (base: unit)
      {
        name: 'Micro Test Tubes (1.5 mL)',
        sku: 'MTT-001',
        description: 'Polypropylene micro centrifuge tubes, graduated',
        categoryId: labCat?.id ?? null,
        dimension: 'count',
        baseUnit: 'unit',
        pricePerBaseUnit: '3.50',     // ₹3.50 per unit
        stockQuantity: '5000',
        lowStockThreshold: '500',
      },
      {
        name: 'Nitrile Gloves (Box of 100)',
        sku: 'GLV-001',
        description: 'Medium size nitrile examination gloves, powder-free',
        categoryId: labCat?.id ?? null,
        dimension: 'count',
        baseUnit: 'unit',
        pricePerBaseUnit: '350',      // ₹350 per box
        stockQuantity: '200',
        lowStockThreshold: '20',
      },
    ])
    .onConflictDoNothing();

  console.log('✅ Products seeded');
  console.log('\n🎉 Seed complete!');
  console.log('   Admin:  admin@demo.com  / Admin@123');
  console.log('   Seller: seller@demo.com / Seller@123');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
