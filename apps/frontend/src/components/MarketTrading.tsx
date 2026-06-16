import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useCreateOrder } from '@/hooks'
import { formatCurrency, formatCents } from '@/lib/utils'
import type { OrderBookData, Outcome, OrderSide } from '@/api'
import { toast } from 'sonner'
import { TrendingUp, Activity, DollarSign, Info, X } from 'lucide-react'

interface SelectedOrder {
  price: number
  quantity: number
  side: 'BUY' | 'SELL'
}

interface MarketTradingProps {
  marketId: string
  orderbook: OrderBookData | null
  selectedOrder?: SelectedOrder | null
  onOrderSelected?: (order: SelectedOrder | null) => void
}

// Transform orderbook from YES space to NO space
function transformToNoSpace(orderbook: OrderBookData): OrderBookData {
  const noSpaceOrderbook: OrderBookData = {
    BUY: {},
    SELL: {},
  }

  // Transform Buy Yes to Sell No
  for (const [priceStr, quantity] of Object.entries(orderbook.BUY)) {
    const price = parseFloat(priceStr)
    const noPrice = 1 - price
    noSpaceOrderbook.SELL[noPrice.toFixed(2)] = quantity
  }

  // Transform Sell Yes to Buy No
  for (const [priceStr, quantity] of Object.entries(orderbook.SELL)) {
    const price = parseFloat(priceStr)
    const noPrice = 1 - price
    noSpaceOrderbook.BUY[noPrice.toFixed(2)] = quantity
  }

  return noSpaceOrderbook
}

