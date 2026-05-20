/**
 * Enrich Nevada operators using DDG search + website scraping
 * Targets the fixed-wing operators we couldn't get from ACG directly
 */

import { writeFileSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, 'nevada-operators.csv')

const HEADERS_HTTP = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' }
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const PHONE_RE = /(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/
const SKIP_EMAILS = ['noreply','example','sentry','@google','@yelp','@facebook','@linkedin','@twitter','@aircharterguide']
const SKIP_DOMAINS = ['google.com','facebook.com','linkedin.com','yelp.com','youtube.com','instagram.com','twitter.com','wikipedia.org','aircharterguide.com']

const OPERATORS = [
  { name: 'Solairus Aviation', city: 'Las Vegas', website: 'solairus.net' },
  { name: 'M and N Aviation', city: 'Reno', website: '' },
  { name: 'Air Smart Share', city: 'Las Vegas', website: '' },
  { name: 'AirTahoe', city: 'Minden', website: 'airtahoe.com' },
  { name: 'Charter Airlines LLC', city: 'Las Vegas', website: '' },
  { name: 'Clay Lacy Aviation', city: 'Las Vegas', website: 'claylacy.com' },
  { name: 'CTP Aviation', city: 'Las Vegas', website: '' },
  { name: 'El Aero Services', city: 'Carson City', website: '' },
  { name: 'Great Western Air / Cirrus Aviation Services', city: 'Las Vegas', website: 'cirrusaviation.com' },
  { name: 'Hangar 7 Aviation', city: 'Las Vegas', website: '' },
  { name: 'Hutt Aviation', city: 'Minden', website: '' },
  { name: 'Jet Edge International', city: 'Las Vegas', website: 'jetedge.com' },
  { name: 'Marc Air', city: 'Minden', website: 'marcair.com' },
  { name: 'Mira Vista Aviation', city: 'Las Vegas', website: '' },
  { name: 'Mountain Lion Aviation', city: 'Reno', website: '' },
  { name: 'Prestige Air Group', city: 'Las Vegas', website: 'prestigeairgroup.com' },
  { name: 'Silver Air', city: 'Reno', website: 'silverair.com' },
  { name: 'Thrive Aviation', city: 'Las Vegas', website: 'thriveaviation.com' },
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: HEADERS_HTTP, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return ''
    return await res.text()
  } catch { return '' }
}

function extractContacts(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const phone = PHONE_RE.exec(text)?.[1] ?? ''
  const emails = [...(text.matchAll(EMAIL_RE) ?? [])].map(m => m[0])
  const email = emails.find(e => !SKIP_EMAILS.some(s => e.toLowerCase().includes(s))) ?? ''
  return { phone, email }
}

async function ddgSearch(name, city) {
  const q = encodeURIComponent(`"${name}" Nevada charter aviation contact email phone`)
  const html = await fetchText(`https://html.duckduckgo.com/html/?q=${q}`)
  const links = [...(html.matchAll(/href="(https?:\/\/[^"&]+)"/g) ?? [])].map(m => m[1])
  for (const link of links.slice(0, 6)) {
    const domain = link.split('/')[2]?.replace('www.', '') ?? ''
    if (SKIP_DOMAINS.some(s => domain.includes(s))) continue
    return link
  }
  return null
}

const results = []
console.log(`Enriching ${OPERATORS.length} Nevada operators via DDG...\n`)

for (const op of OPERATORS) {
  process.stdout.write(`${op.name} ... `)
  let phone = '', email = ''

  // 1. Try known website first
  if (op.website) {
    const html = await fetchText(`https://www.${op.website}`)
    if (html) {
      const contacts = extractContacts(html)
      phone = contacts.phone
      email = contacts.email
    }
    await sleep(800)
  }

  // 2. If no email, try DDG
  if (!email) {
    const url = await ddgSearch(op.name, op.city)
    if (url) {
      await sleep(1000)
      const html = await fetchText(url)
      if (html) {
        const contacts = extractContacts(html)
        if (!phone && contacts.phone) phone = contacts.phone
        if (contacts.email) email = contacts.email
      }
    }
    await sleep(1000)
  }

  results.push({ ...op, phone, email })
  const tag = email ? `✓ ${email}` : phone ? `📞 ${phone}` : '—'
  console.log(tag)
  await sleep(1200)
}

const headers = ['Operator Name', 'City', 'State', 'Phone', 'Email', 'Website', 'Contacted', 'Notes', 'Source']
const escape = v => (String(v||'').includes(',') || String(v||'').includes('"')) ? `"${String(v||'').replace(/"/g,'""')}"` : String(v||'')
const csv = [
  headers.join(','),
  ...results.map(r => [r.name, r.city, 'NV', r.phone, r.email, r.website||'', 'No', '', 'aircharterguide'].map(escape).join(','))
].join('\n')

writeFileSync(OUT, csv, 'utf8')
console.log(`\n✅ Done. ${results.filter(r=>r.email).length}/${results.length} with email, ${results.filter(r=>!r.email&&r.phone).length} phone only.`)
