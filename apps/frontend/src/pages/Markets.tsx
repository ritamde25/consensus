import { useState } from 'react'
import { useMarkets } from '@/hooks'
import { MarketCard, SearchInput, LoadingSkeleton, EmptyState } from '@/components'
import { PageContainer, PageHeader, ContentGrid, Stack } from '@/components/layout'

export function Markets() {
  const { data: markets, isLoading, error, refetch } = useMarkets()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMarkets = Array.isArray(markets)
    ? markets
        .filter((m) => {
          const q = searchQuery.toLowerCase()
          return (
            m.title.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q)
          )
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
    : []

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <EmptyState
          title="Failed to load markets"
          description="Try again in a moment."
          action={{
            label: 'Retry',
            onClick: () => refetch(),
          }}
        />
      </PageContainer>
    )
  }

  if (!markets || markets.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          title="No markets"
          description="New markets will appear here."
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Stack spacing={6}>
        {/* Header (keep minimal, no heavy SaaS framing) */}
        <PageHeader
          title="Markets"
          description="Trade on real-world outcomes"
        />

        {/* Search row (remove border + spacing-heavy divider style) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search markets"
            />
          </div>

          <div className="text-xs text-text-muted">
            {filteredMarkets.length} market
            {filteredMarkets.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Empty search state */}
        {filteredMarkets.length === 0 ? (
          <EmptyState
            title="No matches"
            description="Try a different search"
          />
        ) : (
          <ContentGrid cols={3}>
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </ContentGrid>
        )}
      </Stack>
    </PageContainer>
  )
}