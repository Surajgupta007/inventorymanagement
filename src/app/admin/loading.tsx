export default function AdminLoading() {
  return (
    <div className="animate-fade-in">
      {/* Header Skeleton */}
      <div className="page-header mb-8">
        <div>
          <div className="shimmer h-8 w-48 mb-2" />
          <div className="shimmer h-4 w-72" />
        </div>
        <div className="shimmer h-10 w-32 rounded-lg" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="shimmer h-8 w-8 rounded-lg" />
              <div className="shimmer h-2 w-2 rounded-full" />
            </div>
            <div className="shimmer h-9 w-16 mb-2" />
            <div className="shimmer h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Recent Activity/Orders Skeleton */}
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
                  <div className="shimmer h-4 w-28 mb-2" />
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

        {/* Right Side: Quick Actions/Side Section Skeleton */}
        <div className="glass-card p-6">
          <div className="shimmer h-6 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl flex items-center gap-3"
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid color-mix(in oklch, white 6%, transparent)',
                }}
              >
                <div className="shimmer h-6 w-6 rounded-md" />
                <div className="shimmer h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
