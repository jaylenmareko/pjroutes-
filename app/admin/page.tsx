export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/clients/supabase'
import AdminActions from './AdminActions'
import { formatPrice, formatDate, formatTime } from '@/lib/utils'

async function getFlights() {
  const { data } = await supabaseAdmin
    .from('flights')
    .select('*')
    .in('status', ['pending', 'published'])
    .order('created_at', { ascending: false })
  return data || []
}

function FlightCard({ f, mode }: { f: Record<string, unknown>; mode: 'pending' | 'live' }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="text-lg font-bold text-ink">{f.from_city as string} → {f.to_city as string}</div>
          <div className="text-sm text-muted">{f.from_airport as string} → {f.to_airport as string}</div>
          <div className="text-sm text-muted">{f.aircraft_type as string} · {f.aircraft_tail as string} · {f.seats as number} seats</div>
          <div className="text-sm text-muted">{formatDate(f.depart_start as string)} · {formatTime(f.depart_start as string)} – {formatTime(f.depart_end as string)} <span className="text-xs opacity-50">(UTC)</span></div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-semibold text-ink">{formatPrice(f.price as number)} <span className="text-muted font-normal">operator</span></span>
            <span className="text-muted">→</span>
            <span className="text-sm font-semibold text-primary">{formatPrice(Math.round((f.price as number) * 1.25))} <span className="text-muted font-normal">customer</span></span>
          </div>
          <div className="pt-2 border-t border-border mt-2 text-xs text-muted space-y-0.5">
            <div>{f.operator_name as string}</div>
            <div>{f.operator_email as string} · {f.operator_phone as string}</div>
            {f.fbo_address ? <div>FBO: {f.fbo_address as string}</div> : null}
          </div>
        </div>
        <AdminActions flightId={f.id as string} mode={mode} />
      </div>
    </div>
  )
}

export default async function AdminPage() {
  const flights = await getFlights()
  const pending = flights.filter(f => f.status === 'pending')
  const live = flights.filter(f => f.status === 'published')

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* Pending */}
        <div>
          <h1 className="text-2xl font-extrabold text-ink mb-1">Admin</h1>
          <p className="text-muted text-sm mb-6">{pending.length} pending listing{pending.length !== 1 ? 's' : ''}</p>
          <div className="space-y-4">
            {pending.map(f => <FlightCard key={f.id} f={f} mode="pending" />)}
            {pending.length === 0 && (
              <div className="text-center py-12 text-muted">
                <div className="text-4xl mb-3 opacity-20">✈</div>
                No pending listings.
              </div>
            )}
          </div>
        </div>

        {/* Live */}
        <div>
          <h2 className="text-lg font-bold text-ink mb-1">Live Listings</h2>
          <p className="text-muted text-sm mb-6">{live.length} live flight{live.length !== 1 ? 's' : ''}</p>
          <div className="space-y-4">
            {live.map(f => <FlightCard key={f.id} f={f} mode="live" />)}
            {live.length === 0 && (
              <div className="text-center py-12 text-muted text-sm">No live listings.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
