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
import { useSplitShares } from '@/hooks'
import type { SplitMergeResponse } from '@/api/types'
import { toast } from 'sonner'
import { TrendingUp, DollarSign, Activity } from 'lucide-react'

export function SplitModal() {
  const { isOpen, type, closeModal, data } = useModalStore()
  const [amount, setAmount] = useState('')
  const splitShares = useSplitShares()

  const isOpenModal = isOpen && type === 'split'
  const marketId = data as { marketId: string } | undefined

  const yesShares = amount ? Math.floor(parseFloat(amount) * 1) : 0
  const noShares = amount ? Math.floor(parseFloat(amount) * 1) : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount) {
      toast.error('Please enter an amount')
      return
    }

    if (!marketId?.marketId) {
      toast.error('Market context is missing')
      return
    }

    splitShares.mutate(
      { marketId: marketId.marketId, amount: parseFloat(amount) },
      {
        onSuccess: (data: SplitMergeResponse) => {
          console.log('Split successful:', data)
          toast.success('Shares split successfully')
          setAmount('')
          closeModal()
        },
        onError: () => {
          toast.error('Failed to split shares')
        },
      }
    )
  }

  if (!isOpenModal) return null

  return (
    <Dialog open={isOpenModal} onOpenChange={closeModal}>
      <DialogContent className="border-border bg-surface">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Split Shares
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs text-text-secondary">
              Amount (USD)
            </Label>

            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />

              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="border border-border rounded-md bg-surface-2 p-3 space-y-2">
            <p className="text-xs text-text-muted">You will receive</p>

            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-2 text-yes">
                <TrendingUp className="h-3 w-3" />
                YES
              </div>
              <span className="font-medium numeric">{yesShares}</span>
            </div>

            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-2 text-no">
                <Activity className="h-3 w-3" />
                NO
              </div>
              <span className="font-medium numeric">{noShares}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="h-9 text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={splitShares.isPending}
              className="h-9 text-xs"
            >
              {splitShares.isPending ? 'Splitting...' : 'Split'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}