import { NextResponse } from 'next/server'
import { PARIS_2024_EVENTS } from '@/data/paris2024-seed'
import { toEndpoint } from '@/lib/mapper'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params
  const match = PARIS_2024_EVENTS.find((m) => m.id === matchId)

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const endpoint = toEndpoint(match)

  // Intentional discrepancies — simulating a real FootyScores API response
  // that uses slightly different conventions from what we expect.
  // These mismatches are what the Compare tab is designed to catch.
  const mockResponse = {
    ...endpoint,
    status: 'FINISHED',                        // wrong: should be "FT"
    competition: {
      ...endpoint.competition,
      season: '2024/25',                       // wrong: should be "2024"
    },
    score: {
      ...endpoint.score,
      halfTime: { home: 0, away: 0 },          // wrong: should be null
    },
  }

  return NextResponse.json(mockResponse)
}
