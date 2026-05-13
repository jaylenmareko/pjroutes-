import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/clients/supabase'
import { getResend } from '@/lib/clients/resend'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabaseAdmin.from('flights').insert({
    ...body,
    price: Math.round(parseFloat(body.price) * 100),
    status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await getResend().emails.send({
    from: 'support@pjroutes.com',
    to: process.env.ADMIN_EMAIL || 'support@pjroutes.com',
    subject: `New listing — ${body.from_city} → ${body.to_city}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2>New operator submission.</h2>
        <p><strong>${body.from_city} → ${body.to_city}</strong></p>
        <p>${body.aircraft_type} · ${body.aircraft_tail} · $${body.price}</p>
        <p>${body.operator_name} · ${body.operator_email}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="color:#8C1C1C;font-weight:600">Review in admin →</a>
      </div>
    `,
  })

  return NextResponse.json({ id: data.id })
}
