import { NextResponse } from 'next/server'

export async function GET() {
  const pwd = process.env.ADMIN_PASSWORD
  return NextResponse.json({
    set: !!pwd,
    length: pwd?.length ?? 0,
    preview: pwd ? pwd.slice(0, 2) + '...' + pwd.slice(-2) : 'empty',
    chars: pwd ? Array.from(pwd).map(c => c.charCodeAt(0)) : []
  })
}
