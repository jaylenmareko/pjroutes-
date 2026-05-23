'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/clients/supabase-browser'
import AuthModal from '@/components/auth/AuthModal'
import { ChevronDown } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname.startsWith('/admin')) return null
  const [showAuth, setShowAuth] = useState(false)
  const [authRedirect, setAuthRedirect] = useState('/flights')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setDropdownOpen(false)
    router.push('/')
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 font-bold text-ink tracking-tight text-xl">
            PJRoutes
          </Link>

          {/* Nav links — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-1">
            {link('/flights', 'Flights')}
            {link('/how-it-works', 'How It Works')}
            {link('/faq', 'FAQ')}
            {userEmail && (
              <>
                <button
                  onClick={() => router.push('/bookings')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    pathname === '/bookings' ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  My Bookings
                </button>
                <button
                  onClick={() => router.push('/listings')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    pathname === '/listings' ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  My Listings
                </button>
              </>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right */}
          <div className="flex-shrink-0 flex items-center gap-3">
            {userEmail ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-muted hover:text-ink transition-colors border border-border hover:border-ink/20"
                >
                  {/* Desktop: show email */}
                  <span className="hidden sm:block max-w-[140px] truncate">{userEmail}</span>
                  {/* Mobile: show initial */}
                  <span className="sm:hidden w-7 h-7 rounded-full bg-surface flex items-center justify-center text-xs font-bold text-ink">
                    {userEmail[0].toUpperCase()}
                  </span>
                  <ChevronDown size={14} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-xl shadow-lg py-1 z-50">
                    <button
                      onClick={() => { router.push('/bookings'); setDropdownOpen(false) }}
                      className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors"
                    >
                      My Bookings
                    </button>
                    <button
                      onClick={() => { router.push('/listings'); setDropdownOpen(false) }}
                      className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors"
                    >
                      My Listings
                    </button>
                    <button
                      onClick={() => { router.push('/operator'); setDropdownOpen(false) }}
                      className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors"
                    >
                      List a Flight
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={signOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-surface transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => requireAuth('/flights')}
                  className="hidden sm:block px-3 py-2 rounded-full text-sm font-medium text-muted hover:text-ink transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => requireAuth('/operator')}
                  className="btn-primary py-2 px-5 text-sm"
                >
                  List a Flight
                </button>
              </>
            )}
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
