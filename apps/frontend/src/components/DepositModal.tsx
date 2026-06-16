import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useModalStore } from '@/stores'
import { useDeposit, useBalance } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Wallet, DollarSign, TrendingUp } from 'lucide-react'

export function DepositModal() {
  const { isOpen, type, closeModal } = useModalStore()
  const [amount, setAmount] = useState('')
  const deposit = useDeposit()
  const { data: balance } = useBalance()

  const isModalOpen = isOpen && type === 'deposit'
  const currentBalance = balance?.balance || 0

  const parsed = parseFloat(amount || '0')
  const newBalance = currentBalance + parsed
  const isValid = parsed > 0

  const setQuickAmount = (value: number) => {
    setAmount(value.toFixed(2))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      toast.error('Enter a valid amount')
      return
    }

    deposit.mutate(
      { amount: parsed },
      {
        onSuccess: () => {
          toast.success('Deposit successful')
          setAmount('')
          closeModal()
        },
        onError: () => toast.error('Failed to deposit'),
      }
    )
  }

  if (!isModalOpen) return null

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="border-border/30 shadow-2xl max-w-md">

        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="p-2 rounded-lg bg-success/10">
              <Wallet className="h-5 w-5 text-success" />
            </div>
            Deposit Funds
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="space-y-5"></div>

          {/* BALANCE CARD */}
          <div className="rounded-xl border border-border bg-surface-elevated p-4 flex justify-between items-center">
            <div>
              <div className="text-xs text-secondary-text">Current balance</div>
              <div className="text-xl font-bold text-primary-text numeric">
                {formatCurrency(currentBalance)}
              </div>
            </div>
            <TrendingUp className="h-5 w-5 text-success" />
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
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* QUICK AMOUNTS */}
            <div className="flex gap-2 pt-1 flex-wrap">
              {[50, 100, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuickAmount(val)}
                  className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-surface-elevated transition"
                >
                  +{val}
                </button>
              ))}
            </div>

            {/* PREVIEW */}
            {isValid && (
              <div className="text-xs flex justify-between pt-1">
                <span className="text-secondary-text">New balance</span>
                <span className="font-semibold text-success numeric">
                  {formatCurrency(newBalance)}
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
              disabled={deposit.isPending || !isValid}
              className="h-11 flex-1 shadow-lg shadow-success/20"
            >
              {deposit.isPending ? 'Processing...' : 'Deposit'}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}