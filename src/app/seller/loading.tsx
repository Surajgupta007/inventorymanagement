export default function SellerLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header Skeleton */}
      <div className="page-header mb-8">
        <div>
          <div className="shimmer h-8 w-64 mb-2" />
          <div className="shimmer h-4 w-48" />
        </div>
        <div className="shimmer h-10 w-40 rounded-lg" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="stat-card">
            <div className="shimmer h-8 w-8 mb-3 rounded-lg" />
            <div className="shimmer h-9 w-16 mb-2" />
            <div className="shimmer h-4 w-28" />
          </div>
        ))}
      </div>

      {/* Main Container Skeleton */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="shimmer h-6 w-32" />
          <div className="shimmer h-4 w-16" />
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{
                background: 'var(--color-surface-3)',
                border: '1px solid color-mix(in oklch, white 5%, transparent)',
              }}
            >
              <div>
                <div className="shimmer h-4 w-32 mb-2 font-mono" />
                <div className="shimmer h-3 w-20" />
              </div>
              <div className="flex items-center gap-3">
                <div className="shimmer h-4 w-16" />
                <div className="shimmer h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
