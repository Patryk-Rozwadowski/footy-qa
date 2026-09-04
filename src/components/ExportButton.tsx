'use client'

import { Match } from '@/types/match'
import { toEndpoint } from '@/lib/mapper'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface Props {
  matches: Match[]
  disabled?: boolean
}

export function ExportButton({ matches, disabled }: Props) {
  function handleExport() {
    const endpoints = matches.map(toEndpoint)
    const json = JSON.stringify(endpoints, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'paris-2024-football-endpoints.json'
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
      aria-label={`Export ${matches.length} matches as JSON`}
    >
      <Download className="h-4 w-4 mr-2" />
      Export JSON ({matches.length})
    </Button>
  )
}
