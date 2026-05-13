import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resend } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { flightId, paymentIntentId, paymentMethod, passenger } = await req.json()

  const { data: flight } = await supabaseAdmin.from('flights').select('*').eq('id', flightId).single()
  if (!flight) return NextResponse.json({ error: 'Flight not found' }, { status: 404 })

  const PLATFORM_FEE = 0.25
  const buyerPrice = Math.round(flight.price * (1 + PLATFORM_FEE))
  const stripeFee = paymentMethod === 'ach'
    ? Math.min(500, Math.round(buyerPrice * 0.008))
    : Math.round(buyerPrice * 0.029 + 30)
  const fee = buyerPrice - flight.price + stripeFee

  const { data: booking } = await supabaseAdmin.from('bookings').insert({
    flight_id: flightId,
    passenger_name: passenger.name,
    passenger_email: passenger.email,
    passenger_phone: passenger.phone,
    passengers: passenger.count,
    payment_intent_id: paymentIntentId,
    payment_method: paymentMethod,
    amount: flight.price + fee,
    status: 'confirmed',
  }).select().single()

  await supabaseAdmin.from('flights').update({ status: 'booked' }).eq('id', flightId)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  // Confirmation to passenger
  await resend.emails.send({
    from: 'support@pjroutes.com',
    to: passenger.email,
    subject: `Confirmed: ${flight.from_city} → ${flight.to_city}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#0A0A0A;margin-bottom:4px">You're booked.</h2>
        <p style="color:#6B7280;margin-bottom:24px">The operator will contact you within 2 hours.</p>
        <div style="background:#F9FAFB;border-radius:12px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 8px"><strong>${flight.from_city} → ${flight.to_city}</strong></p>
          <p style="margin:0 0 4px;color:#6B7280;font-size:14px">Aircraft: ${flight.aircraft_type}</p>
          <p style="margin:0;color:#6B7280;font-size:14px">Operator: ${flight.operator_name}</p>
        </div>
        <p style="color:#6B7280;font-size:13px">Questions? Reply to this email.</p>
      </div>
    `,
  })

  // Notify operator
  await resend.emails.send({
    from: 'support@pjroutes.com',
    to: flight.operator_email,
    subject: `New booking — ${flight.from_city} → ${flight.to_city}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2>New booking on your empty leg.</h2>
        <div style="background:#F9FAFB;border-radius:12px;padding:16px;margin-bottom:24px">
          <p><strong>${passenger.name}</strong></p>
          <p style="color:#6B7280;font-size:14px">${passenger.email} · ${passenger.phone}</p>
          <p style="color:#6B7280;font-size:14px">${passenger.count} passenger${passenger.count > 1 ? 's' : ''}</p>
        </div>
        <p style="color:#6B7280">Please contact the passenger within 2 hours to confirm.</p>
      </div>
    `,
  })

  // Follow-up after 24h — "other routes you might like"
  await resend.emails.send({
    from: 'support@pjroutes.com',
    to: passenger.email,
    subject: 'More empty legs on your routes',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <p>Hope the flight was smooth.</p>
        <p>We have more empty legs available. <a href="${appUrl}/flights" style="color:#8C1C1C;font-weight:600">Browse available flights →</a></p>
      </div>
    `,
  })

  return NextResponse.json({ bookingId: booking?.id })
}
