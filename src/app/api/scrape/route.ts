import { NextResponse } from 'next/server'
import { scrapeOlympicSchedule } from '@/lib/scraper'
import { sortByKickoff } from '@/lib/mapper'
import { PARIS_2024_EVENTS } from '@/data/paris2024-seed'

export async function GET() {
  try {
    const { matches } = await scrapeOlympicSchedule()
    if (matches.length > 0) {
      return NextResponse.json({
        events: matches,
        fetchedAt: new Date().toISOString(),
        source: 'live',
      })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn('[scrape] Live scraping failed, using seed data:', msg)
  }

  return NextResponse.json({
    events: sortByKickoff(PARIS_2024_EVENTS),
    fetchedAt: new Date().toISOString(),
    source: 'seed',
  })
}
