import type { ReactNode } from 'react'

interface StackProps {
  children: ReactNode
  spacing?: 2 | 3 | 4 | 6 | 8
  className?: string
}

export function Stack({
  children,
  spacing = 4,
  className = '',
}: StackProps) {
  const spacingClasses = {
    2: 'space-y-2',
    3: 'space-y-3',
    4: 'space-y-4',
    6: 'space-y-6',
    8: 'space-y-8',
  }

  return (
    <div className={`${spacingClasses[spacing] ?? 'space-y-4'} ${className}`}>
      {children}
    </div>
  )
}