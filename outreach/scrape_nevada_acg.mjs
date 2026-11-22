/**
 * Scrape contact info for 25 NV operators from AirCharterGuide
 * Output: nevada-operators.csv (overwrites with enriched data)
 */

import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, 'nevada-operators.csv')

const HEADERS_HTTP = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const PHONE_RE = /(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/

const SKIP_EMAILS = ['noreply','example','sentry','@aircharterguide','@google','@yelp','@informa']

const OPERATORS = [
  { name: 'SOLAIRUS AVIATION', city: 'Las Vegas', url: 'https://www.aircharterguide.com/Operator_Info/SOLAIRUS+AVIATION/2174/LAS%20VEGAS/2401' },
  { name: 'M AND N AVIATION', city: 'Reno', url: 'https://www.aircharterguide.com/Operator_Info/M+AND+N+AVIATION/62423/RENO/49681' },
  { name: 'AIR SMART SHARE', city: 'Las Vegas', url: 'https://www.aircharterguide.com/Operator_Info/AIR+SMART+SHARE/98948/LAS%20VEGAS/68741' },
  { name: 'AIRTAHOE', city: 'Minden', url: 'https://www.aircharterguide.com/Operator_Info/AIRTAHOE/99802/MINDEN/69821' },
  { name: 'CHARTER AIRLINES LLC', city: 'Las Vegas', url: 'https://www.aircharterguide.com/Operator_Info/CHARTER+AIRLINES%2C+LLC%2e/87/LAS%20VEGAS/84' },
  { name: 'CLAY LACY AVIATION', city: 'Las Vegas', url: 'https://www.aircharterguide.com/Operator_Info/CLAY+LACY+AVIATION%2C+INC%2e/809/LAS%20VEGAS/874' },
  { name: 'CTP AVIATION', city: 'Las Vegas', url: 'https://www.aircharterguide.com/Operator_Info/CTP+AVIATION/2418/LAS%20VEGAS/2655' },
  { name: 'EL AERO SERVICES', city: 'Carson City', url: 'https://www.aircharterguide.com/Operator_Info/EL+AERO+SERVICES%2C+LLC%2e/675/CARSON%20CITY/732' },
  { name: 'EXECUTIVE JET MANAGEMENT (EJM)', city: 'Las Vegas', url: 'https://www.aircharterguide.com/Operator_Info/EXECUTIVE+JET+MANAGEMENT+%28EJM%29/994/LAS%20VEGAS/1070' },
  { name: 'GREAT WESTERN AIR / CIRRUS AVIATION', city: 'Las Vegas', url: 'https://www.aircharterguide.com/Operator_Info/GREAT+WESTERN+AIR+DBA+CIRRUS+AVIATION+SERVICES+LLC/97771/LAS%20VEGAS/67323' },
  { name: 'HANGAR 7 AVIATION', city: 'Las Vegas', url: 'https://www.aircharterguide.com/Operator_Info/HANGAR+7+AVIATION/99805/LAS%20VEGAS/69824' },
  { name: 'HUTT AVIATION', city: 'Minden', url: 'https://www.aircharterguide.com/Operator_Info/HUTT+AVIATION%2C+INC%2e/1618/MINDEN/1787' },
  { name: 'JET EDGE / VISTA JET', city: 'Las Vegas', url: 'https://www.aircharterguide.com/Operator_Info/JET+EDGE+INTERNATIONAL+-+VISTA+JET/96823/LAS%20VEGAS/66158' },
  { name: 'MARC AIR', city: 'Minden', url: 'https://www.aircharterguide.com/Operator_Info/MARC+AIR/1860/MINDEN/2057' },
  { name: 'MIRA VISTA AVIATION', city: 'Las Vegas', url: 'https://www.aircharterguide.com/Operator_Info/MIRA+VISTA+AVIATION/1786/LAS%20VEGAS/1980' },
  { name: 'MOUNTAIN LION AVIATION', city: 'Reno', url: 'https://www.aircharterguide.com/Operator_Info/MOUNTAIN+LION+AVIATION/99739/RENO/69749' },
  { name: 'PRESTIGE AIR GROUP', city: 'Las Vegas', url: 'https://www.aircharterguide.com/Operator_Info/PRESTIGE+AIR+GROUP/99041/LAS%20VEGAS/68861' },
  { name: 'SILVER AIR', city: 'Reno', url: 'https://www.aircharterguide.com/Operator_Info/SILVER+AIR/97404/RENO/66885' },
  { name: 'THRIVE AVIATION', city: 'Las Vegas', url: 'https://www.aircharterguide.com/Operator_Info/THRIVE+AVIATION/1792/LAS%20VEGAS/1986' },
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: HEADERS_HTTP, signal: AbortSignal.timeout(10000) })
    if (!res.ok) return ''
    return await res.text()
  } catch { return '' }
}

function extractContacts(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const phone = PHONE_RE.exec(text)?.[1] ?? ''
  const emails = [...(text.matchAll(EMAIL_RE) ?? [])].map(m => m[0])
  const email = emails.find(e => !SKIP_EMAILS.some(s => e.toLowerCase().includes(s))) ?? ''

  // Also look for website
  const websiteMatch = html.match(/href="(https?:\/\/(?!www\.aircharterguide|linkedin|facebook|twitter|instagram)[^"]+)"[^>]*>.*?[Ww]ebsite|[Vv]isit.*?href="(https?:\/\/(?!www\.aircharterguide)[^"]+)"/s)
  const website = websiteMatch?.[1] || websiteMatch?.[2] || ''

  return { phone, email, website }
}

const results = []
console.log(`Scraping ${OPERATORS.length} Nevada operators...\n`)

for (const op of OPERATORS) {
  process.stdout.write(`${op.name} (${op.city}) ... `)
  const html = await fetchText(op.url)

  if (!html) {
    console.log('✗ fetch failed')
    results.push({ ...op, phone: '', email: '', website: '', Contacted: 'No', Notes: '' })
    await sleep(1000)
    continue
  }

  const { phone, email, website } = extractContacts(html)
  results.push({ ...op, phone, email, website, Contacted: 'No', Notes: '' })

  const tag = email ? `✓ ${email}` : phone ? `📞 ${phone}` : website ? `🌐 ${website.slice(0,40)}` : '—'
  console.log(tag)
  await sleep(1200)
}

// Save CSV
const headers = ['Operator Name', 'City', 'State', 'Phone', 'Email', 'Website', 'Contacted', 'Notes', 'Source']
const escape = v => (String(v||'').includes(',') || String(v||'').includes('"')) ? `"${String(v||'').replace(/"/g,'""')}"` : String(v||'')
const csv = [
  headers.join(','),
  ...results.map(r => [
    r.name, r.city, 'NV', r.phone, r.email, r.website, r.Contacted, r.Notes, 'aircharterguide'
  ].map(escape).join(','))
].join('\n')

writeFileSync(OUT, csv, 'utf8')
console.log(`\n✅ Done. ${results.filter(r=>r.email).length}/${results.length} with email, ${results.filter(r=>!r.email&&r.phone).length} phone only.`)
console.log(`Saved to: ${OUT}`)
