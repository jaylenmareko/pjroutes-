import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/clients/supabase'
import { getResend } from '@/lib/clients/resend'
import { stripe } from '@/lib/clients/stripe'

export async function POST(req: NextRequest) {
  const { flightId, paymentIntentId, paymentMethod, passenger } = await req.json()

  const { data: flight } = await supabaseAdmin.from('flights').select('*').eq('id', flightId).single()
  if (!flight) return NextResponse.json({ error: 'Flight not found' }, { status: 404 })

  const PLATFORM_FEE = 0.25
  const buyerPrice = Math.round(flight.price * (1 + PLATFORM_FEE))
  const fee = buyerPrice - flight.price

  // Pull receipt URL from Stripe charge
  let receiptUrl = ''
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] })
    const charge = intent.latest_charge as { receipt_url?: string } | null
    receiptUrl = charge?.receipt_url ?? ''
  } catch { /* non-fatal */ }

  const { data: booking } = await supabaseAdmin.from('bookings').insert({
    flight_id: flightId,
    passenger_name: passenger.name,
    passenger_email: passenger.email,
    passenger_phone: passenger.phone,
    passengers: passenger.count,
    payment_intent_id: paymentIntentId,
    payment_method: paymentMethod,
    amount: buyerPrice,
    status: 'confirmed',
  }).select().single()

  await supabaseAdmin.from('flights').update({ status: 'booked' }).eq('id', flightId)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const departStart = new Date(flight.depart_start)
  const departEnd = new Date(flight.depart_end)
  const dateStr = departStart.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const startTime = departStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const endTime = departEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const departureWindow = `${dateStr}, ${startTime} – ${endTime}`
  const totalFormatted = `$${(buyerPrice / 100).toLocaleString()}`
  const paymentLabel = paymentMethod === 'ach' ? 'Bank transfer (ACH)' : 'Credit card'
  const amenities = [
    flight.has_wifi && 'Wi-Fi',
    flight.pets_allowed && 'Pets allowed',
    flight.standup_cabin && 'Stand-up cabin',
  ].filter(Boolean).join(', ') || 'None'

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#6B7280;font-size:14px;width:140px">${label}</td><td style="padding:6px 0;font-size:14px;color:#0A0A0A;font-weight:500">${value}</td></tr>`

  // Confirmation to passenger
  await getResend().emails.send({
    from: 'support@pjroutes.com',
    to: passenger.email,
    subject: `Booking confirmed — ${flight.from_city} → ${flight.to_city}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:540px;margin:0 auto;padding:32px 24px">
        <p style="font-size:13px;color:#6B7280;margin:0 0 8px">PJRoutes</p>
        <h1 style="font-size:24px;font-weight:700;color:#0A0A0A;margin:0 0 4px">You're booked.</h1>
        <p style="color:#6B7280;margin:0 0 28px">Your booking is confirmed. Show up at the FBO — skip the terminal, board directly. Expect a personal call from the operator 24–48 hrs before departure.</p>

        <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="font-size:18px;font-weight:700;color:#0A0A0A;margin:0 0 16px">${flight.from_city} (${flight.from_airport}) → ${flight.to_city} (${flight.to_airport})</p>
          <table style="width:100%;border-collapse:collapse">
            ${row('Date', dateStr)}
            ${row('Departure window', `${startTime} – ${endTime}`)}
            ${flight.fbo_address ? row('FBO address', flight.fbo_address) : ''}
            ${row('Aircraft', `${flight.aircraft_type}`)}
            ${row('Tail number', flight.aircraft_tail)}
            ${row('Passengers', `${passenger.count}`)}
            ${row('Amenities', amenities)}
            ${row('Operator', flight.operator_name)}
            ${row('Operator phone', flight.operator_phone)}
          </table>
        </div>

        <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="font-size:15px;font-weight:600;color:#0A0A0A;margin:0 0 12px">Receipt</p>
          <table style="width:100%;border-collapse:collapse">
            ${row('Amount charged', totalFormatted)}
            ${row('Payment method', paymentLabel)}
            ${row('Booking ID', booking?.id ?? '')}
            ${receiptUrl ? `<tr><td style="padding:6px 0;color:#6B7280;font-size:14px;width:140px">Receipt</td><td style="padding:6px 0;font-size:14px;"><a href="${receiptUrl}" style="color:#8C1C1C;font-weight:500">View receipt →</a></td></tr>` : ''}
          </table>
        </div>

        <p style="color:#6B7280;font-size:13px;margin:0">Questions? Reply to this email or call the operator directly.</p>
      </div>
    `,
  })

  // Notify operator
  await getResend().emails.send({
    from: 'support@pjroutes.com',
    to: flight.operator_email,
    subject: `New booking — ${flight.from_city} → ${flight.to_city}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:540px;margin:0 auto;padding:32px 24px">
        <p style="font-size:13px;color:#6B7280;margin:0 0 8px">PJRoutes</p>
        <h1 style="font-size:24px;font-weight:700;color:#0A0A0A;margin:0 0 4px">New booking on your empty leg.</h1>
        <p style="color:#6B7280;margin:0 0 28px">Send the passenger their FBO address and departure window to complete their experience.</p>

        <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="font-size:15px;font-weight:600;color:#0A0A0A;margin:0 0 12px">Passenger</p>
          <table style="width:100%;border-collapse:collapse">
            ${row('Name', passenger.name)}
            ${row('Email', passenger.email)}
            ${row('Phone', passenger.phone)}
            ${row('Passengers', `${passenger.count}`)}
          </table>
        </div>

        <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="font-size:15px;font-weight:600;color:#0A0A0A;margin:0 0 12px">Flight</p>
          <table style="width:100%;border-collapse:collapse">
            ${row('Route', `${flight.from_city} (${flight.from_airport}) → ${flight.to_city} (${flight.to_airport})`)}
            ${row('Departure window', departureWindow)}
            ${row('Aircraft', `${flight.aircraft_type} · ${flight.aircraft_tail}`)}
          </table>
        </div>

        <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="font-size:15px;font-weight:600;color:#0A0A0A;margin:0 0 12px">Booking</p>
          <table style="width:100%;border-collapse:collapse">
            ${row('Amount collected', totalFormatted)}
            ${row('Payment method', paymentLabel)}
            ${row('Booking ID', booking?.id ?? '')}
          </table>
        </div>

        <p style="color:#6B7280;font-size:13px;margin:0">Questions? Contact PJRoutes at support@pjroutes.com.</p>
      </div>
    `,
  })

  // Follow-up after 24h — "other routes you might like"
  await getResend().emails.send({
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
