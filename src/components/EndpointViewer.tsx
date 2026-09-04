'use client'

import { Match } from '@/types/match'
import { toEndpoint } from '@/lib/mapper'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  match: Match | null
  onClose: () => void
}

export function EndpointViewer({ match, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  if (!match) return null

  const endpoint = toEndpoint(match)
  const json = JSON.stringify(endpoint, null, 2)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed — select the text and use Ctrl+C')
    }
  }

  return (
    <Dialog open={!!match} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {match.teams.home} vs {match.teams.away}
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <><Check className="h-4 w-4 mr-1" /> Copied</>
            ) : (
              <><Copy className="h-4 w-4 mr-1" /> Copy JSON</>
            )}
          </Button>
        </div>

        <pre
          role="region"
          aria-label={`API endpoint JSON for ${match.teams.home} vs ${match.teams.away}`}
          className="overflow-auto rounded-md bg-muted p-4 text-xs font-mono flex-1"
        >
          {json}
        </pre>
      </DialogContent>
    </Dialog>
  )
}
