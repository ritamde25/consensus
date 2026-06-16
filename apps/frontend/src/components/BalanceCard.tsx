import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Wallet, TrendingUp, DollarSign } from 'lucide-react'

interface BalanceCardProps {
  title: string
  amount: number
  variant?: 'default' | 'success' | 'warning'
}

export function BalanceCard({
  title,
  amount,
  variant = 'default',
}: BalanceCardProps) {
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <Wallet className="h-4 w-4" />
      case 'warning':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getValueColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-400'
      case 'warning':
        return 'text-accent'
      default:
        return 'text-primary-text'
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-secondary-text">
              {title}
            </p>

            <div
              className={`text-xl font-semibold tabular-nums ${getValueColor()}`}
            >
              {formatCurrency(amount)}
            </div>
          </div>

          <div className="text-secondary-text">
            {getIcon()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}