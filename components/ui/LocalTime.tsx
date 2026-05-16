'use client'
import { useState, useEffect } from 'react'

export function LocalTime({ iso }: { iso: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const d = new Date(iso)
  if (!mounted) return <>{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })}</>
  return <>{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</>
}

export function LocalDate({ iso }: { iso: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const d = new Date(iso)
  if (!mounted) return <>{d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</>
  return <>{d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</>
}
