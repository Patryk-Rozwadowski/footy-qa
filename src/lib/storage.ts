import { OlympicEvent } from '@/types/match'

const EVENTS_KEY = 'olympic-events'
const TIMESTAMP_KEY = 'olympic-events-fetched-at'
const SOURCE_KEY = 'olympic-events-source'

export interface CachedData {
  events: OlympicEvent[]
  fetchedAt: string
  source: 'live' | 'seed'
}

export function saveEvents(events: OlympicEvent[], source: 'live' | 'seed'): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString())
  localStorage.setItem(SOURCE_KEY, source)
}

export function loadEvents(): CachedData | null {
  const raw = localStorage.getItem(EVENTS_KEY)
  const fetchedAt = localStorage.getItem(TIMESTAMP_KEY)
  if (!raw || !fetchedAt) return null
  try {
    const source = (localStorage.getItem(SOURCE_KEY) ?? 'seed') as 'live' | 'seed'
    return { events: JSON.parse(raw) as OlympicEvent[], fetchedAt, source }
  } catch {
    return null
  }
}

export function clearEvents(): void {
  localStorage.removeItem(EVENTS_KEY)
  localStorage.removeItem(TIMESTAMP_KEY)
  localStorage.removeItem(SOURCE_KEY)
}

export function formatFetchedAt(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
