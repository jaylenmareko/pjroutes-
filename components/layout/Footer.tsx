'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/clients/supabase-browser'
import AuthModal from './AuthModal'

export default function Footer() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, from: 'any', to: 'any' }),
    })
    setSubscribed(true)
  }

  async function handleOperatorsClick(e: React.MouseEvent) {
    e.preventDefault()
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.push('/operator')
      } else {
        setShowAuth(true)
      }
    } catch {
      router.push('/operator')
    }
  }

  return (
    <>
      <footer className="bg-white border-t border-border mt-0">
        {/* Email subscribe bar */}
        <div className="border-b border-border py-10 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">Get Weekly Flight Deals</p>
              <p className="text-sm text-muted">Best deals and personalized recommendations.</p>
            </div>
            {subscribed ? (
              <p className="text-sm font-medium text-green-600">You&apos;re subscribed.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input w-60"
                />
                <button type="submit" className="btn-primary">Subscribe</button>
              </form>
            )}
          </div>
        </div>

        {/* Main footer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="6" fill="#0A0A0A"/>
                  <polygon points="14,7 22,21 6,21" fill="white"/>
                </svg>
                <span className="font-bold text-ink">PJRoutes</span>
              </div>
            </div>

            {/* Explore */}
            <div>
              <p className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">Explore</p>
              <div className="space-y-2">
                <Link href="/flights" className="block text-sm text-muted hover:text-ink transition-colors">Search Flights</Link>
                <Link href="/flights" className="block text-sm text-muted hover:text-ink transition-colors">Browse Routes</Link>
                <button
                  onClick={handleOperatorsClick}
                  className="block text-sm text-muted hover:text-ink transition-colors text-left"
                >
                  For Operators
                </button>
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">Company</p>
              <div className="space-y-2">
                <Link href="/#how-it-works" className="block text-sm text-muted hover:text-ink transition-colors">How It Works</Link>
                <Link href="/faq" className="block text-sm text-muted hover:text-ink transition-colors">FAQ</Link>
                <Link href="/contact" className="block text-sm text-muted hover:text-ink transition-colors">Contact</Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">Legal</p>
              <div className="space-y-2">
                <Link href="/terms" className="block text-sm text-muted hover:text-ink transition-colors">Terms</Link>
                <Link href="/privacy" className="block text-sm text-muted hover:text-ink transition-colors">Privacy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        redirectTo="/operator"
      />
    </>
  )
}
