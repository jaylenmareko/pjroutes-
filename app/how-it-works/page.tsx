import Link from 'next/link'

const BUYER_STEPS = [
  { n: '01', title: 'Search Available Legs', body: 'Browse or search empty leg flights by origin, destination, and date. Every listing is a real repositioning flight from a FAA Part 135 certified operator.' },
  { n: '02', title: 'Book Instantly', body: 'Select your flight, enter passenger details, and pay securely by card or ACH. Your booking is confirmed immediately — no back-and-forth.' },
  { n: '03', title: 'Fly Private', body: 'Show up at the FBO. Your confirmation email has everything: address, arrival window, and operator contact. No terminals, no lines.' },
]

const OPERATOR_STEPS = [
  { n: '01', title: 'List Your Empty Leg', body: 'Enter the route, aircraft, date, and your price. We add our margin on top — you keep 100% of your listed price.' },
  { n: '02', title: 'Get Booked', body: 'Qualified travelers see your flight and book. We collect payment and handle the transaction.' },
  { n: '03', title: 'Get Paid', body: 'Funds are released to your Stripe account within 2 business days of departure. No chasing invoices.' },
]

export default function HowItWorksPage() {
  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="mb-14 text-center">
          <h1 className="text-4xl font-extrabold text-ink mb-3">How It Works</h1>
          <p className="text-muted max-w-xl mx-auto">PJRoutes connects private jet operators with travelers on empty repositioning flights — better margins for operators, private travel at a fraction of charter rates for passengers.</p>
        </div>

        {/* For Travelers */}
        <div className="mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted mb-8">For Travelers</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {BUYER_STEPS.map(s => (
              <div key={s.n} className="rounded-2xl border border-border p-6">
                <div className="text-3xl font-black text-ink/10 mb-3">{s.n}</div>
                <h3 className="font-bold text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/flights" className="btn-primary">Browse Flights</Link>
          </div>
        </div>

        {/* For Operators */}
        <div className="mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted mb-8">For Operators</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {OPERATOR_STEPS.map(s => (
              <div key={s.n} className="rounded-2xl border border-border p-6">
                <div className="text-3xl font-black text-ink/10 mb-3">{s.n}</div>
                <h3 className="font-bold text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/operator" className="btn-primary">List a Flight</Link>
          </div>
        </div>

        {/* Pricing callout */}
        <div className="rounded-2xl bg-surface border border-border p-8 text-center">
          <h3 className="font-bold text-ink mb-2">Transparent pricing</h3>
          <p className="text-muted text-sm max-w-md mx-auto">Operators set the price. PJRoutes adds 25% on top — paid by the traveler, not the operator. No hidden fees on either side.</p>
        </div>

      </div>
    </div>
  )
}
