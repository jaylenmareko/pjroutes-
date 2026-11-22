import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/clients/supabase'
import { sanitize } from '@/lib/sanitize'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(ip, { max: 10, windowMs: 60_000 })) return rateLimitResponse()
  const raw = await req.json()
  const { email, from, to } = sanitize(raw) as { email: string; from: string; to: string }
  if (!email || !from || !to) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await supabaseAdmin.from('route_alerts').insert({ email, from_city: from, to_city: to })
  return NextResponse.json({ ok: true })
}
