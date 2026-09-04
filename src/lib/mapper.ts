import { OlympicEvent, Match, MatchEndpoint } from '@/types/match'

function isMatch(event: OlympicEvent): event is Match {
  return (
    'teams' in event &&
    'score' in event &&
    'competition' in event &&
    'scorers' in event &&
    'lineups' in event
  )
}

export function filterBySport(events: OlympicEvent[], sport: string): Match[] {
  const normalized = sport.trim().toLowerCase()
  return events.filter(
    (e): e is Match => e.sport.toLowerCase() === normalized && isMatch(e)
  )
}

export const SPORT_GROUPS: { label: string; sports: string[] }[] = [
  {
    label: 'Football',
    sports: ['Football'],
  },
  {
    label: 'Other Team Sports',
    sports: [
      'Basketball',
      'Volleyball',
      'Beach Volleyball',
      'Handball',
      'Water Polo',
      'Hockey',
      'Rugby Sevens',
    ],
  },
]

export const ALL_SPORTS: string[] = SPORT_GROUPS.flatMap((g) => g.sports)

export const DEFAULT_SPORT = 'Football'

export function toEndpoint(match: Match): MatchEndpoint {
  return {
    competition: match.competition,
    venue: match.venue,
    kickoff: match.kickoff,
    status: match.status,
    teams: match.teams,
    score: match.score,
    scorers: match.scorers,
    lineups: match.lineups,
  }
}