export function MarketTrading({
  marketId,
  orderbook,
  selectedOrder,
  onOrderSelected,
}: MarketTradingProps) {
  const [outcome, setOutcome] = useState<Outcome>('YES')
  const [side, setSide] = useState<OrderSide>('BUY')
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [isManualPrice, setIsManualPrice] = useState(false)

  const createOrder = useCreateOrder()

  // Transform orderbook based on outcome
  const transformedOrderbook = useMemo(() => {
    if (!orderbook) return null
    return outcome === 'NO' ? transformToNoSpace(orderbook) : orderbook
  }, [orderbook, outcome])

  // Calculate best prices from the transformed orderbook
  const bestBuyPrice = useMemo(() => {
    if (!transformedOrderbook) return null
    const prices = Object.entries(transformedOrderbook.BUY)
      .map(([priceStr]) => parseFloat(priceStr))
      .sort((a, b) => b - a)
    return prices.length > 0 ? prices[0] : null
  }, [transformedOrderbook])

  const bestSellPrice = useMemo(() => {
    if (!transformedOrderbook) return null
    const prices = Object.entries(transformedOrderbook.SELL)
      .map(([priceStr]) => parseFloat(priceStr))
      .sort((a, b) => a - b)
    return prices.length > 0 ? prices[0] : null
  }, [transformedOrderbook])

  // Update form when selected order changes
  useEffect(() => {
    if (!selectedOrder) return

    // Clamp selected order price to valid range
    const clampedPrice = Math.max(0.01, Math.min(0.99, selectedOrder.price))
    setPrice(clampedPrice.toFixed(2))
    setSide(selectedOrder.side)
    setIsManualPrice(false)

    if (!amount) {
      setAmount(selectedOrder.quantity.toString())
    }
  }, [selectedOrder])

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numValue = parseFloat(value)

    // Clamp value between 0.01 and 0.99
    if (!isNaN(numValue)) {
      if (numValue < 0.01) {
        setPrice('0.01')
      } else if (numValue > 0.99) {
        setPrice('0.99')
      } else {
        setPrice(value)
      }
    } else {
      setPrice(value)
    }
    setIsManualPrice(true)
    onOrderSelected?.(null)
  }

  // When outcome changes, convert the current price to the new space
  useEffect(() => {
    if (!price || isManualPrice || selectedOrder) return

    const currentPrice = parseFloat(price)
    if (isNaN(currentPrice)) return

    // Convert price when switching between YES and NO space
    const newPrice = 1 - currentPrice

    // Clamp to valid range and update
    const clampedPrice = Math.max(0.01, Math.min(0.99, newPrice))
    setPrice(clampedPrice.toFixed(2))
  }, [outcome, isManualPrice, selectedOrder])

  // Set price based on side and best prices (only when not manual)
  useEffect(() => {
    if (isManualPrice || selectedOrder) return

    const currentPrice =
      side === 'BUY'
        ? bestSellPrice
        : bestBuyPrice

    if (currentPrice) {
      // Clamp to valid range
      const clampedPrice = Math.max(0.01, Math.min(0.99, currentPrice))
      if (price !== clampedPrice.toFixed(2)) {
        setPrice(clampedPrice.toFixed(2))
      }
    }
  }, [side, bestBuyPrice, bestSellPrice, isManualPrice, selectedOrder, price])

  const estimatedCost =
    price && amount ? parseFloat(price) * parseFloat(amount) : 0

  const estimatedShares =
    price && amount
      ? Math.floor(parseFloat(amount) / parseFloat(price))
      : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter valid amount')
      return
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error('Enter valid price')
      return
    }

    const priceValue = parseFloat(price)
    if (priceValue < 0.01 || priceValue > 0.99) {
      toast.error('Price must be between $0.01 and $0.99')
      return
    }

    const finalPrice = selectedOrder
      ? selectedOrder.price
      : priceValue

    const finalSide = selectedOrder
      ? selectedOrder.side
      : side

    createOrder.mutate(
      {
        marketId,
        side: finalSide,
        outcome,
        price: finalPrice,
        quantity:
          finalSide === 'BUY' ? estimatedShares : parseFloat(amount),
      },
      {
        onSuccess: () => {
          toast.success(`${finalSide} order placed`)
          setAmount('')
          setPrice('')
          setIsManualPrice(false)
          onOrderSelected?.(null)
        },
        onError: () => toast.error('Order failed'),
      }
    )
  }

  return (
    <Card className="trading-card overflow-hidden">
      {/* Selected Order Banner */}
      {selectedOrder && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-2">
          <div className="flex items-center gap-2 text-xs text-accent">
            <Info className="h-3 w-3" />
            <span className="font-medium">
              {selectedOrder.side} {outcome} @{' '}
              {formatCents(selectedOrder.price)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOrderSelected?.(null)}
            className="h-6 w-6 p-0 hover:bg-surface-3"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="trading-card-header">
        <h2 className="text-sm font-semibold text-center">Trade</h2>
      </div>

      <CardContent className="trading-card-body space-y-4">
        {/* Outcome - Segmented Control */}
        <div className="bg-surface-2 rounded-lg p-1 border border-border/50">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                setOutcome('YES')
                setIsManualPrice(false)
              }}
              className={`h-10 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                outcome === 'YES'
                  ? 'bg-yes text-white shadow-sm'
                  : 'text-text-secondary hover:text-text hover:bg-surface-3'
              }`}
            >
              <TrendingUp className="h-3 w-3" />
              YES
            </button>

            <button
              type="button"
              onClick={() => {
                setOutcome('NO')
                setIsManualPrice(false)
              }}
              className={`h-10 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                outcome === 'NO'
                  ? 'bg-no text-white shadow-sm'
                  : 'text-text-secondary hover:text-text hover:bg-surface-3'
              }`}
            >
              <Activity className="h-3 w-3" />
              NO
            </button>
          </div>
        </div>

        {/* Side - Segmented Control */}
        <div className="bg-surface-2 rounded-lg p-1 border border-border/50">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                setSide('BUY')
                setIsManualPrice(false)
              }}
              className={`h-9 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center ${
                side === 'BUY'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text hover:bg-surface-3'
              }`}
            >
              Buy
            </button>

            <button
              type="button"
              onClick={() => {
                setSide('SELL')
                setIsManualPrice(false)
              }}
              className={`h-9 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center ${
                side === 'SELL'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text hover:bg-surface-3'
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Price */}
          <div className="space-y-2">
            <Label className="text-xs text-text-muted">
              Price (USD)
            </Label>

            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />
              <Input
                value={price}
                onChange={handlePriceInputChange}
                className="pl-9 h-9"
                placeholder="0.50"
                type="number"
                step="0.01"
                min="0.01"
                max="0.99"
              />
            </div>

            {!selectedOrder && (
              <p className="text-xs text-text-muted">
                Best:{' '}
                {side === 'BUY'
                  ? (bestSellPrice ? formatCents(bestSellPrice) : '-')
                  : (bestBuyPrice ? formatCents(bestBuyPrice) : '-')}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label className="text-xs text-text-muted">
              {side === 'BUY' ? 'Amount (USD)' : 'Quantity'}
            </Label>

            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9"
              placeholder={side === 'BUY' ? '100.00' : '10'}
            />
          </div>

          {/* Summary */}
          <div className="surface-2 border border-border rounded-md p-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Est. Cost</span>
              <span>{formatCurrency(estimatedCost)}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Est. Shares</span>
              <span>
                {side === 'BUY' ? estimatedShares : amount || 0}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Avg Price</span>
              <span>
                {price ? formatCurrency(parseFloat(price)) : '-'}
              </span>
            </div>
          </div>

          {/* Info */}
          {side === 'BUY' && (
            <div className="bg-yes/10 border border-yes/20 rounded-md p-2 flex gap-2">
              <Info className="h-3 w-3 text-yes mt-0.5" />
              <p className="text-xs text-text-muted">
                Buying {outcome}. Each winning share pays $1.00.
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-9 text-xs font-semibold"
            disabled={createOrder.isPending}
          >
            {createOrder.isPending
              ? 'Placing...'
              : `${side} ${outcome}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}