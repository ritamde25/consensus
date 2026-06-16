import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Trade } from '@/api'
import { EmptyState } from './EmptyState'

interface HistoryTableProps {
  trades: Trade[]
}

export function HistoryTable({ trades }: HistoryTableProps) {
  if (trades.length === 0) {
    return (
      <EmptyState
        title="No trade history"
        description="Your completed trades will appear here."
        size="sm"
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Market</TableHead>
          <TableHead>Side</TableHead>
          <TableHead>Outcome</TableHead>
          <TableHead className="text-right">
            Price
          </TableHead>
          <TableHead className="text-right">
            Qty
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {trades.map((trade) => {
          const isTaker = true

          const side = isTaker ? 'BUY' : 'SELL'
          const price = isTaker
            ? trade.takerPrice
            : trade.makerPrice

          const outcome = isTaker
            ? trade.takerOutcome
            : trade.makerOutcome

          return (
            <TableRow key={trade.id}>
              <TableCell className="text-secondary-text">
                {formatDateTime(trade.createdAt)}
              </TableCell>

              <TableCell className="max-w-[200px]">
                <div className="truncate text-secondary-text" title={trade.marketTitle}>
                  {trade.marketTitle}
                </div>
              </TableCell>

              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    side === 'BUY'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                >
                  {side}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    outcome === 'YES'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                >
                  {outcome}
                </Badge>
              </TableCell>

              <TableCell className="text-right tabular-nums">
                {formatCurrency(price)}
              </TableCell>

              <TableCell className="text-right tabular-nums">
                {trade.quantity}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}