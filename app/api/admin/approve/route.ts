import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resend } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { id, action } = await req.json()
  const status = action === 'approve' ? 'published' : 'rejected'

  const { data: flight } = await supabaseAdmin
    .from('flights')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (!flight) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'approve') {
    const { data: alerts } = await supabaseAdmin
      .from('route_alerts')
      .select('*')
      .ilike('from_city', `%${flight.from_city}%`)
      .ilike('to_city', `%${flight.to_city}%`)

    for (const alert of alerts || []) {
      await resend.emails.send({
        from: 'support@pjroutes.com',
        to: alert.email,
        subject: `New flight: ${flight.from_city} → ${flight.to_city} · $${(flight.price / 100).toLocaleString()}`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:24px">
            <h2 style="color:#0A0A0A">New empty leg on your route.</h2>
            <div style="background:#F9FAFB;border-radius:12px;padding:16px;margin-bottom:24px">
              <p style="margin:0 0 4px;font-size:18px;font-weight:700">${flight.from_city} → ${flight.to_city}</p>
              <p style="margin:0 0 4px;color:#6B7280;font-size:14px">${flight.aircraft_type} · Up to ${flight.seats} passengers</p>
              <p style="margin:0;font-size:20px;font-weight:800;color:#8C1C1C">$${(flight.price / 100).toLocaleString()}</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/flights/${flight.id}" style="display:inline-block;background:#8C1C1C;color:white;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">View & Book →</a>
          </div>
        `,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
