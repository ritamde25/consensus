import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { Market } from '@/api'

interface MarketHeaderProps {
  market: Market
}

export function MarketHeader({ market }: MarketHeaderProps) {
  const isResolved = market.isResolved
  const isExpired = new Date(market.resolutionDeadline) < new Date()

  const getStatus = () => {
    if (isResolved) {
      return {
        label: `Resolved ${market.resolvedOutcome}`,
        variant: 'outline' as const,
      }
    }

    if (isExpired) {
      return {
        label: 'Expired',
        variant: 'no' as const,
      }
    }

    return {
      label: 'Open',
      variant: 'yes' as const,
    }
  }

  const status = getStatus()

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={status.variant}>
          {status.label}
        </Badge>

        <span className="text-sm text-text-muted">
          Resolves {formatDateTime(market.resolutionDeadline)}
        </span>
      </div>

      <div className="max-w-5xl">
        <h1
          className="
            text-3xl
            font-semibold
            tracking-tight
            leading-tight
            text-text
            md:text-4xl
          "
        >
          {market.title}
        </h1>
      </div>

      {market.description && (
        <div className="max-w-3xl">
          <p
            className="
              text-base
              leading-7
              text-text-secondary
            "
          >
            {market.description}
          </p>
        </div>
      )}

      {(isResolved || isExpired) && (
        <div
          className="
            rounded-lg
            border
            border-border
            bg-surface-2
            px-4
            py-3
          "
        >
          <p className="text-sm text-text-secondary">
            {isResolved
              ? `This market resolved to ${market.resolvedOutcome}. Trading is closed.`
              : 'This market has reached its deadline and is awaiting resolution.'}
          </p>
        </div>
      )}
    </div>
  )
}