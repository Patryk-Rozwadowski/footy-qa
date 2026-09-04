export type EventStatus = 'FT' | 'AET' | 'AP' | 'CANC' | 'TBD' | 'LIVE'

export interface Venue {
  name: string
  city: string
}

export interface Score {
  home: number | null
  away: number | null
  halfTime: { home: number; away: number } | null
}

export interface Scorer {
  team: string
  player: string
  minute: number
  assist?: string
  type: string
}

export interface Player {
  name: string
  number: number
  position: string
}

export interface TeamLineup {
  team: string
  formation: string | null
  coach: string | null
  startingXI: Player[]
  bench: Player[]
}

export interface Lineups {
  home: TeamLineup | null
  away: TeamLineup | null
}

// Base type for every Olympic event regardless of sport
export interface OlympicEvent {
  id: string
  sport: string
  discipline: string
  round: string
  venue: Venue
  kickoff: string | null
  status: EventStatus
}

// Extension for match-format sports (football, basketball, volleyball, etc.)
export interface Match extends OlympicEvent {
  competition: {
    name: string
    season: string
    round: string
  }
  teams: {
    home: string
    away: string
  }
  score: Score
  scorers: Scorer[]
  lineups: Lineups
}

// Exported endpoint shape — matches example.json exactly.
// Internal fields (id, sport, discipline) are stripped before export.
export interface MatchEndpoint {
  competition: {
    name: string
    season: string
    round: string
  }
  venue: Venue
  kickoff: string | null
  status: EventStatus
  teams: {
    home: string
    away: string
  }
  score: Score
  scorers: Scorer[]
  lineups: Lineups
}
