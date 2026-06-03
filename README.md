# InventoryPro — Inventory & Order Management System

A full-stack inventory and order management system built for the AasaMedChem hackathon assignment.

**Live Demo:** _(Add Vercel URL after deployment)_

---

## Features

### Admin Panel
- Product CRUD with SKU, category, description
- Category management with product counts
- Inventory overview with estimated stock value and low-stock alerts
- Orders list (filter by status) and detailed order view showing **both** ordered-unit and base-unit quantities for conversion verification
- Order status workflow: `quotation → confirmed → fulfilled / cancelled`
- Stock is automatically deducted when an order is confirmed

### Seller Panel
- Browse & search/filter products by name, SKU, category, and dimension
- Live price preview: enter quantity in **any supported unit** and see the INR total update instantly
- Cart with per-item quantity/unit editing and running total
- Place quotation / order with notes
- Order history with status tracking and line-item detail

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Server Components) |
| Database | Neon PostgreSQL (serverless, HTTP driver) |
| ORM | Drizzle ORM |
| Auth | Custom JWT sessions with `jose` (signed HttpOnly cookies) |
| Password | `bcryptjs` (12 rounds) |
| Validation | `zod` v4 |
| Client State | `zustand` with `localStorage` persistence (cart) |
| Styling | Tailwind CSS v4 with custom `@theme` (dark mode, oklch palette) |
| Deployment | Vercel |

---

## System Design

```
Browser → Next.js (Vercel Edge/Node)
           ├── Server Components   (data fetching, rendering)
           ├── Server Actions      (mutations — no API route needed)
           ├── Route Handlers      (REST API where needed)
           └── Middleware          (auth check + RBAC on every request)
                    ↓
              Neon PostgreSQL (serverless HTTP)
                    ↑
              Drizzle ORM (type-safe queries)
```

All secrets (DATABASE_URL, SESSION_SECRET) live in environment variables — never committed.

---

## Database Schema

### Key Tables

| Table | Purpose |
|---|---|
| `users` | Admin and seller accounts with bcrypt password hashes |
| `categories` | Product groupings |
| `products` | Core product data — stock and prices in **base units** |
| `unit_conversions` | Reference table of conversion factors between units |
| `orders` | Order header with seller reference, status, and INR total |
| `order_items` | Per-line quantities in both ordered unit and base unit |

### Data Types and Rationale

| Field | PostgreSQL Type | Reason |
|---|---|---|
| Prices (INR) | `NUMERIC(20, 6)` | Exact fixed-point; no floating-point drift; supports sub-paisa precision |
| Quantities | `NUMERIC(20, 6)` | Handles fractional grams (e.g., 0.001 g) and very large volumes |
| Conversion factors | `NUMERIC(20, 10)` | Extra precision for multi-hop conversions |
| IDs | `UUID` | Globally unique, collision-safe, no sequential guessing |
| Timestamps | `TIMESTAMPTZ` | Timezone-aware; correct across regions |

**Why `NUMERIC` instead of `FLOAT`?**  
`FLOAT` (IEEE 754) cannot represent most decimal fractions exactly — `0.1 + 0.2 ≠ 0.3` in float arithmetic. Since we are dealing with INR amounts and precise chemical quantities, we use `NUMERIC` (arbitrary-precision fixed-point) to guarantee exact values without rounding errors.

---

## Unit Storage & Conversion Strategy

### Internal Base Units

| Dimension | Base Unit | Supported Display Units |
|---|---|---|
| Weight | **grams (g)** | g, kg, mg |
| Volume | **milliliters (mL)** | mL, L |
| Count | **units (unit)** | unit |

### Conversion Factors

| From | To | Factor |
|---|---|---|
| kg | g | × 1000 |
| g | kg | × 0.001 |
| mg | g | × 0.001 |
| L | mL | × 1000 |
| mL | L | × 0.001 |

### How Conversions Are Applied

