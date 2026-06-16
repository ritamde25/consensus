import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatCents(amount: number): string {
  const cents = Math.round(amount * 100)
  return `${cents}¢`
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString))
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

// Convert cents to dollars
export function centsToDollars(cents: number): number {
  return cents / 100
}

// Convert dollars to cents
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

// API request conversion - convert USD fields to cents before sending to backend
export function convertRequestToCents<T extends Record<string, any>>(data: T, usdFields: (keyof T)[]): T {
  const result = { ...data }
  for (const field of usdFields) {
    if (typeof result[field] === 'number') {
      result[field] = dollarsToCents(result[field] as number) as T[keyof T]
    }
  }
  return result
}

// API response conversion - convert cent fields to dollars after receiving from backend
export function convertResponseToDollars<T extends Record<string, any>>(data: T, centFields: (keyof T)[]): T {
  const result = { ...data }
  for (const field of centFields) {
    if (typeof result[field] === 'number') {
      result[field] = centsToDollars(result[field] as number) as T[keyof T]
    }
  }
  return result
}

// Convert array of responses
export function convertArrayResponseToDollars<T extends Record<string, any>>(
  data: T[],
  centFields: (keyof T)[]
): T[] {
  return data.map(item => convertResponseToDollars(item, centFields))
}

// Safe number parsing with fallback
export function safeParseFloat(value: string | number | undefined | null, fallback: number = 0): number {
  if (typeof value === 'number') return value
  if (!value) return fallback
  const parsed = parseFloat(value)
  return isNaN(parsed) ? fallback : parsed
}

// Safe array check
export function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : []
}

// Price normalization functions based on consensus whitepaper
// YES-space: YES orders at price p → p, NO orders at price p → (1-p)
// NO-space: YES orders at price p → (1-p), NO orders at price p → p
// Note: prices are in USD (e.g., 0.50), so 1-p means 1.00 - price

export function toYesSpacePrice(price: number, outcome: 'YES' | 'NO'): number {
  return outcome === 'YES' ? price : 1 - price
}

export function toNoSpacePrice(price: number, outcome: 'YES' | 'NO'): number {
  return outcome === 'NO' ? price : 1 - price
}

export interface NormalizedOrder {
  id: string
  originalPrice: number
  normalizedPrice: number
  originalOutcome: 'YES' | 'NO'
  side: 'BUY' | 'SELL'
  remaining: number
  quantity: number
  status: string
  userId: string
  marketId: string
  createdAt: Date
  updatedAt: Date
}

export function normalizeOrdersToSpace(
  orders: any[],
  space: 'YES' | 'NO'
): NormalizedOrder[] {
  return orders.map(order => {
    const normalizedPrice = space === 'YES'
      ? toYesSpacePrice(order.price, order.outcome)
      : toNoSpacePrice(order.price, order.outcome)

    return {
      id: order.id,
      originalPrice: order.price,
      normalizedPrice,
      originalOutcome: order.outcome,
      side: order.side,
      remaining: order.remaining,
      quantity: order.quantity,
      status: order.status,
      userId: order.userId,
      marketId: order.marketId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }
  })
}

export function filterOpenOrders(orders: NormalizedOrder[]): NormalizedOrder[] {
  return orders.filter(order => order.status === 'OPEN' && order.remaining > 0)
}

// Group orders by normalized price, summing up remaining and total value
export function groupOrdersByPrice(orders: NormalizedOrder[]): NormalizedOrder[] {
  const grouped = new Map<number, NormalizedOrder>()

  for (const order of orders) {
    const existing = grouped.get(order.normalizedPrice)
    if (existing) {
      // Sum up remaining and quantity
      existing.remaining += order.remaining
      existing.quantity += order.quantity
    } else {
      // Create a new entry
      grouped.set(order.normalizedPrice, { ...order })
    }
  }

  return Array.from(grouped.values())
}

// Flip the buy/sell side for UI display when converting between spaces
// When outcome differs from space, we need to flip the side for display
export function flipSideForDisplay(
  side: 'BUY' | 'SELL',
  outcome: 'YES' | 'NO',
  space: 'YES' | 'NO'
): 'BUY' | 'SELL' {
  // Only flip when the outcome is different from the display space
  if (outcome !== space) {
    return side === 'BUY' ? 'SELL' : 'BUY'
  }
  return side
}
