import type { ReactNode } from 'react'

interface PageSectionProps {
  children: ReactNode
  className?: string
  size?: 'default' | 'large'
}

export function PageSection({ children, className = '', size = 'default' }: PageSectionProps) {
  const spacing = {
    compact: 'space-y-3',
    default: 'space-y-4',
    large: 'space-y-6',
  }

  return (
    <section className={`${spacing[size] ?? spacing.default} ${className}`}>
      {children}
    </section>
  )
}