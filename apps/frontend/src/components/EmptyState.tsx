import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  title,
  description,
  action,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-10',
      icon: 'h-5 w-5',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-14',
      icon: 'h-6 w-6',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-20',
      icon: 'h-7 w-7',
      title: 'text-xl',
      description: 'text-base',
    },
  }

  const classes = sizeClasses[size]

  return (
    <div
      className={`flex flex-col items-center text-center ${classes.container}`}
    >
      <div className="mb-4 text-secondary-text">
        <Inbox className={classes.icon} />
      </div>

      <h3
        className={`${classes.title} font-medium text-primary-text`}
      >
        {title}
      </h3>

      {description && (
        <p
          className={`mt-2 max-w-md text-secondary-text ${classes.description}`}
        >
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          <Button
            variant="outline"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}