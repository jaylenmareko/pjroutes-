export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import AdminActions from './AdminActions'
import { formatPrice, formatDate, formatTime } from '@/lib/utils'

async function getPendingFlights() {
  const { data } = await supabaseAdmin
    .from('flights')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  return data || []
}

export default async function AdminPage() {
  const pending = await getPendingFlights()

  return (
    <div className="pt-14 min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-extrabold text-ink mb-1">Admin</h1>
        <p className="text-muted text-sm mb-8">{pending.length} pending listing{pending.length !== 1 ? 's' : ''}</p>

        <div className="space-y-4">
          {pending.map(f => (
            <div key={f.id} className="card p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="text-lg font-bold text-ink">{f.from_city} → {f.to_city}</div>
                  <div className="text-sm text-muted">{f.from_airport} → {f.to_airport}</div>
                  <div className="text-sm text-muted">{f.aircraft_type} · {f.aircraft_tail} · {f.seats} seats</div>
                  <div className="text-sm text-muted">{formatDate(f.depart_start)} · {formatTime(f.depart_start)} – {formatTime(f.depart_end)}</div>
                  <div className="text-sm font-semibold text-ink mt-1">{formatPrice(f.price)}</div>
                  <div className="pt-2 border-t border-border mt-2 text-xs text-muted space-y-0.5">
                    <div>{f.operator_name}</div>
                    <div>{f.operator_email} · {f.operator_phone}</div>
                  </div>
                </div>
                <AdminActions flightId={f.id} />
              </div>
            </div>
          ))}

          {pending.length === 0 && (
            <div className="text-center py-16 text-muted">
              <div className="text-4xl mb-3 opacity-20">✈</div>
              No pending listings.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
