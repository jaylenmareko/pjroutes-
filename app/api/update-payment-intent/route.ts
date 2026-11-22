import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/clients/stripe'

export async function POST(req: NextRequest) {
  const { paymentIntentId, receiptEmail } = await req.json()
  if (!paymentIntentId || !receiptEmail) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  await stripe.paymentIntents.update(paymentIntentId, { receipt_email: receiptEmail })
  return NextResponse.json({ ok: true })
}
