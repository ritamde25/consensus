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
import { useWithdraw, useBalance } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Wallet, DollarSign } from 'lucide-react'

export function WithdrawModal() {
  const { isOpen, type, closeModal } = useModalStore()
  const [amount, setAmount] = useState('')
  const withdraw = useWithdraw()
  const { data: balance } = useBalance()

  const isOpenModal = isOpen && type === 'withdraw'
  const maxAmount = balance?.balance || 0

  const parsed = parseFloat(amount || '0')
  const isValid = parsed > 0 && parsed <= maxAmount

  const setQuickAmount = (percent: number) => {
    const value = ((maxAmount * percent) / 100).toFixed(2)
    setAmount(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      toast.error('Enter a valid withdrawal amount')
      return
    }

    withdraw.mutate(
      { amount: parsed },
      {
        onSuccess: () => {
          toast.success('Withdrawal successful')
          setAmount('')
          closeModal()
        },
        onError: () => toast.error('Failed to withdraw'),
      }
    )
  }

  if (!isOpenModal) return null

  return (
    <Dialog open={isOpenModal} onOpenChange={closeModal}>
      <DialogContent className="border-border/30 shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <Wallet className="h-5 w-5 text-warning" />
            </div>
            Withdraw Funds
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">

        <div className="space-y-2"></div>

          {/* BALANCE CARD */}
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            <div className="text-xs text-secondary-text">Available balance</div>
            <div className="text-2xl font-bold text-success numeric mt-1">
              {formatCurrency(maxAmount)}
            </div>
          </div>

          {/* INPUT */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Amount</Label>

            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary-text" />
              <Input
                type="number"
                step="0.01"
                min="0"
                max={maxAmount}
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* QUICK ACTIONS */}
            <div className="flex gap-2 pt-1">
              {[25, 50, 75].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQuickAmount(p)}
                  className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-surface-elevated transition"
                >
                  {p}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(maxAmount.toString())}
                className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-surface-elevated transition font-medium"
              >
                Max
              </button>
            </div>

            {/* FEEDBACK */}
            {amount && (
              <div className="text-xs flex justify-between text-secondary-text pt-1">
                <span>After withdrawal</span>
                <span className={isValid ? 'text-warning' : 'text-error'}>
                  {formatCurrency(Math.max(0, maxAmount - parsed))}
                </span>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="h-11"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={withdraw.isPending || !isValid}
              className="h-11 flex-1 shadow-lg"
            >
              {withdraw.isPending ? 'Processing...' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}