1. **On product creation** — admin enters price per base unit (₹/g, ₹/mL, ₹/unit). Stock entered in base unit.
2. **On product display** — base unit shown to both admin and seller for transparency.
3. **Seller adds to cart** — seller picks any supported unit (e.g., kg). Live preview calculates:
   ```
   baseQty = orderedQty × conversionFactor  (e.g., 2 kg × 1000 = 2000 g)
   lineTotal = baseQty × pricePerBaseUnit   (e.g., 2000 g × ₹0.05 = ₹100)
   ```
4. **On order save** — both `ordered_quantity/unit` (audit) and `base_quantity` (calculation) stored in `order_items`.
5. **On admin view** — both columns shown so admin can verify conversion correctness.
6. **On order confirm** — stock deducted using `base_quantity`.

All conversion logic lives in [`src/lib/units.ts`](src/lib/units.ts) and is shared between client and server.

### Price Storage

- `price_per_base_unit` is stored as INR per **single base unit** (e.g., ₹0.05 per gram)
- To show "price per kg" in the UI: `pricePerBaseUnit × 1000`
- `line_total = base_quantity × unit_price` (snapshot of price at time of order)
- `total_amount` on orders is the sum of all line totals

---

## Local Setup

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL account (free tier works)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Surajgupta007/inventorymanagement.git
cd inventorymanagement

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and set:
#   DATABASE_URL=<your Neon connection string>
#   SESSION_SECRET=<random 32-char string: openssl rand -base64 32>

# 4. Push schema to Neon
npm run db:push

# 5. Seed the database
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@demo.com | Admin@123 |
| **Seller** | seller@demo.com | Seller@123 |

---

## Deploying to Vercel

1. Push your code to GitHub (already done).
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the `inventorymanagement` repo.
3. In **Environment Variables**, add:
   - `DATABASE_URL` — your Neon connection string
   - `SESSION_SECRET` — a random 32-char base64 string
4. Click **Deploy**.
5. After deploy, run the seed once via Vercel's **Functions** tab or locally against the production DB.

---

## How to Use Each Panel

### Admin Flow
1. Log in as `admin@demo.com`
2. **Products** → Create products, set dimension, base-unit price, and stock
3. **Categories** → Organise products
4. **Inventory** → View live stock levels and estimated value
5. **Orders** → Review incoming quotations, confirm (deducts stock), fulfil, or cancel

### Seller Flow
1. Log in as `seller@demo.com`
2. **Browse Products** → Search/filter, see prices, available units
3. Enter quantity in your preferred unit (e.g., 2 kg) → see INR total preview update live
4. **Add to Cart** → adjust units/quantities in the cart
5. **Place Quotation** → add notes, submit
6. **My Orders** → track status

---

## Git Commit History

Commits follow a feature-by-feature incremental strategy:

| Commit | Description |
|---|---|
| `Initial commit` | Next.js scaffold |
| `feat: add ... dependencies` | Drizzle, jose, zod, bcryptjs, zustand |
| `feat: add Drizzle schema` | All tables with data type rationale in comments |
| `feat: add unit conversion utilities` | Conversion math + INR formatter |
| `feat: JWT session management + middleware` | Auth + RBAC |
| `feat: dark theme + login` | Design system + auth UI |
| `feat: sidebar + admin layout` | Navigation shell |
| `feat: admin product CRUD` | Products CRUD with server actions |
| `feat: admin categories + inventory` | Category management + stock overview |
| `feat: admin orders` | Order list + detail with conversion audit |
| `feat: seller layout + dashboard` | Seller shell |
| `feat: seller product browse + cart` | Browse, live price calc, cart store |
| `feat: seller cart + order placement` | Cart, order submission, history |
| `feat: seller order detail` | Per-order line-item view |
| `feat: DB seed script` | Test users, products, unit conversions |
| `docs: comprehensive README` | This file |
| `chore: Vercel config` | vercel.json |
