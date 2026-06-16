export type MarketStatus = 'OPEN' | 'CLOSED' | 'RESOLVED'
export type OrderSide = 'BUY' | 'SELL'
export type OrderOutcome = 'YES' | 'NO'
export type Outcome = 'YES' | 'NO'
export type OrderStatus = 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED'

// Database schema aligned types
// Note: All monetary values in frontend types are in USD (e.g., 10.50 = $10.50)
// Backend stores and processes monetary values in cents (e.g., 1050 = $10.50)
// API layer handles automatic conversion between USD and cents

export interface Market {
  id: string
  title: string
  description: string
  resolutionDeadline: string
  isResolved: boolean
  resolvedOutcome: Outcome | null
  createdAt: string
  updatedAt: string
}

export interface Trade {
  id: string
  marketId: string
  marketTitle: string
  takerId: string
  makerId: string
  quantity: number
  takerPrice: number // USD
  makerPrice: number // USD
  takerOrderId: string
  makerOrderId: string
  takerOutcome: Outcome
  makerOutcome: Outcome
  createdAt: string
}

export interface Position {
  id: string
  userId: string
  marketId: string
  marketTitle: string
  yesShares: number
  noShares: number
  lockedYesShares: number
  lockedNoShares: number
  totalSpent: number // USD
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  userId: string
  marketId: string
  side: OrderSide
  outcome: Outcome
  price: number // USD
  normalizedPrice: number // USD
  quantity: number
  remaining: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

// Balance is in USD (API converts from cents)
export type Balance = number

export interface CreateOrderRequest {
  marketId: string
  side: OrderSide
  outcome: Outcome
  price: number // USD - API will convert to cents
  quantity: number
}

export interface SplitSharesRequest {
  marketId: string
  amount: number // USD - API will convert to cents
}

export interface MergeSharesRequest {
  marketId: string
  amount: number // USD - API will convert to cents
}

export interface SplitMergeResponse {
  success: boolean
  position: {
    yesShares: number
    noShares: number
    lockedYesShares: number
    lockedNoShares: number
  }
}

export interface DepositRequest {
  amount: number // USD - API will convert to cents
}

export interface WithdrawRequest {
  amount: number // USD - API will convert to cents
}

export interface CreateMarketRequest {
  title: string
  description: string
  resolutionDeadline: string
}

// New orderbook format - price (string) to quantity (number) mapping
export interface OrderBookEntry {
  [price: string]: number
}

export interface OrderBookData {
  BUY: OrderBookEntry
  SELL: OrderBookEntry
}

// Market details response with orderbook and positions
export interface MarketDetailsResponse {
  market: Market | null
  orderbook: OrderBookData // Prices in USD (as strings), quantities as numbers
  userPositions: Position[] // totalSpent in USD
}

// Market analysis response
export interface MarketAnalysis {
  id: string
  marketId: string
  content: string
  createdAt: string
}
