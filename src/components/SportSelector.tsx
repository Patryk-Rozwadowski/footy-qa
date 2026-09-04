'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SPORT_GROUPS } from '@/lib/mapper'

interface Props {
  value: string
  onChange: (sport: string) => void
  disabled?: boolean
  availableSports: Set<string>
}

export function SportSelector({ value, onChange, disabled, availableSports }: Props) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-52" aria-label="Select sport">
        <SelectValue placeholder="Select sport" />
      </SelectTrigger>
      <SelectContent>
        {SPORT_GROUPS.map((group) => (
          <SelectGroup key={group.label}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.sports.map((sport) => {
              const hasData = availableSports.has(sport)
              return (
                <SelectItem key={sport} value={sport} disabled={!hasData}>
                  {sport}
                  {!hasData && (
                    <span className="ml-2 text-xs text-muted-foreground">no data</span>
                  )}
                </SelectItem>
              )
            })}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
