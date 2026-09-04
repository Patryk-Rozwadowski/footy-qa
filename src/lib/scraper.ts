import { chromium } from 'playwright'
import { Match, EventStatus, Venue } from '@/types/match'

const OLYMPIC_URL =
  process.env.OLYMPIC_SCHEDULE_URL ??
  'https://stacy.olympics.com/en/paris-2024/competition-schedule'

// Team sports that share the Match data structure
const TEAM_SPORTS: Record<string, string> = {
  football: 'Football',
  soccer: 'Football',
  basketball: 'Basketball',
  volleyball: 'Volleyball',
  'beach volleyball': 'Beach Volleyball',
  handball: 'Handball',
  'water polo': 'Water Polo',
  hockey: 'Hockey',
  'field hockey': 'Hockey',
  'rugby sevens': 'Rugby Sevens',
  rugby: 'Rugby Sevens',
}

function normalizeStatus(raw: string): EventStatus {
  const s = raw.trim().toUpperCase()
  if (s === 'FT' || s === 'FINISHED' || s === 'FINAL') return 'FT'
  if (s === 'AET' || s === 'AFTER EXTRA TIME') return 'AET'
  if (s === 'AP' || s === 'AFTER PENALTIES' || s === 'PSO') return 'AP'
  if (s === 'CANCELLED' || s === 'CANCELED' || s === 'CANC') return 'CANC'
  if (s === 'LIVE' || s === 'ONGOING') return 'LIVE'
  return 'TBD'
}

function resolveTeamSport(rawSport: string): string | null {
  const key = rawSport.toLowerCase().trim()
  for (const [pattern, canonical] of Object.entries(TEAM_SPORTS)) {
    if (key.includes(pattern)) return canonical
  }
  return null
}

function generateId(sport: string, round: string, home: string, away: string, kickoff: string | null): string {
  const slug = [sport, round, home, away, kickoff ?? 'tbd']
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
  return slug
}

export async function scrapeOlympicSchedule(): Promise<Match[]> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  })

  try {
    const page = await context.newPage()
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    })
    await page.goto(OLYMPIC_URL, { waitUntil: 'networkidle', timeout: 30000 })

    // Wait for schedule content to render
    await page.waitForSelector('[class*="schedule"], [class*="event"], [class*="match"]', {
      timeout: 10000,
    }).catch(() => { /* page may use different selectors — fall through to full parse */ })

    const rawEvents = await page.evaluate(() => {
      const results: Array<{
        sport: string
        discipline: string
        round: string
        venue: string
        city: string
        kickoff: string | null
        status: string
        homeTeam: string
        awayTeam: string
        homeScore: number | null
        awayScore: number | null
      }> = []

      // Try multiple selector strategies to be resilient to markup changes
      const rows = document.querySelectorAll(
        '[class*="ScheduleRow"], [class*="schedule-row"], [class*="EventRow"], [class*="match-row"], tr[class*="event"]'
      )

      rows.forEach((row) => {
        const text = (selector: string) =>
          row.querySelector(selector)?.textContent?.trim() ?? ''

        const sport = text('[class*="sport"], [class*="Sport"]')
        const discipline = text('[class*="discipline"], [class*="Discipline"]') || sport
        const round = text('[class*="round"], [class*="Round"], [class*="phase"], [class*="Phase"]')
        const venue = text('[class*="venue"], [class*="Venue"], [class*="stadium"], [class*="Stadium"]')
        const city = text('[class*="city"], [class*="City"], [class*="location"], [class*="Location"]')
        const kickoffRaw = row.querySelector('[class*="date"], [class*="time"], time')
          ?.getAttribute('datetime') ??
          row.querySelector('[class*="date"], [class*="time"], time')?.textContent?.trim() ??
          null
        const status = text('[class*="status"], [class*="Status"]') || 'TBD'

        const teamEls = row.querySelectorAll('[class*="team"], [class*="Team"]')
        const homeTeam = teamEls[0]?.textContent?.trim() ?? 'TBD'
        const awayTeam = teamEls[1]?.textContent?.trim() ?? 'TBD'

        const scoreEls = row.querySelectorAll('[class*="score"], [class*="Score"]')
        const homeScore = scoreEls[0] ? parseInt(scoreEls[0].textContent ?? '', 10) : null
        const awayScore = scoreEls[1] ? parseInt(scoreEls[1].textContent ?? '', 10) : null

        if (sport || homeTeam !== 'TBD') {
          results.push({
            sport,
            discipline,
            round,
            venue,
            city,
            kickoff: kickoffRaw,
            status,
            homeTeam,
            awayTeam,
            homeScore: isNaN(homeScore as number) ? null : homeScore,
            awayScore: isNaN(awayScore as number) ? null : awayScore,
          })
        }
      })

      return results
    })

    const events: Match[] = rawEvents
      .filter((e) => resolveTeamSport(e.sport) !== null)
      .map((e) => {
        const canonicalSport = resolveTeamSport(e.sport) ?? e.sport
        const venue: Venue = { name: e.venue || 'Unknown', city: e.city || 'Paris' }
        const kickoff = e.kickoff ?? null

        return {
          id: generateId(canonicalSport, e.round, e.homeTeam, e.awayTeam, kickoff),
          sport: canonicalSport,
          discipline: e.discipline,
          round: e.round || 'Group Stage',
          venue,
          kickoff,
          status: normalizeStatus(e.status),
          teams: { home: e.homeTeam, away: e.awayTeam },
          score: {
            home: e.homeScore,
            away: e.awayScore,
            halfTime: null,
          },
          scorers: [],
          lineups: { home: null, away: null },
          competition: {
            name: 'Paris 2024 Olympics',
            season: '2024',
            round: e.round || 'Group Stage',
          },
        }
      })

    // Deterministic sort: ascending kickoff, nulls last
    events.sort((a, b) => {
      if (!a.kickoff && !b.kickoff) return 0
      if (!a.kickoff) return 1
      if (!b.kickoff) return -1
      return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    })

    return events
  } finally {
    await context.close()
    await browser.close()
  }
}
