export const dynamic = 'force-dynamic'
import Link from 'next/link'
import SearchBar from '@/components/flights/SearchBar'
import { Users, Zap, Shield, RefreshCw } from 'lucide-react'

export default async function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="relative min-h-[580px] flex items-center pt-14 overflow-hidden bg-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-primary-light/30" />
          <div className="absolute right-0 top-0 w-3/5 h-full hidden lg:block overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200&q=85"
              alt="Private jet"
              className="w-full h-full object-cover object-center opacity-70"
            />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="max-w-lg">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-ink leading-[1.05] tracking-tight mb-4">
              Fly private.<br />
              Save time.<br />
              <span className="text-primary">Empty leg flights.</span>
            </h1>
            <p className="text-lg text-muted mb-8 leading-relaxed">
              Book your private jet like a hotel — instant pricing, no waiting for quotes. Empty-leg flights at a fraction of full charter rates. No membership, no brokers.
            </p>
            <Link href="/flights" className="btn-primary text-base px-8 py-4 inline-flex">
              Search Flights →
            </Link>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6">
              {['Verified Part 135 operators', 'No membership fees', 'No broker fees', 'Book in minutes'].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-sm text-muted">
                  <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SEARCH BAR ── */}
      <section className="bg-white border-y border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar />
        </div>
      </section>


      {/* ── WHAT IS AN EMPTY LEG ── */}
      <section className="bg-surface py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-ink mb-4">What&apos;s an Empty Leg?</h2>
              <p className="text-muted leading-relaxed mb-6">
                A private jet drops off a passenger and has to fly back empty. Instead of absorbing that cost, operators list the return flight at a discount. You book the whole plane — direct from the operator, no broker, no markup.
              </p>
              <Link href="/flights" className="btn-primary">Search Empty Legs</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { stat: 'Part 135', label: 'certified operators' },
                { stat: '$0', label: 'membership fees' },
                { stat: '$0', label: 'broker markup' },
                { stat: '100%', label: 'of the aircraft' },
              ].map(item => (
                <div key={item.label} className="card p-5 text-center">
                  <div className="text-2xl font-extrabold text-primary mb-1">{item.stat}</div>
                  <div className="text-xs text-muted">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-ink mb-2">
            <span className="text-muted">How </span>It Works
          </h2>
          <p className="text-muted text-sm">Three steps.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Search', desc: 'Browse verified empty legs with transparent pricing direct from operators.' },
            { step: '02', title: 'Book & Pay', desc: 'Your booking is confirmed instantly. Pay securely by card or bank transfer.' },
            { step: '03', title: 'Fly', desc: 'The operator sends your FBO details and exact departure time. Show up, skip the terminal, fly.' },
          ].map(item => (
            <div key={item.step} className="card p-7">
              <div className="text-4xl font-extrabold text-primary/15 mb-4">{item.step}</div>
              <h3 className="font-bold text-ink text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <Link href="/flights" className="btn-primary px-10 py-4 text-base">Search Flights</Link>
        </div>
      </section>

      {/* ── WHY PJROUTES ── */}
      <section className="bg-surface py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-ink mb-8">Why PJRoutes?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: <Users size={20} />, title: 'No Membership', desc: 'Book anytime. No subscription.' },
              { icon: <Zap size={20} />, title: 'Transparent Pricing', desc: 'Operator rates. Zero markup.' },
              { icon: <Shield size={20} />, title: 'Part 135 Certified', desc: 'Every operator verified by us.' },
              { icon: <RefreshCw size={20} />, title: 'Full Refund', desc: 'Operator cancels? You\'re covered.' },
            ].map(item => (
              <div key={item.title} className="card p-5">
                <div className="text-primary mb-3">{item.icon}</div>
                <h3 className="font-semibold text-ink mb-1 text-sm">{item.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
