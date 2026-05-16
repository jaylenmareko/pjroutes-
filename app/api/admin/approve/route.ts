import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/clients/supabase'

export async function POST(req: NextRequest) {
  const { id, action } = await req.json()

  if (action === 'remove') {
    await supabaseAdmin.from('bookings').delete().eq('flight_id', id)
    await supabaseAdmin.from('flights').delete().eq('id', id)
    return NextResponse.json({ ok: true })
  }

  const status = action === 'approve' ? 'published' : 'rejected'

  const { data: flight } = await supabaseAdmin
    .from('flights')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (!flight) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
