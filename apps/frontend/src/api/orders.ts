import api from '@/config/axios'
import type { CreateOrderRequest, SplitSharesRequest, MergeSharesRequest, SplitMergeResponse } from './types'
import { convertRequestToCents, centsToDollars } from '@/lib/utils'

export const ordersApi = {
  createOrder: async (data: CreateOrderRequest) => {
    // Convert price from USD to cents before sending (backend expects 0-99 cents for $0.00-$0.99)
    const request = convertRequestToCents(data, ['price'])
    const response = await api.post('/orders/order', request)
    return response.data // Returns PlaceOrderResult
  },

  splitShares: async (data: SplitSharesRequest) => {
    // Convert amount from USD to cents before sending
    const request = convertRequestToCents(data, ['amount'])
    const response = await api.post<SplitMergeResponse>('/orders/split', request)
    // Convert position shares from cents to dollars for display
    const { position, ...rest } = response.data
    return {
      ...rest,
      position: {
        yesShares: centsToDollars(position.yesShares),
        noShares: centsToDollars(position.noShares),
        lockedYesShares: centsToDollars(position.lockedYesShares),
        lockedNoShares: centsToDollars(position.lockedNoShares)
      }
    }
  },

  mergeShares: async (data: MergeSharesRequest) => {
    // Convert amount from USD to cents before sending
    const request = convertRequestToCents(data, ['amount'])
    const response = await api.post<SplitMergeResponse>('/orders/merge', request)
    // Convert position shares from cents to dollars for display
    const { position, ...rest } = response.data
    return {
      ...rest,
      position: {
        yesShares: centsToDollars(position.yesShares),
        noShares: centsToDollars(position.noShares),
        lockedYesShares: centsToDollars(position.lockedYesShares),
        lockedNoShares: centsToDollars(position.lockedNoShares)
      }
    }
  },
}
