import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/clients/supabase'
import { DEMO_FLIGHTS } from '@/lib/data/demo-flights'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id.startsWith('demo-')) {
    const demo = DEMO_FLIGHTS.find(f => f.id === id)
    if (!demo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ price: demo.price, from_city: demo.from_city, to_city: demo.to_city, seats: demo.seats, isDemo: true })
  }

  const { data } = await supabase.from('flights').select('price,from_city,to_city,seats').eq('id', id).single()
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
