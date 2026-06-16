import { Brain } from 'lucide-react'

export function AnalysisLoading() {
  return (
    <div className="space-y-4">
      {/* AI Icon with pulse animation */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
          <Brain className="h-6 w-6 text-accent relative" />
        </div>
        <span className="text-xs font-medium text-text-muted animate-pulse">
          Analyzing market data...
        </span>
      </div>

      {/* Animated skeleton lines */}
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`
              h-4 rounded-md bg-gradient-to-r from-surface-2 via-surface-3 to-surface-2
              bg-[length:200%_100%] animate-shimmer
              ${i === 0 || i === 6 ? 'w-3/4' : 'w-full'}
            `}
            style={{
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mt-4">
        <div className="flex-1 h-1 bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full bg-accent/50 rounded-full animate-progress" />
        </div>
      </div>
    </div>
  )
}
