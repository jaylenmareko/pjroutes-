'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/clients/supabase-browser'
import AuthModal from './AuthModal'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)
  const [authRedirect, setAuthRedirect] = useState('/bookings')

  async function requireAuth(destination: string) {
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.push(destination)
      } else {
        setAuthRedirect(destination)
        setShowAuth(true)
      }
    } catch {
      router.push(destination)
    }
  }

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        pathname === href ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 font-bold text-ink tracking-tight text-lg">
            PJRoutes
          </Link>

          {/* Nav links — centered */}
          <div className="flex-1 flex items-center justify-center gap-1">
            {link('/flights', 'Search')}
            {link('/flights', 'Browse Routes')}
            <button
              onClick={() => requireAuth('/bookings')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                pathname === '/bookings' ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              Bookings
            </button>
          </div>

          {/* Right — List a Flight */}
          <div className="flex-shrink-0">
            <button
              onClick={() => requireAuth('/operator')}
              className="btn-primary py-1.5 px-4 text-xs"
            >
              List a Flight
            </button>
          </div>
        </div>
      </nav>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        redirectTo={authRedirect}
      />
    </>
  )
}
