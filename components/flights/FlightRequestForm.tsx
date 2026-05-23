'use client'
import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

export default function FlightRequestForm() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/request-flight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, date, time, passengers }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="text-center py-10">
        <div className="text-3xl mb-3">✈</div>
        <h3 className="font-bold text-ink text-lg mb-1">Request received</h3>
        <p className="text-muted text-sm">We&apos;ll source availability and get back to you within a few hours.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* From / To */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">From</label>
          <input
            required
            value={from}
            onChange={e => setFrom(e.target.value)}
            placeholder="City or airport"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">To</label>
          <input
            required
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="City or airport"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
      </div>

      {/* Date / Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Departure Date</label>
          <input
            required
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Preferred Time</label>
          <select
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
          >
            <option value="">Flexible</option>
            <option value="Early morning (6am–9am)">Early morning (6am–9am)</option>
            <option value="Morning (9am–12pm)">Morning (9am–12pm)</option>
            <option value="Afternoon (12pm–5pm)">Afternoon (12pm–5pm)</option>
            <option value="Evening (5pm–9pm)">Evening (5pm–9pm)</option>
            <option value="Late night (9pm+)">Late night (9pm+)</option>
          </select>
        </div>
      </div>

      {/* Passengers */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Passengers</label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPassengers(p => Math.max(1, p - 1))}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted hover:text-ink hover:border-ink/30 transition"
          >
            <Minus size={14} />
          </button>
          <span className="text-ink font-semibold w-6 text-center">{passengers}</span>
          <button
            type="button"
            onClick={() => setPassengers(p => Math.min(19, p + 1))}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted hover:text-ink hover:border-ink/30 transition"
          >
            <Plus size={14} />
          </button>
          <span className="text-sm text-muted">{passengers === 1 ? '1 passenger' : `${passengers} passengers`}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full py-3 text-sm disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending request…' : 'Request a Flight'}
      </button>

      {status === 'error' && (
        <p className="text-xs text-red-500 text-center">Something went wrong — try again or email us directly.</p>
      )}
    </form>
  )
}
