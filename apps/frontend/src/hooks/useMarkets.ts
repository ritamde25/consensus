import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { marketsApi } from '@/api'
import type { CreateMarketRequest } from '@/api'

export function useMarkets() {
  return useQuery({
    queryKey: ['markets'],
    queryFn: marketsApi.getAll,
  })
}

export function useMarket(id: string) {
  return useQuery({
    queryKey: ['market', id],
    queryFn: () => marketsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateMarket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMarketRequest) => marketsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] })
    },
  })
}

export function useMarketAnalysis(marketId: string) {
  return useQuery({
    queryKey: ['market-analysis', marketId],
    queryFn: () => marketsApi.generateAnalysis(marketId),
    enabled: !!marketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}
