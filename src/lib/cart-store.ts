import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateLineTotal, SupportedUnit, Dimension } from '@/lib/units';

export type CartProduct = {
  id: string;
  name: string;
  dimension: Dimension;
  baseUnit: SupportedUnit;
  pricePerBaseUnit: string;
  stockQuantity: string;
};

export type CartItem = {
  product: CartProduct;
  orderedUnit: SupportedUnit;
  orderedQuantity: number;
  baseQuantity: number;
  lineTotal: number;
};

type CartState = {
  items: CartItem[];
  addItem: (product: CartProduct, orderedUnit: SupportedUnit, orderedQuantity: number) => void;
  removeItem: (productId: string) => void;
  updateItem: (productId: string, orderedUnit: SupportedUnit, orderedQuantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, orderedUnit, orderedQuantity) => {
        const pricePerBase = parseFloat(product.pricePerBaseUnit);
        const { baseQty, lineTotal } = calculateLineTotal(orderedQuantity, orderedUnit, pricePerBase);

        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, orderedUnit, orderedQuantity, baseQuantity: baseQty, lineTotal }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { product, orderedUnit, orderedQuantity, baseQuantity: baseQty, lineTotal }],
          };
        });
      },

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),

      updateItem: (productId, orderedUnit, orderedQuantity) => {
        const item = get().items.find((i) => i.product.id === productId);
        if (!item) return;
        const pricePerBase = parseFloat(item.product.pricePerBaseUnit);
        const { baseQty, lineTotal } = calculateLineTotal(orderedQuantity, orderedUnit, pricePerBase);
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId
              ? { ...i, orderedUnit, orderedQuantity, baseQuantity: baseQty, lineTotal }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalAmount: () => get().items.reduce((sum, i) => sum + i.lineTotal, 0),
    }),
    { name: 'inventory-cart' }
  )
);
