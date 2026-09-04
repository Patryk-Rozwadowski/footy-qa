'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Match } from '@/types/match'
import { sortByKickoff } from '@/lib/mapper'
import { saveEvents, loadEvents, clearEvents, formatFetchedAt } from '@/lib/storage'
import { MatchTable } from '@/components/MatchTable'
import { EndpointViewer } from '@/components/EndpointViewer'
import { ExportButton } from '@/components/ExportButton'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react'

export function HomeClient() {
  const [matches, setMatches] = useState<Match[]>(
    () => sortByKickoff((loadEvents()?.events ?? []) as Match[])
  )
  const [fetchedAt, setFetchedAt] = useState<string | null>(() => loadEvents()?.fetchedAt ?? null)
  const [dataSource, setDataSource] = useState<'live' | 'seed' | null>(() => loadEvents()?.source ?? null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    const toastId = toast.loading('Loading Olympic schedule…')

    try {
      const res = await fetch('/api/scrape')
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const { events, fetchedAt: ts, source } = await res.json() as {
        events: Match[]
        fetchedAt: string
        source: 'live' | 'seed'
      }
      saveEvents(events, source)
      setMatches(events as Match[])
      setFetchedAt(ts)
      setDataSource(source)
      const label = source === 'seed' ? ' (static seed data)' : ''
      toast.success(`Loaded ${events.length} matches${label}`, { id: toastId })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to load data: ${msg}`, { id: toastId })
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    clearEvents()
    fetchMatches()
  }, [fetchMatches])

  const hasData = matches.length > 0

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">FootyScores QA Tool</h1>
        <p className="text-muted-foreground text-sm">
          Generate expected API endpoints for Paris 2024 Olympic football matches
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!hasData && !loading ? (
          <Button onClick={fetchMatches} disabled={loading}>
            Generate Endpoints
          </Button>
        ) : (
          <>
            <ExportButton matches={matches} disabled={loading} />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Force re-fetch schedule"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </>
        )}

        {fetchedAt && (
          <span
            className="text-xs text-muted-foreground ml-auto flex items-center gap-2"
            aria-live="polite"
          >
            {dataSource === 'seed' && (
              <span className="text-yellow-600 font-medium">Static data</span>
            )}
            Last fetched: {formatFetchedAt(fetchedAt)}
          </span>
        )}
      </div>

      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="py-16 text-center text-muted-foreground text-sm"
        >
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
          Loading Olympic schedule…
        </div>
      )}

      {!loading && hasData && (
        <MatchTable
          matches={matches}
          onSelect={setSelectedMatch}
          selectedId={selectedMatch?.id}
        />
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Failed to load schedule</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {!loading && !hasData && (
        <div role="status" className="py-16 text-center text-muted-foreground text-sm">
          Click <strong>Generate Endpoints</strong> to load match data.
        </div>
      )}

      <EndpointViewer key={selectedMatch?.id ?? ''} match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    </main>
  )
}
