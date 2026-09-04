'use client'

import { Match } from '@/types/match'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

interface Props {
  matches: Match[]
  onSelect: (match: Match) => void
  selectedId?: string
  sport: string
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    FT: 'default',
    AET: 'default',
    AP: 'default',
    LIVE: 'destructive',
    CANC: 'secondary',
    TBD: 'outline',
  }
  return <Badge variant={variants[status] ?? 'outline'}>{status}</Badge>
}

function formatKickoff(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatScore(match: Match): string {
  const { home, away } = match.score
  if (home === null || away === null) return '—'
  return `${home} – ${away}`
}

export function MatchTable({ matches, onSelect, selectedId, sport }: Props) {
  if (matches.length === 0) {
    return (
      <div
        role="status"
        className="py-16 text-center text-sm text-muted-foreground flex flex-col gap-2"
      >
        <p className="font-medium">No matches found for {sport}.</p>
        <p className="text-xs">
          Only Football (Men&apos;s and Women&apos;s) data is included in the current dataset.
          Other sports can be added by extending the seed data or enabling live scraping.
        </p>
      </div>
    )
  }

  return (
    <div role="region" aria-label="Match list">
      <p className="text-xs text-muted-foreground mb-2">{matches.length} matches</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Round</TableHead>
            <TableHead>Home</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead>Away</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="sr-only">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow
              key={match.id}
              data-selected={match.id === selectedId}
              className="data-[selected=true]:bg-muted"
            >
              <TableCell className="whitespace-nowrap text-sm">
                {formatKickoff(match.kickoff)}
              </TableCell>
              <TableCell className="text-sm">{match.round}</TableCell>
              <TableCell className="font-medium">{match.teams.home}</TableCell>
              <TableCell className="text-center font-mono font-semibold">
                {formatScore(match)}
              </TableCell>
              <TableCell className="font-medium">{match.teams.away}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {match.venue.name}
              </TableCell>
              <TableCell>
                <StatusBadge status={match.status} />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(match)}
                  aria-label={`View endpoint for ${match.teams.home} vs ${match.teams.away}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
