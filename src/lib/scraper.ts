import { Match, EventStatus } from '@/types/match'
import { sortByKickoff } from '@/lib/mapper'

const BASE_URL =
  'https://stacy.olympics.com/srm/data/oly/schedule/day/ENG'

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
}

export interface RawUnit {
  id: string
  phaseName: string
  eventUnitName: string
  startDate: string
  venueDescription: string
  locationDescription: string
  status: string
  competitors: Array<{
    name: string
    order: number
    results: { mark: string }
  }>
}

interface OlympicUnit extends RawUnit {
  disciplineCode: string
  scheduleItemType: string
}

export function mapStatus(raw: string): EventStatus {
  const s = raw.toUpperCase()
  if (s.includes('EXTRA TIME') || s === 'AET') return 'AET'
  if (s.includes('PENALT') || s === 'PSO') return 'AP'
  if (s === 'FINISHED' || s === 'FINAL') return 'FT'
  if (s === 'CANCELLED' || s === 'CANCELED' || s === 'CANC') return 'CANC'
  if (s === 'LIVE' || s === 'ONGOING') return 'LIVE'
  return 'TBD'
}

export function mapRound(phaseName: string, eventUnitName?: string): string {
  const lower = phaseName.toLowerCase()
  const unitLower = (eventUnitName ?? '').toLowerCase()
  if (lower.includes('group')) return 'Group Stage'
  if (lower.includes('quarter')) return 'Quarter-final'
  if (lower.includes('semi')) return 'Semi-final'
  // Olympic API uses phaseName "Final" for bronze medal matches too;
  // fall back to eventUnitName to distinguish them.
  if (lower.includes('bronze') || unitLower.includes('bronze')) return 'Bronze Medal Match'
  if (lower.includes('gold') || lower.includes('final')) return 'Gold Medal Match'
  return phaseName
}

export function parseCity(locationDescription: string): string {
  const idx = locationDescription.lastIndexOf(',')
  return idx >= 0 ? locationDescription.slice(idx + 1).trim() : 'Paris'
}

export function parseMark(mark: string): number | null {
  if (mark === '') return null
  const n = parseInt(mark, 10)
  return Number.isNaN(n) ? null : n
}

type Competitor = RawUnit['competitors'][0]

export function findCompetitors(unit: RawUnit): [Competitor, Competitor] | null {
  const home = unit.competitors.find((c) => c.order === 0)
  const away = unit.competitors.find((c) => c.order === 1)
  return home && away ? [home, away] : null
}

function generateDates(start: string, end: string): string[] {
  const dates: string[] = []
  const current = new Date(start)
  const endDate = new Date(end)
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export interface ScrapeResult {
  matches: Match[]
  rawUnits: RawUnit[]
}

export async function scrapeOlympicSchedule(): Promise<ScrapeResult> {
  // Paris 2024 Olympic football ran 2024-07-24 to 2024-08-10 (women's final).
  // 2024-08-11 included as a safety margin for any late-scheduled matches.
  const dates = generateDates('2024-07-24', '2024-08-11')

  const dayResults = await Promise.all(
    dates.map(async (date) => {
      try {
        const res = await fetch(`${BASE_URL}/${date}.json`, {
          headers: FETCH_HEADERS,
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) return []
        const data = await res.json() as { units: OlympicUnit[] }
        return data.units.filter(
          (u) => u.disciplineCode === 'FBL' && u.scheduleItemType === 'H2H_NOC'
        )
      } catch (err) {
        console.warn(`[scraper] Failed to fetch schedule for ${date}:`, err)
        return []
      }
    })
  )

  const rawUnits: RawUnit[] = dayResults.flat()

  const matches: Match[] = rawUnits.flatMap((unit) => {
    const competitors = findCompetitors(unit)
    if (!competitors) return []
    const [home, away] = competitors

    const round = mapRound(unit.phaseName, unit.eventUnitName)

    return [{
      id: unit.id,
      sport: 'Football',
      discipline: unit.eventUnitName,
      round,
      venue: {
        name: unit.venueDescription,
        city: parseCity(unit.locationDescription),
      },
      kickoff: unit.startDate,
      status: mapStatus(unit.status),
      competition: {
        name: 'Paris 2024 Olympics',
        season: '2024',
        round,
      },
      teams: {
        home: home.name,
        away: away.name,
      },
      score: {
        home: parseMark(home.results.mark),
        away: parseMark(away.results.mark),
        halfTime: null,
      },
      scorers: [],
      lineups: { home: null, away: null },
    }]
  })

  return { matches: sortByKickoff(matches), rawUnits }
}
