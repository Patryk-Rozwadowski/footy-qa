import { NextResponse } from 'next/server'
import { scrapeOlympicSchedule } from '@/lib/scraper'
import { PARIS_2024_EVENTS } from '@/data/paris2024-seed'

export async function GET() {
  // Try live scraping first; fall back to static seed data if blocked or unavailable
  try {
    const events = await scrapeOlympicSchedule()
    if (events.length > 0) {
      return NextResponse.json({
        events,
        fetchedAt: new Date().toISOString(),
        source: 'live',
      })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn('[scrape] Live scraping failed, using seed data:', msg)
  }

  return NextResponse.json({
    events: PARIS_2024_EVENTS,
    fetchedAt: new Date().toISOString(),
    source: 'seed',
  })
}
