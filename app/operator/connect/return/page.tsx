'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function ReturnContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'done' | 'error'>('checking')

  useEffect(() => {
    const accountId = params.get('account_id')
    if (!accountId) { setStatus('error'); return }

    fetch('/api/connect/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    }).then(r => r.json()).then(d => {
      if (d.complete) setStatus('done')
      else setStatus('error')
    }).catch(() => setStatus('error'))
  }, [params])

  if (status === 'checking') return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <p className="text-muted text-sm">Verifying your account...</p>
    </div>
  )

  if (status === 'done') return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-ink mb-2">Payouts connected.</h1>
        <p className="text-muted text-sm mb-6">When your flights book, payouts go directly to your bank. You&apos;re all set.</p>
        <button onClick={() => router.push('/listings')} className="btn-primary">View my listings</button>
      </div>
    </div>
  )

  return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-extrabold text-ink mb-2">Something went wrong.</h1>
        <p className="text-muted text-sm mb-6">Your payout setup didn&apos;t complete. You can try again from My Listings.</p>
        <button onClick={() => router.push('/listings')} className="btn-primary">Go to My Listings</button>
      </div>
    </div>
  )
}

export default function ConnectReturnPage() {
  return (
    <Suspense fallback={<div className="pt-14 min-h-screen flex items-center justify-center"><p className="text-muted text-sm">Loading...</p></div>}>
      <ReturnContent />
    </Suspense>
  )
}
