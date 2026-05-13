import Link from 'next/link'

export default function BookingsPage() {
  return (
    <div className="pt-14 min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="text-5xl mb-6 opacity-10">🗂</div>
        <h1 className="text-2xl font-extrabold text-ink mb-2">Your Bookings</h1>
        <p className="text-muted text-sm mb-8">
          Booking history requires an account. Sign in or create an account to view your past and upcoming flights.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/flights" className="btn-primary">Browse Flights</Link>
          <Link href="/" className="btn-secondary">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
