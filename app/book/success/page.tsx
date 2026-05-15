'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent')
    const redirectStatus = searchParams.get('redirect_status')

    if (!paymentIntent) {
      // Card path — confirm-booking already called inline before redirect
      setConfirmed(true)
      return
    }

    // ACH path — redirected back from Stripe bank selection
    if (redirectStatus !== 'succeeded') {
      setError('Payment did not complete. Please try again.')
      return
    }

    const raw = sessionStorage.getItem('pjr_pending_booking')
    if (!raw) {
      setConfirmed(true) // already confirmed or duplicate load
      return
    }

    const { flightId, passenger } = JSON.parse(raw)
    sessionStorage.removeItem('pjr_pending_booking')

    fetch('/api/confirm-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flightId, paymentIntentId: paymentIntent, paymentMethod: 'ach', passenger }),
    }).then(res => {
      if (res.ok) {
        setConfirmed(true)
      } else {
        setError('Payment succeeded but booking confirmation failed. Contact support@pjroutes.com.')
      }
    }).catch(() => {
      setError('Payment succeeded but booking confirmation failed. Contact support@pjroutes.com.')
    })
  }, [searchParams])

  if (error) {
    return (
      <div className="text-center max-w-md px-4">
        <h1 className="text-3xl font-extrabold text-ink mb-2">Something went wrong.</h1>
        <p className="text-muted mb-6">{error}</p>
        <Link href="/flights" className="btn-primary">Browse flights</Link>
      </div>
    )
  }

  if (!confirmed) {
    return (
      <div className="text-center max-w-md px-4">
        <p className="text-muted text-sm">Confirming your booking...</p>
      </div>
    )
  }

  return (
    <div className="text-center max-w-md px-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-ink mb-2">You&apos;re booked.</h1>
      <p className="text-muted mb-2">Check your email — receipt, FBO address, and departure window are all in there.</p>
      <p className="text-muted text-sm mb-8">Expect a personal call from the operator 24–48 hrs before departure.</p>
      <Link href="/flights" className="btn-primary">Browse more flights</Link>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <Suspense fallback={<p className="text-muted text-sm">Loading...</p>}>
        <SuccessContent />
      </Suspense>
    </div>
  )
}
