'use client';

import { useState } from 'react';
import { useCartStore, CartProduct } from '@/lib/cart-store';
import { getUnitsForDimension, SupportedUnit, UNIT_LABELS, calculateLineTotal, formatINR, Dimension } from '@/lib/units';

export default function AddToCartButton({ product }: { product: CartProduct }) {
  const units = getUnitsForDimension(product.dimension);
  const [unit, setUnit] = useState<SupportedUnit>(units[0]);
  const [qty, setQty] = useState<string>('1');
  const addItem = useCartStore((s) => s.addItem);

  const qtyNum = parseFloat(qty) || 0;
  const pricePerBase = parseFloat(product.pricePerBaseUnit);
  const { lineTotal } = qtyNum > 0 ? calculateLineTotal(qtyNum, unit, pricePerBase) : { lineTotal: 0 };

  function handleAdd() {
    if (qtyNum <= 0) return;
    addItem(product, unit, qtyNum);
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Live price preview */}
      {qtyNum > 0 && (
        <div
          className="text-xs px-3 py-2 rounded-lg text-center font-semibold"
          style={{
            background: 'color-mix(in oklch, var(--color-success) 10%, transparent)',
            color: 'var(--color-success)',
            border: '1px solid color-mix(in oklch, var(--color-success) 20%, transparent)',
          }}
        >
          {qtyNum} {unit} = {formatINR(lineTotal)}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          min="0.000001"
          step="any"
          className="input-base"
          style={{ maxWidth: 90 }}
          placeholder="Qty"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as SupportedUnit)}
          className="input-base"
          style={{ flex: 1 }}
        >
          {units.map((u) => (
            <option key={u} value={u}>{UNIT_LABELS[u]}</option>
          ))}
        </select>
      </div>
      <button
        onClick={handleAdd}
        disabled={qtyNum <= 0}
        className="btn btn-primary w-full justify-center"
      >
        🛒 Add to Cart
      </button>
    </div>
  );
}
