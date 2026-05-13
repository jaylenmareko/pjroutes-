'use client'
import { useState } from 'react'
import { Bell } from 'lucide-react'

export default function AlertSignupForm() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, email }),
    })
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <Bell size={18} className="text-green-600" />
        </div>
        <p className="font-semibold text-ink">You're on the list.</p>
        <p className="text-sm text-muted">We'll email you the moment a matching flight lists.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        className="input flex-1"
        placeholder="From city"
        value={from}
        onChange={e => setFrom(e.target.value)}
        required
      />
      <input
        className="input flex-1"
        placeholder="To city"
        value={to}
        onChange={e => setTo(e.target.value)}
        required
      />
      <input
        type="email"
        className="input flex-1"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
        {loading ? 'Saving...' : 'Alert me'}
      </button>
    </form>
  )
}
