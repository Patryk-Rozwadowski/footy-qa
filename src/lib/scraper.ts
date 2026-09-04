import { Match, EventStatus } from '@/types/match'

const BASE_URL =
  process.env.OLYMPIC_SCHEDULE_URL ??
  'https://stacy.olympics.com/srm/data/oly/schedule/day/ENG'

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
}

interface OlympicUnit {
  id: string
  disciplineCode: string
  eventUnitName: string
  phaseName: string
  startDate: string
  venueDescription: string
  locationDescription: string
  status: string
  scheduleItemType: string
  competitors: Array<{
    name: string
    order: number
    results: { mark: string }
  }>
}

function mapStatus(raw: string): EventStatus {
  const s = raw.toUpperCase()
  if (s.includes('EXTRA TIME') || s === 'AET') return 'AET'
  if (s.includes('PENALT') || s === 'PSO') return 'AP'
  if (s === 'FINISHED' || s === 'FINAL') return 'FT'
  if (s === 'CANCELLED' || s === 'CANCELED' || s === 'CANC') return 'CANC'
  if (s === 'LIVE' || s === 'ONGOING') return 'LIVE'
  return 'TBD'
}

function mapRound(phaseName: string): string {
  const lower = phaseName.toLowerCase()
  if (lower.includes('group')) return 'Group Stage'
  if (lower.includes('quarter')) return 'Quarter-final'
  if (lower.includes('semi')) return 'Semi-final'
  if (lower.includes('bronze')) return 'Bronze Medal Match'
  if (lower.includes('gold') || lower.includes('final')) return 'Gold Medal Match'
  return phaseName
}

function parseCity(locationDescription: string): string {
  const idx = locationDescription.lastIndexOf(',')
  return idx >= 0 ? locationDescription.slice(idx + 1).trim() : 'Paris'
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

export async function scrapeOlympicSchedule(): Promise<Match[]> {
  // Paris 2024 Olympic football ran 2024-07-24 to 2024-08-10
  const dates = generateDates('2024-07-24', '2024-08-10')

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
      } catch {
        return []
      }
    })
  )

  const matches: Match[] = dayResults.flat().flatMap((unit) => {
    const home = unit.competitors.find((c) => c.order === 0)
    const away = unit.competitors.find((c) => c.order === 1)
    if (!home || !away) return []

    const round = mapRound(unit.phaseName)

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
        home: home.results.mark !== '' ? parseInt(home.results.mark, 10) : null,
        away: away.results.mark !== '' ? parseInt(away.results.mark, 10) : null,
        halfTime: null,
      },
      scorers: [],
      lineups: { home: null, away: null },
    }]
  })

  matches.sort((a, b) => {
    if (!a.kickoff && !b.kickoff) return 0
    if (!a.kickoff) return 1
    if (!b.kickoff) return -1
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  })

  return matches
}
