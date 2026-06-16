import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { Position } from '@/api'
import { EmptyState } from './EmptyState'

interface PositionTableProps {
  positions: Position[]
}

export function PositionTable({ positions }: PositionTableProps) {
  if (positions.length === 0) {
    return (
      <EmptyState
        title="No positions yet"
        description="Start trading to build your portfolio"
      />
    )
  }

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Positions
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market</TableHead>
                <TableHead className="text-right">
                  YES Shares
                </TableHead>
                <TableHead className="text-right">
                  NO Shares
                </TableHead>
                <TableHead className="text-right">
                  Total Spent
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {positions.map((position) => (
                <TableRow
                  key={position.id}
                  className="hover:bg-surface-elevated/30 transition-colors"
                >
                  <TableCell className="max-w-[200px]">
                    <div className="truncate" title={position.marketTitle}>
                      {position.marketTitle}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Badge
                      variant="success"
                      className="font-medium"
                    >
                      {position.yesShares}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <Badge
                      variant="destructive"
                      className="font-medium"
                    >
                      {position.noShares}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right font-semibold text-accent">
                    {formatCurrency(position.totalSpent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}