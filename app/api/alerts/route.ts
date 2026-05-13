import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/clients/supabase'

export async function POST(req: NextRequest) {
  const { email, from, to } = await req.json()
  if (!email || !from || !to) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await supabaseAdmin.from('route_alerts').insert({ email, from_city: from, to_city: to })
  return NextResponse.json({ ok: true })
}
