import api from '@/config/axios'
import type { Market, CreateMarketRequest, MarketDetailsResponse, MarketAnalysis } from './types'
import { convertArrayResponseToDollars } from '@/lib/utils'

export const marketsApi = {
  getAll: async () => {
    const response = await api.get<{ markets: Market[] }>('/markets')
    return response.data.markets
  },

  getById: async (id: string) => {
    const response = await api.get<MarketDetailsResponse>(`/markets/${id}`)
    const data = response.data

    // Convert orderbook prices from cents to dollars
    const orderbook = data.orderbook ? {
      BUY: Object.fromEntries(
        Object.entries(data.orderbook.BUY).map(([priceStr, quantity]) => [
          (parseFloat(priceStr) / 100).toFixed(2),
          quantity
        ])
      ),
      SELL: Object.fromEntries(
        Object.entries(data.orderbook.SELL).map(([priceStr, quantity]) => [
          (parseFloat(priceStr) / 100).toFixed(2),
          quantity
        ])
      )
    } : null

    // Convert position totalSpent from cents to dollars
    const userPositions = convertArrayResponseToDollars(data.userPositions || [], ['totalSpent'])

    return {
      market: data.market,
      orderbook,
      userPositions,
    }
  },

  create: async (data: CreateMarketRequest) => {
    const response = await api.post<{ message: string }>('/markets/create', data)
    return response.data // Returns { message: "Market created succesfully" }
  },

  generateAnalysis: async (marketId: string) => {
    const response = await api.get<MarketAnalysis>(`/markets/${marketId}/analysis`)
    return response.data
  },
}
