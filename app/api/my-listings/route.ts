import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/clients/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('flights')
    .select('*, bookings(passenger_name, passenger_email, passenger_phone, passengers, created_at)')
    .eq('operator_email', user.email)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
