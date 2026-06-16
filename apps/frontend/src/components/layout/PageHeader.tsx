import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <div className="shrink-0">
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {title}
            </h1>

            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}