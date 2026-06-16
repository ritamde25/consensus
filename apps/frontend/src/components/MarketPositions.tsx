import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Position } from '@/api'
import { EmptyState } from './EmptyState'
import { useModalStore } from '@/stores'

interface MarketPositionsProps {
  positions: Position[]
  marketId: string
}

export function MarketPositions({
  positions,
  marketId,
}: MarketPositionsProps) {
  const { openModal } = useModalStore()

  const totalYesShares = positions?.reduce(
    (sum, pos) => sum + pos.yesShares + pos.lockedYesShares,
    0
  ) ?? 0

  const totalNoShares = positions?.reduce(
    (sum, pos) => sum + pos.noShares + pos.lockedNoShares,
    0
  ) ?? 0

  const totalSpent = positions?.reduce(
    (sum, pos) => sum + pos.totalSpent,
    0
  ) ?? 0

  const totalLockedYes = positions?.reduce(
    (sum, pos) => sum + pos.lockedYesShares,
    0
  ) ?? 0

  const totalLockedNo = positions?.reduce(
    (sum, pos) => sum + pos.lockedNoShares,
    0
  ) ?? 0

  const availableYes = totalYesShares - totalLockedYes
  const availableNo = totalNoShares - totalLockedNo

  const canMerge =
    Math.min(availableYes, availableNo) > 0

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        {!positions?.length && (
          <EmptyState
            size="sm"
            title="No positions"
            description="You have no exposure in this market."
          />
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Your Position
          </h3>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openModal('split', { marketId })
              }
            >
              Split
            </Button>

            {canMerge && (
              <Button
                size="sm"
                onClick={() =>
                  openModal('merge', { marketId })
                }
              >
                Merge
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-4">
            <div className="text-xs text-text-muted mb-1">
              YES Shares
            </div>

            <div className="text-2xl font-semibold text-yes">
              {totalYesShares}
            </div>

            <div className="text-xs text-text-secondary mt-2">
              {availableYes} available
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="text-xs text-text-muted mb-1">
              NO Shares
            </div>

            <div className="text-2xl font-semibold text-no">
              {totalNoShares}
            </div>

            <div className="text-xs text-text-secondary mt-2">
              {availableNo} available
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              Total Cost Basis
            </span>

            <span className="font-semibold">
              {formatCurrency(totalSpent)}
            </span>
          </div>
        </div>

        {positions && positions.length > 1 && (
          <div className="pt-4 border-t border-border">
            <div className="text-xs uppercase tracking-wide text-text-muted mb-3">
              Position Breakdown
            </div>

            <div className="space-y-2">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-lg
                    border
                    border-border
                    px-3
                    py-2
                  "
                >
                  <span className="text-sm">
                    YES {position.yesShares}
                    {' · '}
                    NO {position.noShares}
                  </span>

                  <span className="text-sm text-text-secondary">
                    {formatCurrency(position.totalSpent)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}