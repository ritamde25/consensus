export function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="h-7 w-40 skeleton rounded-md" />
        <div className="h-4 w-72 skeleton rounded-md" />
      </div>

      {/* Search / Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-full max-w-md skeleton rounded-md" />
        <div className="h-4 w-24 skeleton rounded-md" />
      </div>

      {/* Market Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="
              rounded-lg
              border
              border-border
              p-5
              space-y-4
            "
          >
            <div className="space-y-2">
              <div className="h-5 w-3/4 skeleton rounded-md" />
              <div className="h-4 w-full skeleton rounded-md" />
              <div className="h-4 w-2/3 skeleton rounded-md" />
            </div>

            <div className="flex justify-between">
              <div className="h-8 w-20 skeleton rounded-md" />
              <div className="h-8 w-20 skeleton rounded-md" />
            </div>

            <div className="h-4 w-24 skeleton rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}