import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--color-surface-0)' }}>
      {/* Background gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--color-brand-600)' }}
        />
      </div>

      <div className="relative text-center max-w-md mx-4 z-10 animate-fade-in">
        {/* Error Code */}
        <div className="mb-6">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4"
            style={{ background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))' }}
          >
            <span className="text-4xl">🔍</span>
          </div>
          <h1 className="text-8xl font-black gradient-text tracking-tighter">404</h1>
          <h2 className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text-primary)' }}>
            Page Not Found
          </h2>
          <p className="mt-3 text-sm px-6" style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
            Sorry, the page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="glass-card p-6 flex flex-col gap-4">
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Need to manage inventory or check your orders?
          </p>
          <Link href="/" className="btn btn-primary w-full justify-center">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
