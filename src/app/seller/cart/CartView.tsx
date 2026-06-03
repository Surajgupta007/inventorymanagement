'use client';

import { useCartStore } from '@/lib/cart-store';
import { formatINR, UNIT_LABELS, SupportedUnit, getUnitsForDimension } from '@/lib/units';
import { placeOrder } from '@/app/actions/seller';
import { useActionState, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartView() {
  const router = useRouter();
  const { items, removeItem, updateItem, clearCart, getTotalAmount } = useCartStore();
  const [notes, setNotes] = useState('');
  const [state, action, pending] = useActionState(placeOrder, undefined);

  useEffect(() => {
    if (state?.success && state?.orderId) {
      clearCart();
      router.push(`/seller/orders/${state.orderId}`);
    }
  }, [state, clearCart, router]);

  if (items.length === 0) {
    return (
      <div className="glass-card">
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <p>Your cart is empty.</p>
          <Link href="/seller/products" className="btn btn-primary mt-4">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Items */}
      <div className="col-span-2 flex flex-col gap-4">
        {items.map((item) => {
          const units = getUnitsForDimension(item.product.dimension);

          return (
            <div key={item.product.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {item.product.name}
                  </h3>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    ₹{parseFloat(item.product.pricePerBaseUnit).toLocaleString('en-IN', { maximumFractionDigits: 6 })}{' '}
                    / {item.product.baseUnit}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="btn btn-danger btn-sm"
                >
                  Remove
                </button>
              </div>

              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={item.orderedQuantity}
                  onChange={(e) => {
                    const q = parseFloat(e.target.value);
                    if (q > 0) updateItem(item.product.id, item.orderedUnit, q);
                  }}
                  min="0.000001"
                  step="any"
                  className="input-base"
                  style={{ maxWidth: 120 }}
                />
                <select
                  value={item.orderedUnit}
                  onChange={(e) =>
                    updateItem(item.product.id, e.target.value as SupportedUnit, item.orderedQuantity)
                  }
                  className="input-base"
                  style={{ maxWidth: 180 }}
                >
                  {units.map((u) => (
                    <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                  ))}
                </select>

                {/* Live conversion display */}
                <div className="flex-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  = {item.baseQuantity.toLocaleString('en-IN', { maximumFractionDigits: 6 })}{' '}
                  {item.product.baseUnit} (stored)
                </div>
              </div>

              <div
                className="mt-3 text-right text-sm font-semibold"
                style={{ color: 'var(--color-success)' }}
              >
                Line total: {formatINR(item.lineTotal)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order summary */}
      <div>
        <div className="glass-card p-6 sticky top-8">
          <h2 className="font-semibold mb-4">Order Summary</h2>

          <div className="flex flex-col gap-2 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {item.product.name} ({item.orderedQuantity} {item.orderedUnit})
                </span>
                <span style={{ color: 'var(--color-text-primary)' }}>{formatINR(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div
            className="border-t pt-4 mb-4"
            style={{ borderColor: 'color-mix(in oklch, white 8%, transparent)' }}
          >
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span style={{ color: 'var(--color-success)' }}>{formatINR(getTotalAmount())}</span>
            </div>
          </div>

          <div className="form-group mb-4">
            <label htmlFor="notes" className="form-label">Notes (optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-base"
              style={{ minHeight: 72, resize: 'vertical' }}
              placeholder="Any special instructions…"
            />
          </div>

          {state?.message && (
            <div className="form-error mb-3">{state.message}</div>
          )}

          <form
            action={(formData) => {
              formData.set(
                'items',
                JSON.stringify(
                  items.map((i) => ({
                    productId: i.product.id,
                    orderedUnit: i.orderedUnit,
                    orderedQuantity: i.orderedQuantity.toString(),
                  }))
                )
              );
              formData.set('notes', notes);
              action(formData);
            }}
          >
            <button
              type="submit"
              className="btn btn-primary w-full justify-center"
              disabled={pending}
            >
              {pending ? 'Placing Order…' : '✅ Place Quotation'}
            </button>
          </form>

          <button
            onClick={() => clearCart()}
            className="btn btn-secondary w-full justify-center mt-2"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}
