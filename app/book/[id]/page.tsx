'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/clients/supabase-browser'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function BookingForm({ flightId, flight, total }: {
  flightId: string
  flight: { price: number; from_city: string; to_city: string; seats: number }
  total: number
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passenger, setPassenger] = useState({ name: '', email: '', phone: '', count: '1' })

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setPassenger(p => ({ ...p, email: data.user!.email! }))
    })
  }, [])

  const fmt = (c: number) => `$${(c / 100).toLocaleString()}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    // Save booking data before potential ACH redirect
    sessionStorage.setItem('pjr_pending_booking', JSON.stringify({
      flightId,
      passenger: { ...passenger, count: parseInt(passenger.count) },
    }))

    try {
      const { paymentIntent, error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/book/success` },
        redirect: 'if_required',
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        sessionStorage.removeItem('pjr_pending_booking')
        return
      }

      // Card path — no redirect, confirm inline
      if (paymentIntent) {
        const res = await fetch('/api/confirm-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flightId,
            paymentIntentId: paymentIntent.id,
            paymentMethod: 'card',
            passenger: { ...passenger, count: parseInt(passenger.count) },
          }),
        })
        sessionStorage.removeItem('pjr_pending_booking')
        if (res.ok) {
          router.push('/book/success')
        } else {
          setError('Booking confirmed with Stripe but confirmation failed. Contact support@pjroutes.com.')
        }
      }
      // ACH path — Stripe redirects to /book/success which handles confirm-booking
    } catch {
      setError('Something went wrong. Try again.')
      sessionStorage.removeItem('pjr_pending_booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-ink text-sm">Passenger details</h2>
        <input
          className="input" placeholder="Full name" required
          value={passenger.name} onChange={e => setPassenger(p => ({ ...p, name: e.target.value }))}
        />
        <div className="relative">
          <input type="email" className="input bg-surface text-muted cursor-default pr-20" value={passenger.email} readOnly />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-semibold">✓ Verified</span>
        </div>
        <input
          className="input" placeholder="Phone number"
          value={passenger.phone} onChange={e => setPassenger(p => ({ ...p, phone: e.target.value }))}
        />
        <select className="input" value={passenger.count} onChange={e => setPassenger(p => ({ ...p, count: e.target.value }))}>
          {[1,2,3,4,5,6,7,8].map(n => (
            <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-ink text-sm">Payment</h2>
        <p className="text-xs text-muted">Pay by card or bank transfer. Bank transfer recommended for large bookings — no card limits, lower fees.</p>
        <PaymentElement />
      </div>

      <div className="card p-5">
        <div className="flex justify-between font-bold text-ink text-base">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>
        <p className="text-xs text-muted mt-1">Includes platform fee. No additional charges.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <button type="submit" disabled={loading || !stripe} className="btn-primary w-full justify-center text-base py-4">
        {loading ? 'Processing...' : `Pay ${fmt(total)}`}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
        <Shield size={11} />
        Secured by Stripe · Booking confirmed instantly
      </div>
    </form>
  )
}

function BookingWrapper({ flightId }: { flightId: string }) {
  const [clientSecret, setClientSecret] = useState('')
  const [flight, setFlight] = useState<{ price: number; from_city: string; to_city: string; seats: number } | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetch(`/api/flight/${flightId}`).then(r => r.json()).then(setFlight)
  }, [flightId])

  useEffect(() => {
    if (!flight) return
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flightId }),
    }).then(r => r.json()).then(d => {
      setClientSecret(d.clientSecret)
      setTotal(d.total)
    })
  }, [flightId, flight])

  if (!clientSecret || !flight) {
    return (
      <div className="pt-14 min-h-screen bg-white">
        <div className="max-w-lg mx-auto px-4 py-10">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-14 min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-10">
        <Link href={`/flights/${flightId}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-6">
          <ArrowLeft size={14} /> Back to flight
        </Link>
        <h1 className="text-2xl font-extrabold text-ink mb-1">Complete your booking</h1>
        <p className="text-muted text-sm mb-8">
          {flight.from_city} → {flight.to_city} · Up to {flight.seats} passengers
        </p>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: { colorPrimary: '#8C1C1C', borderRadius: '12px', fontFamily: 'Inter, system-ui, sans-serif' },
            },
          }}
        >
          <BookingForm flightId={flightId} flight={flight} total={total} />
        </Elements>
      </div>
    </div>
  )
}

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <BookingWrapper flightId={id} />
}
