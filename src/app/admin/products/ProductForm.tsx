'use client';

import { useActionState, useState } from 'react';
import { createProduct, updateProduct, ProductFormState } from '@/app/actions/admin';
import { BASE_UNIT, UNIT_LABELS, Dimension, SupportedUnit, UNITS_BY_DIMENSION } from '@/lib/units';
import type { Category, Product } from '@/lib/db/schema';
import Link from 'next/link';

type Props = {
  categories: Category[];
  product?: Product;
};

export default function ProductForm({ categories, product }: Props) {
  const isEdit = !!product;
  const action = isEdit
    ? updateProduct.bind(null, product.id)
    : createProduct;

  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(action, undefined);
  const [selectedDimension, setSelectedDimension] = useState<Dimension>(
    (product?.dimension as Dimension) ?? 'weight'
  );

  const baseUnit = BASE_UNIT[selectedDimension];
  const unitLabel = UNIT_LABELS[baseUnit as SupportedUnit];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Name & SKU */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Product Name *</label>
          <input
            id="name"
            name="name"
            className="input-base"
            defaultValue={product?.name ?? ''}
            placeholder="e.g. Sodium Chloride"
            required
          />
          {state?.errors?.name && <p className="form-error">{state.errors.name[0]}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="sku" className="form-label">SKU</label>
          <input
            id="sku"
            name="sku"
            className="input-base"
            defaultValue={product?.sku ?? ''}
            placeholder="e.g. NaCl-001"
          />
        </div>
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description" className="form-label">Description</label>
        <textarea
          id="description"
          name="description"
          className="input-base"
          style={{ minHeight: 80, resize: 'vertical' }}
          defaultValue={product?.description ?? ''}
          placeholder="Optional product description…"
        />
      </div>

      {/* Category */}
      <div className="form-group">
        <label htmlFor="categoryId" className="form-label">Category</label>
        <select id="categoryId" name="categoryId" className="input-base" defaultValue={product?.categoryId ?? ''}>
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Dimension */}
      <div className="form-group">
        <label className="form-label">Dimension *</label>
        <div className="flex gap-3">
          {(['weight', 'volume', 'count'] as Dimension[]).map((dim) => (
            <label
              key={dim}
              className="flex items-center gap-2 cursor-pointer px-4 py-3 rounded-lg transition-all"
              style={{
                background:
                  selectedDimension === dim
                    ? 'color-mix(in oklch, var(--color-brand-600) 20%, transparent)'
                    : 'var(--color-surface-3)',
                border: `1px solid ${
                  selectedDimension === dim
                    ? 'var(--color-brand-500)'
                    : 'color-mix(in oklch, white 8%, transparent)'
                }`,
              }}
            >
              <input
                type="radio"
                name="dimension"
                value={dim}
                checked={selectedDimension === dim}
                onChange={() => setSelectedDimension(dim)}
                className="sr-only"
              />
              <span className="text-sm font-medium capitalize">{dim}</span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                ({BASE_UNIT[dim]})
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Base unit for storage: <strong style={{ color: 'var(--color-brand-400)' }}>{unitLabel}</strong>
        </p>
      </div>

      {/* Price & Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="pricePerBaseUnit" className="form-label">
            Price per {UNIT_LABELS[baseUnit as SupportedUnit]} (₹) *
          </label>
          <input
            id="pricePerBaseUnit"
            name="pricePerBaseUnit"
            className="input-base"
            type="number"
            step="0.000001"
            min="0"
            defaultValue={product?.pricePerBaseUnit ?? ''}
            placeholder="0.00"
            required
          />
          {state?.errors?.pricePerBaseUnit && (
            <p className="form-error">{state.errors.pricePerBaseUnit[0]}</p>
          )}
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            INR per {BASE_UNIT[selectedDimension]}
          </p>
        </div>
        <div className="form-group">
          <label htmlFor="stockQuantity" className="form-label">
            Stock ({BASE_UNIT[selectedDimension]}) *
          </label>
          <input
            id="stockQuantity"
            name="stockQuantity"
            className="input-base"
            type="number"
            step="0.000001"
            min="0"
            defaultValue={product?.stockQuantity ?? '0'}
            required
          />
          {state?.errors?.stockQuantity && (
            <p className="form-error">{state.errors.stockQuantity[0]}</p>
          )}
        </div>
      </div>

      {/* Low stock threshold */}
      <div className="form-group">
        <label htmlFor="lowStockThreshold" className="form-label">
          Low Stock Alert Threshold ({BASE_UNIT[selectedDimension]})
        </label>
        <input
          id="lowStockThreshold"
          name="lowStockThreshold"
          className="input-base"
          type="number"
          step="0.000001"
          min="0"
          defaultValue={product?.lowStockThreshold ?? '0'}
          style={{ maxWidth: 200 }}
        />
      </div>

      {/* Status */}
      <div className="form-group">
        <label className="form-label">Status</label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <label
              key={String(val)}
              className="flex items-center gap-2 cursor-pointer px-4 py-3 rounded-lg"
              style={{
                background: 'var(--color-surface-3)',
                border: '1px solid color-mix(in oklch, white 8%, transparent)',
              }}
            >
              <input
                type="radio"
                name="isActive"
                value={String(val)}
                defaultChecked={product ? product.isActive === val : val === true}
              />
              <span className="text-sm">{val ? 'Active' : 'Inactive'}</span>
            </label>
          ))}
        </div>
      </div>

      {state?.message && (
        <p className="form-error">{state.message}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
        </button>
        <Link href="/admin/products" className="btn btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
