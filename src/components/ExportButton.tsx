'use client'

import { Match } from '@/types/match'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface Props {
  matches: Match[]
  sport: string
  disabled?: boolean
}

export function ExportButton({ matches, sport, disabled }: Props) {
  function handleExport() {
    const json = JSON.stringify(matches, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paris-2024-${sport.toLowerCase().replace(/\s+/g, '-')}-endpoints.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={disabled || matches.length === 0}
      aria-label={`Export ${matches.length} ${sport} matches as JSON`}
    >
      <Download className="h-4 w-4 mr-2" />
      Export JSON ({matches.length})
    </Button>
  )
}
