import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/api'
import type { CreateOrderRequest, SplitSharesRequest, MergeSharesRequest, SplitMergeResponse } from '@/api'

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersApi.createOrder(data),
    onSuccess: (_, variables) => {
      // Refresh balance, positions, and trade history
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      queryClient.invalidateQueries({ queryKey: ['tradeHistory'] })
      // Refresh the specific market's orderbook and data
      queryClient.invalidateQueries({ queryKey: ['market', variables.marketId] })
    },
  })
}

export function useSplitShares() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SplitSharesRequest) => ordersApi.splitShares(data),
    onSuccess: (data: SplitMergeResponse) => {
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      return data
    },
  })
}

export function useMergeShares() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MergeSharesRequest) => ordersApi.mergeShares(data),
    onSuccess: (data: SplitMergeResponse) => {
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      return data
    },
  })
}
