import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface-0)' }}>
      {/* Background gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--color-brand-600)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--color-brand-800)' }}
        />
      </div>

      <div className="relative w-full max-w-sm mx-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))' }}
          >
            <span className="text-2xl">📦</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text">InventoryPro</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Sign in to your account
          </p>
        </div>

        <div className="glass-card p-8">
          <LoginForm />
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Demo: admin@demo.com / Admin@123 &nbsp;|&nbsp; seller@demo.com / Seller@123
        </p>
      </div>
    </main>
  );
}
