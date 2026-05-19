/**
 * Nevada (Las Vegas) operator scraper
 * Targets aircharterguide.com/nv + jetmembership.com/nv + Las Vegas-specific searches
 * Output: nevada-operators.csv
 */

import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, 'nevada-operators.csv')

const HEADERS_HTTP = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' }
const PHONE_RE = /(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/g
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const SKIP_EMAILS = ['noreply','example','sentry','domain','email.com','test.com',
  '@aircharterguide','@jetsreview','@jetmembership','@aviapages','@google','@yelp']
const SKIP_DOMAINS = ['google.com','facebook.com','linkedin.com','yelp.com','youtube.com',
  'instagram.com','twitter.com','faa.gov','wikipedia.org','indeed.com','glassdoor.com']

const results = []
const seen = new Set()

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
  const phones = [...new Set([...(text.matchAll(PHONE_RE) || [])].map(m => m[1]))]
  const emails = [...new Set([...(text.matchAll(EMAIL_RE) || [])].map(m => m[0]))]
    .filter(e => !SKIP_EMAILS.some(s => e.toLowerCase().includes(s)))
  return {
    phone: phones.find(p => { const d = p.replace(/\D/g,''); return d.length === 10 && parseInt(d.substring(0,3)) >= 200 }) || '',
    email: emails[0] || ''
  }
}

function addResult(name, phone, email, website, source) {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g,'')
  if (!name || seen.has(key)) return
  seen.add(key)
  results.push({ name, state: 'NV', phone, email, website: website || '', source })
  const tag = email ? `✓ ${email}` : phone ? `📞 ${phone}` : '—'
  console.log(`  ${name} ${tag}`)
}

function saveCSV() {
  const headers = ['name','state','phone','email','website','source','Contacted','Notes']
  const escape = v => (String(v).includes(',') || String(v).includes('"'))
    ? `"${String(v).replace(/"/g,'""')}"` : String(v)
  const csv = [headers.join(','), ...results.map(r => headers.map(h => escape(r[h]||'')).join(','))].join('\n')
  writeFileSync(OUT, csv, 'utf8')
}

// ── 1. Air Charter Guide — Nevada ─────────────────────────────────────────────
console.log('\n=== Air Charter Guide /nv ===')
{
  const indexHtml = await fetchText('https://www.aircharterguide.com/charter-operators/usa/nv')
  const links = [...(indexHtml.matchAll(/href="(\/charter-operators\/usa\/nv\/[^"]+)"/gi) || [])].map(m => m[1])
  const unique = [...new Set(links)]
  console.log(`Found ${unique.length} operator links`)

  for (const link of unique) {
    const url = `https://www.aircharterguide.com${link}`
    await sleep(900)
    const html = await fetchText(url)
    if (!html) continue
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
    const name = nameMatch ? nameMatch[1].trim() : ''
    if (!name) continue
    const { phone, email } = extractContacts(html)
    const websiteMatch = html.match(/href="(https?:\/\/(?!www\.aircharterguide)[^"]+)"[^>]*>[^<]*[Ww]ebsite/)
    addResult(name, phone, email, websiteMatch?.[1] || '', 'aircharterguide')
  }
  saveCSV()
}

// ── 2. Jet Membership — Nevada ────────────────────────────────────────────────
console.log('\n=== Jet Membership /nv ===')
{
  const indexHtml = await fetchText('https://jetmembership.com/operators/state/nv/')
  const links = [...(indexHtml.matchAll(/href="(\/operators\/[^"\/]+\/?)"/gi) || [])].map(m => m[1])
  const unique = [...new Set(links)].filter(l => l !== '/operators/')
  console.log(`Found ${unique.length} operator links`)

  for (const link of unique) {
    await sleep(700)
    const html = await fetchText(`https://jetmembership.com${link}`)
    if (!html) continue
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
    const name = nameMatch ? nameMatch[1].trim() : ''
    if (!name || name.toLowerCase().includes('jetmembership')) continue
    const { phone, email } = extractContacts(html)
    addResult(name, phone, email, '', 'jetmembership')
    saveCSV()
  }
}

// ── 3. Private Fly / Charter Las Vegas search ─────────────────────────────────
console.log('\n=== DuckDuckGo — Las Vegas charter operators ===')
{
  const queries = [
    'Las Vegas private jet charter operator empty leg site:*.com',
    'Las Vegas Nevada Part 135 charter aviation operator contact email',
    'Henderson Executive Airport charter operator Nevada contact',
    'Las Vegas North Las Vegas airport private jet operator email phone',
  ]
  for (const q of queries) {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`
    const html = await fetchText(url)
    const links = [...(html.matchAll(/href="(https?:\/\/[^"&]+)"/g) || [])].map(m => m[1])
    for (const link of links.slice(0, 8)) {
      const domain = link.split('/')[2]?.replace('www.','') || ''
      if (SKIP_DOMAINS.some(s => domain.includes(s))) continue
      if (seen.has(domain)) continue
      await sleep(1200)
      const opHtml = await fetchText(link)
      if (!opHtml) continue
      const nameMatch = opHtml.match(/<(?:h1|title)[^>]*>([^<]{3,60})<\/(?:h1|title)>/)
      const name = nameMatch ? nameMatch[1].replace(/\s*[-|].*$/,'').trim() : domain
      const { phone, email } = extractContacts(opHtml)
      if (phone || email) addResult(name, phone, email, link, 'web-search')
    }
    await sleep(2000)
    saveCSV()
  }
}

// ── 4. Aviapages NV ───────────────────────────────────────────────────────────
console.log('\n=== Aviapages — Nevada ===')
{
  for (let page = 1; page <= 5; page++) {
    const html = await fetchText(`https://aviapages.com/charter-operators/?country=US&state=NV&page=${page}`)
    if (!html || html.includes('No operators')) break
    const links = [...(html.matchAll(/href="(\/charter-operators\/[^"]+\/)"/gi) || [])].map(m => m[1])
    for (const link of [...new Set(links)].slice(0, 15)) {
      await sleep(700)
      const opHtml = await fetchText(`https://aviapages.com${link}`)
      if (!opHtml) continue
      const nameMatch = opHtml.match(/<h1[^>]*>([^<]+)<\/h1>/)
      const name = nameMatch ? nameMatch[1].trim() : ''
      if (!name) continue
      const { phone, email } = extractContacts(opHtml)
      addResult(name, phone, email, '', 'aviapages')
    }
    await sleep(1000)
    saveCSV()
    if (links.length === 0) break
  }
}

console.log(`\n✅ Done. ${results.length} Nevada operators found.`)
console.log(`With email: ${results.filter(r=>r.email).length} | With phone only: ${results.filter(r=>!r.email&&r.phone).length}`)
console.log(`Saved to: ${OUT}`)
