'use client';

import { updateOrderStatus } from '@/app/actions/admin';
import { useState } from 'react';

type Props = {
  orderId: string;
  currentStatus: string;
};

const TRANSITIONS: Record<string, { label: string; next: 'confirmed' | 'fulfilled' | 'cancelled'; cls: string }[]> = {
  quotation: [
    { label: 'Confirm', next: 'confirmed', cls: 'btn-success' },
    { label: 'Cancel', next: 'cancelled', cls: 'btn-danger' },
  ],
  confirmed: [
    { label: 'Fulfil', next: 'fulfilled', cls: 'btn-success' },
    { label: 'Cancel', next: 'cancelled', cls: 'btn-danger' },
  ],
  fulfilled: [],
  cancelled: [],
};

export default function OrderStatusActions({ orderId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const transitions = TRANSITIONS[currentStatus] ?? [];
  if (transitions.length === 0) return null;

  async function handle(next: 'confirmed' | 'fulfilled' | 'cancelled') {
    setLoading(true);
    await updateOrderStatus(orderId, next);
    setLoading(false);
  }

  return (
    <>
      {transitions.map((t) => (
        <button
          key={t.next}
          onClick={() => handle(t.next)}
          disabled={loading}
          className={`btn btn-sm ${t.cls}`}
        >
          {loading ? '…' : t.label}
        </button>
      ))}
    </>
  );
}
