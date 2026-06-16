import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`max-w-md mx-auto px-4 md:px-6 xl:px-8 py-6 ${className}`}>
      {children}
    </div>
  )
}