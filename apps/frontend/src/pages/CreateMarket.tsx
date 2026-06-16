import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useCreateMarket } from '@/hooks'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  PageContainer,
  PageHeader,
  Stack,
} from '@/components/layout'

export function CreateMarket() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resolutionDate, setResolutionDate] = useState('')

  const createMarket = useCreateMarket()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description || !resolutionDate) {
      toast.error('Please fill in all fields')
      return
    }

    createMarket.mutate(
      {
        title,
        description,
        resolutionDeadline: resolutionDate,
      },
      {
        onSuccess: () => {
          toast.success('Market created successfully')
          navigate('/')
        },
        onError: () => {
          toast.error('Failed to create market')
        },
      }
    )
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl">
        <Stack spacing={8}>
          <PageHeader
            title="Create Market"
            description="Create a binary prediction market with clear resolution criteria."
          />

          <Card>
            <CardContent className="p-6">
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Market Title
                  </Label>

                  <Input
                    id="title"
                    type="text"
                    placeholder="Will Bitcoin reach $100,000 by December 31, 2026?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={createMarket.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Resolution Criteria
                  </Label>

                  <textarea
                    id="description"
                    placeholder="Describe exactly how this market will resolve and what sources will be used to determine the outcome."
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    disabled={createMarket.isPending}
                    className="
                      min-h-[160px]
                      w-full
                      rounded-md
                      border
                      border-border
                      bg-surface
                      px-3
                      py-2
                      text-sm
                      text-primary-text
                      placeholder:text-secondary-text
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-accent
                      hover:border-border-hover
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      resize-none
                      transition-colors
                    "
                  />

                  <p className="text-xs text-secondary-text">
                    Be specific. Ambiguous markets create disputes during settlement.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolutionDate">
                    Resolution Deadline
                  </Label>

                  <Input
                    id="resolutionDate"
                    type="date"
                    value={resolutionDate}
                    onChange={(e) =>
                      setResolutionDate(e.target.value)
                    }
                    disabled={createMarket.isPending}
                  />

                  <p className="text-xs text-secondary-text">
                    Trading will stop when the market reaches its resolution deadline.
                  </p>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      disabled={createMarket.isPending}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      disabled={createMarket.isPending}
                    >
                      {createMarket.isPending
                        ? 'Creating...'
                        : 'Create Market'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </Stack>
      </div>
    </PageContainer>
  )
}