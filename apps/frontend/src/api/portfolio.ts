import api from '@/config/axios'
import type { Balance, Position, Trade, DepositRequest, WithdrawRequest } from './types'
import { convertRequestToCents, convertResponseToDollars, convertArrayResponseToDollars } from '@/lib/utils'

export const portfolioApi = {
  getBalance: async () => {
    const response = await api.get<{ balance: Balance, lockedBalance: Balance }>('/portfolio/balance')
    console.log(response);
    // Convert cents to dollars for display
    return convertResponseToDollars(response.data, ['balance', 'lockedBalance'])
  },

  getPositions: async () => {
    const response = await api.get<{ positions: Position[] }>('/portfolio/positions')
    // Convert totalSpent from cents to dollars
    return convertArrayResponseToDollars(response.data.positions, ['totalSpent'])
  },

  getHistory: async () => {
    const response = await api.get<{ trades: Trade[] }>('/portfolio/history')
    // Convert price fields from cents to dollars
    return convertArrayResponseToDollars(response.data.trades, ['takerPrice', 'makerPrice'])
  },

  deposit: async (data: DepositRequest) => {
    // Convert USD to cents before sending
    const request = convertRequestToCents(data, ['amount'])
    const response = await api.post<{ message: string; amount: number }>('/portfolio/deposit', request)
    // Convert response amount back to dollars
    return convertResponseToDollars(response.data, ['amount'])
  },

  withdraw: async (data: WithdrawRequest) => {
    // Convert USD to cents before sending
    const request = convertRequestToCents(data, ['amount'])
    const response = await api.post<{ message: string; amount: number }>('/portfolio/withdraw', request)
    // Convert response amount back to dollars
    return convertResponseToDollars(response.data, ['amount'])
  },
}
