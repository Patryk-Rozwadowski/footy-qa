'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Match, OlympicEvent } from '@/types/match'
import { filterBySport, DEFAULT_SPORT, ALL_SPORTS } from '@/lib/mapper'
import { saveEvents, loadEvents, clearEvents, formatFetchedAt } from '@/lib/storage'
import { MatchTable } from '@/components/MatchTable'
import { EndpointViewer } from '@/components/EndpointViewer'
import { ExportButton } from '@/components/ExportButton'
import { SportSelector } from '@/components/SportSelector'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RefreshCw, Loader2, Info } from 'lucide-react'

export default function Home() {
  const [allEvents, setAllEvents] = useState<OlympicEvent[]>([])
  const [sport, setSport] = useState(DEFAULT_SPORT)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'live' | 'seed' | null>(null)

  const matches = filterBySport(allEvents, sport)

  const availableSports = useMemo(
    () => new Set(allEvents.map((e) => e.sport)),
    [allEvents]
  )

  // Auto-load from localStorage on mount — no fetch needed
  useEffect(() => {
    const cached = loadEvents()
    if (cached) {
      setAllEvents(cached.events)
      setFetchedAt(cached.fetchedAt)
      setDataSource(cached.source)
    }
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const toastId = toast.loading('Scraping Olympic schedule…')

    try {
      const res = await fetch('/api/scrape')
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? `HTTP ${res.status}`)
      }
      const { events, fetchedAt: ts, source } = await res.json() as {
        events: OlympicEvent[]
        fetchedAt: string
        source: 'live' | 'seed'
      }
      saveEvents(events, source)
      setAllEvents(events)
      setFetchedAt(ts)
      setDataSource(source)
      const label = source === 'seed' ? ' (static seed data)' : ''
      toast.success(`Loaded ${events.length} events${label}`, { id: toastId })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to load data: ${msg}`, { id: toastId })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    clearEvents()
    fetchEvents()
  }, [fetchEvents])

  const hasData = allEvents.length > 0

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">FootyScores QA Tool</h1>
        <p className="text-muted-foreground text-sm">
          Generate expected API endpoints for Paris 2024 Olympic team sport matches
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!hasData && !loading ? (
          <Button onClick={fetchEvents} disabled={loading}>
            Generate Endpoints
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <SportSelector
                value={sport}
                onChange={(s) => { setSport(s); setSelectedMatch(null) }}
                disabled={loading}
                availableSports={availableSports}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Data coverage information"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 text-sm" side="right">
                  <p className="font-medium mb-1">
                    {availableSports.size} of {ALL_SPORTS.length} sports have data
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Currently only <strong>Football</strong> (Men&apos;s and Women&apos;s)
                    is included in the dataset. Other team sports can be enabled by
                    extending the seed data or by allowing live scraping of the Olympic schedule.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <ExportButton matches={matches} sport={sport} disabled={loading} />
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
          sport={sport}
        />
      )}

      {!loading && !hasData && (
        <div role="status" className="py-16 text-center text-muted-foreground text-sm">
          Click <strong>Generate Endpoints</strong> to load match data.
        </div>
      )}

      <EndpointViewer match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    </main>
  )
}
