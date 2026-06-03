'use client';

import { deleteProduct } from '@/app/actions/admin';
import { useState } from 'react';

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Archive "${name}"? It will be hidden from sellers.`)) return;
    setLoading(true);
    await deleteProduct(id);
    setLoading(false);
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="btn btn-danger btn-sm">
      {loading ? '…' : 'Archive'}
    </button>
  );
}
