'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/clients/supabase-browser'
import Link from 'next/link'
// createClient used only for session check — data fetched via /api/my-bookings (bypasses RLS)

interface Booking {
  id: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  flights: {
    from_city: string
    from_airport: string
    to_city: string
    to_airport: string
    aircraft_type: string
    depart_start: string
    fbo_address: string | null
  }
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/')
        return
      }
      setEmail(data.user.email ?? '')
      const res = await fetch('/api/my-bookings')
      const rows = await res.json()
      setBookings(Array.isArray(rows) ? rows : [])
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <p className="text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-extrabold text-ink mb-1">My Bookings</h1>
        <p className="text-muted text-sm mb-8">{email}</p>

        {bookings.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted text-sm mb-6">No bookings yet.</p>
            <Link href="/flights" className="btn-primary">Browse Flights</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => {
              const depart = b.flights?.depart_start
                ? new Date(b.flights.depart_start).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                  })
                : '—'
              const total = `$${(b.amount / 100).toLocaleString()}`
              const method = b.payment_method === 'ach' ? 'ACH' : 'Card'

              return (
                <div key={b.id} className="border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-ink text-lg">
                        {b.flights?.from_city} ({b.flights?.from_airport}) → {b.flights?.to_city} ({b.flights?.to_airport})
                      </p>
                      <p className="text-muted text-sm">{b.flights?.aircraft_type} · {depart}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 capitalize">
                      {b.status}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
                    <span>Total: <span className="text-ink font-medium">{total}</span></span>
                    <span>Payment: <span className="text-ink font-medium">{method}</span></span>
                    {b.flights?.fbo_address && (
                      <span>FBO: <span className="text-ink font-medium">{b.flights.fbo_address}</span></span>
                    )}
                    <span className="ml-auto text-xs">ID: {b.id.slice(0, 8)}…</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
