export interface Competition {
  name: string
  season: string
  round: string
}

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

export type MatchStatus = 'FT' | 'AET' | 'AP' | 'CANC' | 'TBD'

export interface Match {
  competition: Competition
  venue: Venue
  kickoff: string | null
  status: MatchStatus
  teams: {
    home: string
    away: string
  }
  score: Score
  scorers: Scorer[]
  lineups: Lineups
}
