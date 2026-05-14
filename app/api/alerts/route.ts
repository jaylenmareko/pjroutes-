import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/clients/supabase'
import { sanitize } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  const raw = await req.json()
  const { email, from, to } = sanitize(raw) as { email: string; from: string; to: string }
  if (!email || !from || !to) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await supabaseAdmin.from('route_alerts').insert({ email, from_city: from, to_city: to })
  return NextResponse.json({ ok: true })
}
