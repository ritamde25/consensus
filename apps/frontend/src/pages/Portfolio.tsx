import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BalanceCard, PositionTable, HistoryTable, EmptyState } from '@/components'
import { Button } from '@/components/ui/button'
import { useBalance, usePositions, useTradeHistory } from '@/hooks'
import { useModalStore } from '@/stores'
import { LoadingSkeleton } from '@/components'
import { PageContainer, PageHeader, ContentGrid, Stack } from '@/components/layout'

export function Portfolio() {
  const {
    data: balanceData,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useBalance()

  const {
    data: positions,
    isLoading: positionsLoading,
    refetch: refetchPositions,
  } = usePositions()

  const {
    data: history,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useTradeHistory()

  const { openModal } = useModalStore()
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions')

  const isLoading = balanceLoading || positionsLoading || historyLoading
  const balance = balanceData?.balance;
  const lockedBalance = balanceData?.lockedBalance

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton />
      </PageContainer>
    )
  }

  if (balanceError) {
    return (
      <PageContainer>
        <EmptyState
          title="Portfolio unavailable"
          description="Unable to load data."
          action={{
            label: 'Retry',
            onClick: () => {
              refetchBalance()
              refetchPositions()
              refetchHistory()
            },
          }}
        />
      </PageContainer>
    )
  }

  if (balance == null) {
    return (
      <PageContainer>
        <EmptyState
          title="No portfolio data"
          description="Try again later"
        />
      </PageContainer>
    )
  }

  const balanceUsd = balance ?? 0
  const lockedBalanceUsd = lockedBalance ?? 0
  const totalBalanceUsd = balanceUsd + lockedBalanceUsd

  return (
    <PageContainer>
      <Stack spacing={6}>
        {/* Header (compact + functional) */}
        <PageHeader
          title="Portfolio"
          description="Your positions and activity"
          actions={
            <div className="flex gap-2">
              <Button
                onClick={() => openModal('deposit')}
                className="h-9 text-xs"
              >
                Deposit
              </Button>

              <Button
                variant="outline"
                onClick={() => openModal('withdraw')}
                className="h-9 text-xs"
              >
                Withdraw
              </Button>
            </div>
          }
        />

        {/* Balance strip (less “dashboard cards”, more terminal blocks) */}
        <ContentGrid cols={3}>
          <BalanceCard
            title="Available"
            amount={balanceUsd}
            variant="success"
          />
          <BalanceCard
            title="Locked"
            amount={lockedBalanceUsd}
            variant="warning"
          />
          <BalanceCard
            title="Total"
            amount={totalBalanceUsd}
            variant="default"
          />
        </ContentGrid>

        {/* Main panel */}
        <div className="border border-border bg-surface rounded-md">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            {/* compact segmented control */}
            <div className="border-b border-border p-2">
              <TabsList className="grid grid-cols-2 h-9 w-full bg-transparent">
                <TabsTrigger value="positions" className="text-xs">
                  Positions
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">
                  History
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-3">
              <TabsContent value="positions">
                <PositionTable positions={positions ?? []} />
              </TabsContent>

              <TabsContent value="history">
                <HistoryTable trades={history ?? []} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Stack>
    </PageContainer>
  )
}