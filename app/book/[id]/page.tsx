'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function BookingForm({ flightId }: { flightId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ach'>('card')
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [flight, setFlight] = useState<{ price: number; from_city: string; to_city: string; seats: number } | null>(null)
  const [passenger, setPassenger] = useState({ name: '', email: '', phone: '', count: '1' })

  // Pre-fill email from verified session
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setPassenger(p => ({ ...p, email: data.user!.email! }))
      }
    })
  }, [])

  useEffect(() => {
    fetch(`/api/flight/${flightId}`).then(r => r.json()).then(setFlight)
  }, [flightId])

  useEffect(() => {
    if (!flight) return
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flightId, paymentMethod }),
    }).then(r => r.json()).then(d => setClientSecret(d.clientSecret))
  }, [flightId, paymentMethod, flight])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return
    setLoading(true)
    setError('')

    const card = elements.getElement(CardElement)
    const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: card! },
    })

    if (stripeError) {
      setError(stripeError.message || 'Payment failed')
      setLoading(false)
      return
    }

    const res = await fetch('/api/confirm-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flightId,
        paymentIntentId: paymentIntent?.id,
        paymentMethod,
        passenger: { ...passenger, count: parseInt(passenger.count) },
      }),
    })

    if (res.ok) {
      router.push('/book/success')
    } else {
      setError('Booking confirmation failed. Contact support.')
      setLoading(false)
    }
  }

  const operatorPrice = flight?.price || 0
  const platformFee = Math.round(operatorPrice * 0.25)
  const buyerPrice = operatorPrice + platformFee
  const stripeFee = paymentMethod === 'ach'
    ? Math.min(500, Math.round(buyerPrice * 0.008))
    : Math.round(buyerPrice * 0.029 + 30)
  const total = buyerPrice + stripeFee

  const fmt = (c: number) => `$${(c / 100).toLocaleString()}`

  return (
    <div className="pt-14 min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-10">
        <Link href={`/flights/${flightId}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-6">
          <ArrowLeft size={14} /> Back to flight
        </Link>

        <h1 className="text-2xl font-extrabold text-ink mb-1">Complete your booking</h1>
        {flight && (
          <p className="text-muted text-sm mb-8">{flight.from_city} → {flight.to_city} · Up to {flight.seats} passengers</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Passenger info */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-ink text-sm">Passenger details</h2>
            <input
              className="input"
              placeholder="Full name"
              required
              value={passenger.name}
              onChange={e => setPassenger(p => ({ ...p, name: e.target.value }))}
            />
            {/* Email pre-filled from verified account — read only */}
            <div className="relative">
              <input
                type="email"
                className="input bg-surface text-muted cursor-default pr-20"
                value={passenger.email}
                readOnly
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-semibold">
                ✓ Verified
              </span>
            </div>
            <input
              className="input"
              placeholder="Phone number (for operator contact)"
              value={passenger.phone}
              onChange={e => setPassenger(p => ({ ...p, phone: e.target.value }))}
            />
            <select className="input" value={passenger.count} onChange={e => setPassenger(p => ({ ...p, count: e.target.value }))}>
              {[1,2,3,4,5,6,7,8].map(n => (
                <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          {/* Payment method */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-ink text-sm">Payment method</h2>
            <div className="grid grid-cols-2 gap-2">
              {(['card', 'ach'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    paymentMethod === m
                      ? 'border-primary bg-primary-light'
                      : 'border-border hover:border-muted'
                  }`}
                >
                  <div className="text-sm font-medium text-ink mb-0.5">
                    {m === 'card' ? '💳 Credit card' : '🏦 Bank transfer'}
                  </div>
                  <div className={`text-xs ${m === 'ach' ? 'text-green-600 font-medium' : 'text-muted'}`}>
                    {m === 'card' ? `Processing: ${fmt(stripeFee)}` : `Processing: ${fmt(stripeFee)} · Lower fee`}
                  </div>
                </button>
              ))}
            </div>

            {paymentMethod === 'card' && (
              <div className="rounded-xl border border-border p-4">
                <CardElement options={{
                  style: {
                    base: { fontSize: '14px', color: '#0A0A0A', fontFamily: 'Inter, system-ui, sans-serif', '::placeholder': { color: '#9CA3AF' } }
                  }
                }} />
              </div>
            )}

            {paymentMethod === 'ach' && (
              <div className="rounded-xl bg-surface p-4 text-sm text-muted">
                After clicking Pay, you&apos;ll securely enter your routing and account number via Stripe.
              </div>
            )}
          </div>

          {/* Price summary */}
          <div className="card p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted"><span>Flight</span><span>{fmt(buyerPrice)}</span></div>
              <div className="flex justify-between text-muted"><span>Processing fee</span><span>{fmt(stripeFee)}</span></div>
              <div className="flex justify-between font-bold text-ink text-base pt-2 border-t border-border"><span>Total</span><span>{fmt(total)}</span></div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !stripe || !clientSecret}
            className="btn-primary w-full justify-center text-base py-4"
          >
            {loading ? 'Processing...' : `Pay ${fmt(total)}`}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <Shield size={11} />
            Secured by Stripe · Operator confirms within 2 hours
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <Elements stripe={stripePromise}>
      <BookingForm flightId={id} />
    </Elements>
  )
}
