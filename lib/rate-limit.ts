const store = new Map<string, { count: number; reset: number }>()

export function rateLimit(ip: string, opts: { max: number; windowMs: number }): boolean {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.reset) {
    store.set(ip, { count: 1, reset: now + opts.windowMs })
    return true
  }

  if (entry.count >= opts.max) return false
  entry.count++
  return true
}

export function rateLimitResponse() {
  return new Response(JSON.stringify({ error: 'Too many requests' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
  })
}
