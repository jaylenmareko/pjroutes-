'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const supabase = createClient()

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(redirect)
    })
  }, [])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep('code')
    setResendCooldown(60)
    setLoading(false)
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (error) {
      setError('Invalid or expired code. Try again.')
      setLoading(false)
      return
    }

    router.replace(redirect)
  }

  async function resend() {
    if (resendCooldown > 0) return
    setError('')
    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    setResendCooldown(60)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-10">
          <span className="font-bold text-ink text-lg tracking-tight">PJRoutes</span>
        </Link>

        {step === 'email' ? (
          <>
            <h1 className="text-2xl font-extrabold text-ink mb-1 text-center">Welcome to PJRoutes</h1>
            <p className="text-muted text-sm text-center mb-8">Enter your email to continue.</p>

            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base">
                {loading ? 'Sending code...' : 'Continue'}
              </button>
            </form>

            <p className="text-xs text-muted text-center mt-6">
              We&apos;ll send a 6-digit code to your email. No password required.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-ink mb-1 text-center">Check your email</h1>
            <p className="text-muted text-sm text-center mb-2">
              We sent a 6-digit code to
            </p>
            <p className="font-semibold text-ink text-sm text-center mb-8">{email}</p>

            <form onSubmit={verifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="input text-center text-2xl font-bold tracking-[0.3em] py-4"
                  placeholder="000000"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <button type="submit" disabled={loading || code.length < 6} className="btn-primary w-full justify-center py-3.5 text-base">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>

            <div className="flex items-center justify-between mt-4 text-sm">
              <button
                onClick={() => { setStep('email'); setCode(''); setError('') }}
                className="text-muted hover:text-ink transition-colors"
              >
                ← Change email
              </button>
              <button
                onClick={resend}
                disabled={resendCooldown > 0}
                className="text-muted hover:text-ink transition-colors disabled:opacity-40"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
