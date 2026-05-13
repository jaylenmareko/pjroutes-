'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { searchAirports, Airport } from '@/lib/airports'

interface AirportInputProps {
  label: string
  value: string
  onChange: (val: string) => void
  dark?: boolean
}

function AirportInput({ label, value, onChange, dark }: AirportInputProps) {
  const [suggestions, setSuggestions] = useState<Airport[]>([])
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const inputBase = dark
    ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-white/30 focus:border-white/40'
    : 'bg-white border-border text-ink placeholder:text-muted focus:ring-primary/20 focus:border-primary'

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    const results = searchAirports(val)
    setSuggestions(results)
    setOpen(results.length > 0)
  }, [onChange])

  const handleSelect = useCallback((airport: Airport) => {
    onChange(`${airport.city} (${airport.code})`)
    setSuggestions([])
    setOpen(false)
  }, [onChange])

  const handleBlur = useCallback(() => {
    // Delay so click on suggestion registers first
    setTimeout(() => {
      setOpen(false)
      setFocused(false)
    }, 150)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative flex-1">
      <label className={`absolute left-4 top-1.5 text-[10px] font-semibold uppercase tracking-wider z-10 ${dark ? 'text-white/50' : 'text-muted'}`}>
        {label}
      </label>
      <input
        className={`w-full rounded-xl border px-4 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 transition-colors ${inputBase}`}
        placeholder="City or airport code"
        value={value}
        onChange={handleChange}
        onFocus={() => {
          setFocused(true)
          if (value.length >= 2) {
            const results = searchAirports(value)
            setSuggestions(results)
            setOpen(results.length > 0)
          }
        }}
        onBlur={handleBlur}
        onKeyDown={e => {
          if (e.key === 'Escape') setOpen(false)
        }}
        autoComplete="off"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-card-hover z-50 overflow-hidden">
          {suggestions.map(airport => (
            <button
              key={airport.code}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface transition-colors"
              onMouseDown={e => {
                e.preventDefault() // prevent blur before click
                handleSelect(airport)
              }}
            >
              <span className="text-xs font-bold text-primary w-10 flex-shrink-0">{airport.code}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink truncate">{airport.city}</div>
                <div className="text-xs text-muted truncate">{airport.name}</div>
              </div>
              <span className="text-xs text-muted ml-auto flex-shrink-0">{airport.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface SearchBarProps {
  defaultFrom?: string
  defaultTo?: string
  defaultDate?: string
  defaultPassengers?: string
  dark?: boolean
}

export default function SearchBar({
  defaultFrom = '',
  defaultTo = '',
  defaultDate = '',
  defaultPassengers = '1',
  dark = false,
}: SearchBarProps) {
  const router = useRouter()
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [date, setDate] = useState(defaultDate)
  const [passengers, setPassengers] = useState(defaultPassengers)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (date) params.set('date', date)
    if (passengers) params.set('passengers', passengers)
    router.push(`/flights?${params}`)
  }

  const dateInput = dark
    ? 'bg-white/10 border-white/20 text-white focus:ring-white/30 focus:border-white/40'
    : 'bg-white border-border text-ink focus:ring-primary/20 focus:border-primary'

  return (
    <form
      onSubmit={handleSearch}
      className={`flex flex-col sm:flex-row gap-2 p-2 rounded-2xl ${
        dark ? 'bg-white/10 backdrop-blur-sm' : 'bg-white border border-border shadow-card'
      }`}
    >
      <AirportInput label="From" value={from} onChange={setFrom} dark={dark} />
      <AirportInput label="To" value={to} onChange={setTo} dark={dark} />

      <div className="relative">
        <label className={`absolute left-4 top-1.5 text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-white/50' : 'text-muted'}`}>
          When
        </label>
        <input
          type="date"
          className={`rounded-xl border px-4 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 transition-colors w-full sm:w-44 ${dateInput}`}
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      <div className="relative">
        <label className={`absolute left-4 top-1.5 text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-white/50' : 'text-muted'}`}>
          Passengers
        </label>
        <select
          className={`rounded-xl border px-4 pt-6 pb-2 text-sm focus:outline-none focus:ring-2 transition-colors appearance-none w-full sm:w-36 ${dateInput}`}
          value={passengers}
          onChange={e => setPassengers(e.target.value)}
        >
          {[1,2,3,4,5,6,7,8].map(n => (
            <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn-primary px-6 rounded-xl whitespace-nowrap">
        <Search size={15} />
        Search
      </button>
    </form>
  )
}
