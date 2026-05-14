import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-2">You&apos;re booked.</h1>
        <p className="text-muted mb-2">Check your email for your receipt and flight details.</p>
        <p className="text-muted text-sm mb-8">The operator will send your FBO address and departure window shortly.</p>
        <Link href="/flights" className="btn-primary">Browse more flights</Link>
      </div>
    </div>
  )
}
