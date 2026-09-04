import { Match, MatchEndpoint } from '@/types/match'

export function sortByKickoff(events: Match[]): Match[] {
  return [...events].sort((a, b) => {
    if (!a.kickoff && !b.kickoff) return 0
    if (!a.kickoff) return 1
    if (!b.kickoff) return -1
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  })
}

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
