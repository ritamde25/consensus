import type { ReactNode } from 'react'

interface TableContainerProps {
  children: ReactNode
  className?: string
}

export function TableContainer({ children, className = '' }: TableContainerProps) {
  return (
    <div className={`rounded-lg border overflow-hidden ${className}`}>
      {children}
    </div>
  )
}
