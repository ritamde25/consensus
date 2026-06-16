import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useModalStore } from '@/stores'
import { useMergeShares, usePositions } from '@/hooks'
import type { SplitMergeResponse } from '@/api/types'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

export function MergeModal() {
  const { isOpen, type, closeModal, data } = useModalStore()

  const [amount, setAmount] = useState('')

  const mergeShares = useMergeShares()
  const { data: positions } = usePositions()

  const isModalOpen = isOpen && type === 'merge'
  const marketId = data as { marketId: string } | undefined

  const totalYesShares = Array.isArray(positions)
    ? positions.reduce((sum, p) => sum + p.yesShares, 0)
    : 0

  const totalNoShares = Array.isArray(positions)
    ? positions.reduce((sum, p) => sum + p.noShares, 0)
    : 0

  const minShares = Math.min(totalYesShares, totalNoShares)
  const returnedUsd = amount ? parseFloat(amount) : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount) {
      toast.error('Please enter an amount')
      return
    }

    if (parseFloat(amount) > minShares) {
      toast.error(`You can only merge up to ${minShares} shares`)
      return
    }

    if (!marketId?.marketId) {
      toast.error('Market context is missing')
      return
    }

    mergeShares.mutate(
      {
        marketId: marketId.marketId,
        amount: parseFloat(amount),
      },
      {
        onSuccess: (data: SplitMergeResponse) => {
          console.log('Merge successful:', data)
          toast.success('Shares merged successfully')
          setAmount('')
          closeModal()
        },
        onError: () => {
          toast.error('Failed to merge shares')
        },
      }
    )
  }

  if (!isModalOpen) return null

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Merge Shares
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="mt-4 rounded-lg border bg-surface-elevated p-4">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-secondary-text">
                YES Shares
              </span>

              <span className="font-medium text-success">
                {totalYesShares}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-secondary-text">
                NO Shares
              </span>

              <span className="font-medium text-error">
                {totalNoShares}
              </span>
            </div>

            <div className="mt-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-text">
                  Maximum Mergeable
                </span>

                <span className="font-medium">
                  {minShares}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount to Merge
            </Label>

            <Input
              id="amount"
              type="number"
              step="1"
              min="0"
              max={minShares}
              placeholder="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="rounded-lg border bg-surface-elevated p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-text">
                Returned USD
              </span>

              <span className="text-lg font-semibold">
                {formatCurrency(returnedUsd)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={mergeShares.isPending}
            >
              {mergeShares.isPending
                ? 'Merging...'
                : 'Merge Shares'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}