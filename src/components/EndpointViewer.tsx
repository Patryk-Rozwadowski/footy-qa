'use client'

import { Match, MatchEndpoint } from '@/types/match'
import { toEndpoint } from '@/lib/mapper'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { toast } from 'sonner'

interface Props {
  match: Match | null
  onClose: () => void
}

interface FieldResult {
  path: string
  expected: string
  actual: string
  match: boolean
}

function flatCompare(expected: MatchEndpoint, actual: unknown): FieldResult[] {
  const results: FieldResult[] = []

  function walk(exp: unknown, act: unknown, path: string) {
    if (exp === null || typeof exp !== 'object' || Array.isArray(exp)) {
      const expStr = JSON.stringify(exp)
      const actStr = act === undefined ? '— missing —' : JSON.stringify(act)
      results.push({ path, expected: expStr, actual: actStr, match: expStr === actStr })
      return
    }
    for (const [key, value] of Object.entries(exp as Record<string, unknown>)) {
      const child = path ? `${path}.${key}` : key
      const actChild =
        act && typeof act === 'object' && !Array.isArray(act)
          ? (act as Record<string, unknown>)[key]
          : undefined
      walk(value, actChild, child)
    }
  }

  walk(expected, actual, '')
  return results
}

export function EndpointViewer({ match, onClose }: Props) {
  const [mode, setMode] = useState<'expected' | 'compare'>('expected')
  const [copied, setCopied] = useState(false)
  const [actualInput, setActualInput] = useState('')
  const [fetching, setFetching] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const endpoint = useMemo(() => (match ? toEndpoint(match) : null), [match])
  const json = useMemo(() => (endpoint ? JSON.stringify(endpoint, null, 2) : ''), [endpoint])

  const diffResults = useMemo((): FieldResult[] | { error: string } | null => {
    if (!endpoint || !actualInput.trim()) return null
    try {
      return flatCompare(endpoint, JSON.parse(actualInput))
    } catch {
      return { error: 'Invalid JSON — paste a valid FootyScores API response' }
    }
  }, [actualInput, endpoint])

  useEffect(() => () => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
  }, [])

  async function handleFetchMock() {
    if (!match) return
    setFetching(true)
    try {
      const res = await fetch(`/api/mock-footy-scores/${match.id}`)
      const data = await res.json() as unknown
      setActualInput(JSON.stringify(data, null, 2))
    } catch {
      toast.error('Failed to fetch mock response')
    } finally {
      setFetching(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json)
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
      setCopied(true)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed — select the text and use Ctrl+C')
    }
  }

  const isDiffError = diffResults !== null && !Array.isArray(diffResults)
  const diffRows = Array.isArray(diffResults) ? diffResults : null
  const passCount = diffRows ? diffRows.filter((r) => r.match).length : 0
  const allPass = diffRows ? passCount === diffRows.length : false

  if (!match || !endpoint) return null

  return (
    <Dialog open={!!match} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle>
            {match.teams.home} vs {match.teams.away}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border text-xs overflow-hidden">
            <button
              onClick={() => setMode('expected')}
              className={`px-3 py-1.5 font-medium transition-colors ${
                mode === 'expected'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              Expected
            </button>
            <button
              onClick={() => setMode('compare')}
              className={`px-3 py-1.5 font-medium transition-colors border-l ${
                mode === 'compare'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              Compare with actual
            </button>
          </div>

          {mode === 'expected' && (
            <Button variant="outline" size="sm" onClick={handleCopy} className="ml-auto">
              {copied
                ? <><Check className="h-4 w-4 mr-1" />Copied</>
                : <><Copy className="h-4 w-4 mr-1" />Copy JSON</>
              }
            </Button>
          )}

          {mode === 'compare' && diffRows && (
            <Badge variant={allPass ? 'default' : 'destructive'} className="ml-auto text-xs">
              {passCount}/{diffRows.length} fields match
            </Badge>
          )}
        </div>

        {mode === 'expected' && (
          <pre
            role="region"
            aria-label={`API endpoint JSON for ${match.teams.home} vs ${match.teams.away}`}
            className="overflow-auto rounded-md bg-muted p-4 text-xs font-mono flex-1"
          >
            {json}
          </pre>
        )}

        {mode === 'compare' && (
          <div className="flex flex-col gap-3 flex-1 overflow-hidden min-h-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFetchMock}
                disabled={fetching}
                title="Fetch a simulated FootyScores API response (includes intentional discrepancies)"
              >
                {fetching
                  ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Fetching…</>
                  : 'Fetch from mock API'
                }
              </Button>
              <span className="text-xs text-muted-foreground">or paste manually below</span>
            </div>
            <textarea
              value={actualInput}
              onChange={(e) => setActualInput(e.target.value)}
              placeholder="Paste the FootyScores API response JSON here…"
              className="w-full h-28 rounded-md border bg-muted p-3 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Paste actual API response"
            />

            {!diffResults && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Paste the FootyScores API response above to compare it field-by-field against the expected endpoint.
              </p>
            )}

            {isDiffError && (
              <p className="text-xs text-destructive px-1">
                {(diffResults as { error: string }).error}
              </p>
            )}

            {diffRows && (
              <div className="overflow-auto flex-1">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="text-left py-1.5 pr-4 font-medium text-muted-foreground">Field</th>
                      <th className="text-left py-1.5 pr-4 font-medium text-muted-foreground">Expected</th>
                      <th className="text-left py-1.5 font-medium text-muted-foreground">Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffRows.map((row) => (
                      <tr key={row.path} className={row.match ? '' : 'bg-destructive/5'}>
                        <td className="py-1 pr-4 font-mono text-muted-foreground whitespace-nowrap">{row.path}</td>
                        <td className="py-1 pr-4 font-mono break-all">{row.expected}</td>
                        <td className={`py-1 font-mono break-all ${row.match ? '' : 'text-destructive font-semibold'}`}>
                          {row.actual}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
