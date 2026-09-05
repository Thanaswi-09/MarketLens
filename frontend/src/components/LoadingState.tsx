export function SkeletonCard() {
  return (
    <div className="rounded-xl p-4 border space-y-3" style={{ backgroundColor: '#151B23', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-3 w-28" />
        </div>
        <div className="space-y-2 items-end flex flex-col">
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-3 w-12" />
        </div>
      </div>
      <div className="skeleton h-1.5 w-full" />
      <div className="space-y-1.5">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="rounded-xl p-4 border" style={{ backgroundColor: '#151B23', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="skeleton h-3 w-20 mb-2" />
      <div className="skeleton h-7 w-12" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-xl p-4 border" style={{ backgroundColor: '#151B23', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="skeleton h-4 w-24 mb-4" />
      <div className="skeleton h-40 w-full" />
    </div>
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(56,189,248,0.3)', borderTopColor: '#38BDF8' }} />
      <p className="text-sm" style={{ color: '#667085' }}>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
        <span className="text-xl">⚠</span>
      </div>
      <div>
        <p className="font-semibold mb-1" style={{ color: '#F5F7FA' }}>Something went wrong</p>
        <p className="text-sm max-w-xs" style={{ color: '#9AA4B2' }}>{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 border"
          style={{ backgroundColor: '#1A222D', borderColor: 'rgba(255,255,255,0.08)', color: '#F5F7FA' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#222C3A')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1A222D')}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1A222D' }}>
        <span className="text-xl">📋</span>
      </div>
      <div>
        <p className="font-semibold mb-1" style={{ color: '#F5F7FA' }}>{title}</p>
        {description && <p className="text-sm max-w-xs" style={{ color: '#9AA4B2' }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}
