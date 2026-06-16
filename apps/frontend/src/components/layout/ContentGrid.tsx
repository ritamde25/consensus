import type { ReactNode } from 'react'

interface ContentGridProps {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4
  className?: string
}

export function ContentGrid({ children, cols = 3, className = '' }: ContentGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid gap-4 ${gridCols[cols]} ${className}`}>
      {children}
    </div>
  )
}