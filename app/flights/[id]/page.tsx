export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/clients/supabase'
import { Flight } from '@/lib/types'
import { Shield, Wifi, PawPrint, ArrowLeft, Share2, Bookmark, ArrowRight, ArrowUpRight } from 'lucide-react'
import { formatPrice, JET_SIZE_LABEL } from '@/lib/utils'
import { LocalTime, LocalDate } from '@/components/ui/LocalTime'
import PhotoGallery from '@/components/flights/PhotoGallery'
import BookNowButton from '@/components/ui/BookNowButton'

const PLATFORM_FEE = 0.25

async function getFlight(id: string): Promise<Flight | null> {
  try {
    const { data } = await supabase
      .from('flights')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single()
    return data
  } catch {
    return null
  }
}

export default async function FlightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const flight = await getFlight(id)
  if (!flight) notFound()

  const photos = flight.photos || []
  const buyerPrice = Math.round(flight.price * (1 + PLATFORM_FEE))

  // Only show amenities the operator actually checked
  const amenities = [
    flight.has_wifi && { icon: <Wifi size={16} className="text-muted flex-shrink-0" />, label: 'Wi-Fi', desc: 'available in flight' },
    flight.pets_allowed && { icon: <PawPrint size={16} className="text-muted flex-shrink-0" />, label: 'Pets welcome', desc: 'cabin approved' },
    flight.standup_cabin && { icon: <ArrowUpRight size={16} className="text-muted flex-shrink-0" />, label: 'Stand-up cabin', desc: 'full headroom' },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; desc: string }[]

  return (
    <div className="pt-16 min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <Link href="/flights" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-5">
          <ArrowLeft size={14} />
          Back to flights
        </Link>

        {/* Photo gallery */}
        <div className="mb-6">
          <PhotoGallery photos={photos} aircraftType={flight.aircraft_type} />
        </div>

        {/* Route heading */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-ink tracking-tight mb-1">
              {flight.from_city} → {flight.to_city}
            </h1>
            <p className="text-sm text-muted">
              <LocalDate iso={flight.depart_start} /> · {flight.aircraft_type} · {flight.aircraft_tail}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors px-3 py-1.5 border border-border rounded-full">
              <Share2 size={13} /> Share
            </button>
            <button className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors px-3 py-1.5 border border-border rounded-full">
              <Bookmark size={13} /> Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Departure times */}
            <div className="grid grid-cols-3 items-center gap-4 py-6 border-y border-border">
              <div>
                <div className="text-xs text-muted uppercase tracking-wider font-medium mb-1">From</div>
                <div className="text-3xl font-bold text-ink"><LocalTime iso={flight.depart_start} /></div>
                <div className="text-sm text-muted mt-1">{flight.from_airport}</div>
                <div className="text-sm text-muted">{flight.from_city}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted mb-2">Direct</div>
                <div className="flex items-center justify-center gap-1">
                  <div className="flex-1 h-px bg-border" />
                  <ArrowRight size={12} className="text-muted" />
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="text-xs text-muted mt-2">Entire aircraft</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted uppercase tracking-wider font-medium mb-1">To</div>
                <div className="text-3xl font-bold text-ink"><LocalTime iso={flight.depart_end} /></div>
                <div className="text-sm text-muted mt-1">{flight.to_airport}</div>
                <div className="text-sm text-muted">{flight.to_city}</div>
              </div>
            </div>

            {/* What's on board — only checked amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-ink mb-4">What&apos;s on board</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {amenities.map(item => (
                    <div key={item.label} className="flex items-center gap-3 text-sm">
                      {item.icon}
                      <span>
                        <strong className="text-ink">{item.label}</strong>
                        <span className="text-muted"> · {item.desc}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Operator */}
            <div>
              <h2 className="text-xl font-bold text-ink mb-4">Operator</h2>
              <div className="card p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Shield size={15} className="text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-sm">Verified Part 135 operator</div>
                    <div className="text-xs text-muted">FAA Part 135 certified</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-ink">✓</span>
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-sm">Listing verified by PJRoutes</div>
                    <div className="text-xs text-muted">Aircraft details, tail number, and operator confirmed before going live.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation & terms */}
            <div>
              <h2 className="text-xl font-bold text-ink mb-4">Cancellation and terms</h2>
              <div className="space-y-4">
                {[
                  { icon: '🔒', title: 'Price Lock.', desc: 'Price is final at booking — no fuel surcharges, no repositioning fees added after.' },
                  { icon: '🛡', title: 'Trip Assurance.', desc: 'If the operator cancels, you receive a full refund. No questions asked.' },
                  { icon: '💳', title: 'Charged at booking.', desc: 'Payment is processed immediately and your booking is confirmed. The operator then sends your FBO details.' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 mt-0.5">{item.icon}</span>
                    <p className="text-muted">
                      <strong className="text-ink">{item.title}</strong>{' '}{item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right sticky column */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-3">

              {/* Booking card */}
              <div className="card p-6">
                <div className="text-4xl font-extrabold text-ink mb-1">{formatPrice(buyerPrice)}</div>
                <div className="text-sm text-muted mb-5">Entire Jet · up to {flight.seats} passengers</div>

                <BookNowButton flightId={flight.id} />
                <p className="text-center text-xs text-muted mt-2">Payment processed securely at checkout.</p>
              </div>

              {/* Aircraft detail card */}
              <div className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-sm">✈</div>
                  <div>
                    <div className="font-semibold text-ink text-sm">{flight.aircraft_type}</div>
                    <div className="text-xs text-muted">{JET_SIZE_LABEL[flight.jet_size]}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted uppercase tracking-wider mb-1">Passengers</div>
                    <div className="font-bold text-ink text-lg">{flight.seats}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted uppercase tracking-wider mb-1">Tail Number</div>
                    <div className="font-bold text-ink text-sm">{flight.aircraft_tail}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
