'use client';

import { useActionState } from 'react';
import { createCategory, deleteCategory } from '@/app/actions/admin';

function CategoryDeleteButton({ id, name }: { id: string; name: string }) {
  async function handleDelete() {
    if (!confirm(`Delete category "${name}"? Products will be uncategorised.`)) return;
    await deleteCategory(id);
  }
  return (
    <button onClick={handleDelete} className="btn btn-danger btn-sm">
      Delete
    </button>
  );
}

function CreateForm() {
  const [state, action, pending] = useActionState(createCategory, undefined);

  return (
    <div className="glass-card p-6">
      <h2 className="font-semibold mb-4">New Category</h2>
      <form action={action} className="flex flex-col gap-4">
        <div className="form-group">
          <label htmlFor="cat-name" className="form-label">Name *</label>
          <input
            id="cat-name"
            name="name"
            className="input-base"
            placeholder="e.g. Chemicals"
            required
          />
          {state?.errors?.name && <p className="form-error">{state.errors.name[0]}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="cat-desc" className="form-label">Description</label>
          <textarea
            id="cat-desc"
            name="description"
            className="input-base"
            style={{ minHeight: 72, resize: 'vertical' }}
            placeholder="Optional…"
          />
        </div>
        {state?.message && <p className="form-error">{state.message}</p>}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Creating…' : 'Create Category'}
        </button>
      </form>
    </div>
  );
}

function CategoryActions({ id, name }: { id: string; name: string }) {
  return <CategoryDeleteButton id={id} name={name} />;
}
CategoryActions.CreateForm = CreateForm;

export default CategoryActions;
