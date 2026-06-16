import { useMarketAnalysis } from '@/hooks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SimpleMarkdown } from './SimpleMarkdown'
import { AnalysisLoading } from './AnalysisLoading'
import { RefreshCw } from 'lucide-react'

interface MarketAnalysisCardProps {
  marketId: string
}

export function MarketAnalysisCard({ marketId }: MarketAnalysisCardProps) {
  const { data, isLoading, error, refetch } = useMarketAnalysis(marketId)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>AI Analysis</CardTitle>
          <Badge variant="subtle">Experimental</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <AnalysisLoading />}

        {error && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted">
              Unable to generate AI analysis.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          </div>
        )}

        {data && !isLoading && !error && (
          <SimpleMarkdown content={data.content} />
        )}
      </CardContent>
    </Card>
  )
}
