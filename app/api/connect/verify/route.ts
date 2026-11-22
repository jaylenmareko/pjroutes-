import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/clients/stripe'
import { supabaseAdmin } from '@/lib/clients/supabase'

export async function POST(req: NextRequest) {
  const { accountId } = await req.json()
  if (!accountId) return NextResponse.json({ error: 'Missing accountId' }, { status: 400 })

  const account = await stripe.accounts.retrieve(accountId)
  const complete = account.details_submitted && account.charges_enabled

  if (complete) {
    await supabaseAdmin
      .from('operators')
      .update({ onboarding_complete: true })
      .eq('stripe_account_id', accountId)
  }

  return NextResponse.json({ complete, detailsSubmitted: account.details_submitted })
}
