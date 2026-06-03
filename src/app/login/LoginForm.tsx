'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="form-group">
        <label htmlFor="email" className="form-label">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          className="input-base"
          autoComplete="email"
          required
        />
        {state?.errors?.email && (
          <p className="form-error">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          className="input-base"
          autoComplete="current-password"
          required
        />
        {state?.errors?.password && (
          <p className="form-error">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && (
        <div
          className="text-sm px-4 py-3 rounded-lg"
          style={{
            background: 'color-mix(in oklch, var(--color-danger) 15%, transparent)',
            color: 'var(--color-danger)',
            border: '1px solid color-mix(in oklch, var(--color-danger) 25%, transparent)',
          }}
        >
          {state.message}
        </div>
      )}

      <button type="submit" className="btn btn-primary w-full justify-center" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
