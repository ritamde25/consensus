import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { portfolioApi } from '@/api'
import type { DepositRequest, WithdrawRequest } from '@/api'

export function useBalance() {
  return useQuery({
    queryKey: ['balance'],
    queryFn: portfolioApi.getBalance,
  })
}

export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: portfolioApi.getPositions,
  })
}

export function useTradeHistory() {
  return useQuery({
    queryKey: ['tradeHistory'],
    queryFn: portfolioApi.getHistory,
  })
}

export function useDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DepositRequest) => portfolioApi.deposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })
}

export function useWithdraw() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WithdrawRequest) => portfolioApi.withdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })
}
