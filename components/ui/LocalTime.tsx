'use client'

export function LocalTime({ iso }: { iso: string }) {
  return <>{new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</>
}

export function LocalDate({ iso }: { iso: string }) {
  return <>{new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</>
}
