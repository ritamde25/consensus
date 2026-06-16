import type { ReactNode } from 'react'
import clsx from 'clsx'

interface CardContentProps {
  children: ReactNode
  size?: 'default' | 'compact' | 'large'
  className?: string
}

export function CardContentWrapper({ children, size = 'default', className }: CardContentProps) {
  return (
    <div
      className={clsx(
        {
          compact: 'p-3',
          default: 'p-4',
          large: 'p-6',
        }[size],
        className
      )}
    >
      {children}
    </div>
  )
}