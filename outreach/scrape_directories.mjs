/**
 * Operator directory scraper
 * Scrapes aircharterguide.com, jetmembership.com, jetsreview.com, aviapages.com
 * Extracts: name, phone, email, website, state
 */

import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, 'directory-operators.csv')

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' }
const PHONE_RE = /(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/g
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const SKIP_EMAILS = ['noreply', 'example', 'sentry', 'domain', 'email.com', '@aircharterguide', '@jetsreview', '@jetmembership', '@aviapages']

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) })
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
    phone: phones.find(p => {
      const d = p.replace(/\D/g, '')
      return d.length === 10 && parseInt(d.substring(0, 3)) >= 200
    }) || '',
    email: emails[0] || ''
  }
}

const results = []

// ── 1. Air Charter Guide ──────────────────────────────────────────────────────
console.log('\n=== Air Charter Guide ===')
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

for (const state of US_STATES) {
  const url = `https://www.aircharterguide.com/charter-operators/usa/${state.toLowerCase()}`
  const html = await fetchText(url)
  if (!html) { process.stdout.write('.'); continue }

  // Extract operator listings
  const nameMatches = [...html.matchAll(/class="[^"]*operator[^"]*"[^>]*>([^<]+)</gi)]
  const linkMatches = [...html.matchAll(/href="(\/charter-operators\/usa\/[^"]+)"/gi)]

  let found = 0
  for (const match of linkMatches.slice(0, 30)) {
    const opUrl = `https://www.aircharterguide.com${match[1]}`
    if (opUrl.includes(`/${state.toLowerCase()}/`) && !opUrl.endsWith(`/${state.toLowerCase()}`)) {
      await sleep(800)
      const opHtml = await fetchText(opUrl)
      if (!opHtml) continue
      const nameMatch = opHtml.match(/<h1[^>]*>([^<]+)<\/h1>/)
      const name = nameMatch ? nameMatch[1].trim() : ''
      if (!name) continue
      const contacts = extractContacts(opHtml)
      const websiteMatch = opHtml.match(/href="(https?:\/\/(?!www\.aircharterguide)[^"]+)"[^>]*>[^<]*[Ww]ebsite/)
      results.push({ name, state, phone: contacts.phone, email: contacts.email, website: websiteMatch?.[1] || '', source: 'aircharterguide' })
      if (contacts.phone || contacts.email) { process.stdout.write('✓'); found++ }
      else process.stdout.write('.')
    }
  }
  if (found > 0) console.log(` ${state}: ${found}`)
  await sleep(1000)
}

// ── 2. Jet Membership ─────────────────────────────────────────────────────────
console.log('\n=== Jet Membership ===')
for (const state of US_STATES) {
  const url = `https://jetmembership.com/operators/state/${state.toLowerCase()}/`
  const html = await fetchText(url)
  if (!html || html.includes('404') || html.includes('No operators')) { process.stdout.write('.'); continue }
  const links = [...html.matchAll(/href="(\/operators\/[^"\/]+\/?)"/gi)].map(m => m[1])
  for (const link of [...new Set(links)].slice(0, 20)) {
    if (link === '/operators/') continue
    await sleep(600)
    const opHtml = await fetchText(`https://jetmembership.com${link}`)
    if (!opHtml) continue
    const nameMatch = opHtml.match(/<h1[^>]*>([^<]+)<\/h1>/)
    const name = nameMatch ? nameMatch[1].trim() : ''
    if (!name || name.toLowerCase().includes('jetmembership')) continue
    const contacts = extractContacts(opHtml)
    if (contacts.phone || contacts.email) {
      results.push({ name, state, phone: contacts.phone, email: contacts.email, website: '', source: 'jetmembership' })
      process.stdout.write('✓')
    } else process.stdout.write('.')
  }
  await sleep(800)
}

// ── 3. Jets Review ────────────────────────────────────────────────────────────
console.log('\n=== Jets Review ===')
for (let page = 1; page <= 20; page++) {
  const url = `https://jetsreview.com/charter-operators/united-states/?page=${page}`
  const html = await fetchText(url)
  if (!html || html.includes('No results')) break
  const links = [...html.matchAll(/href="(https?:\/\/jetsreview\.com\/[^"]+\/?)"/gi)].map(m => m[1])
    .filter(l => l.includes('/charter-operators/') && l.split('/').length > 5)
  for (const link of [...new Set(links)].slice(0, 15)) {
    await sleep(600)
    const opHtml = await fetchText(link)
    if (!opHtml) continue
    const nameMatch = opHtml.match(/<h1[^>]*>([^<]+)<\/h1>/)
    const name = nameMatch ? nameMatch[1].trim() : ''
    if (!name) continue
    const stateMatch = opHtml.match(/State.*?<[^>]+>([A-Z]{2})</)
    const contacts = extractContacts(opHtml)
    results.push({ name, state: stateMatch?.[1] || 'US', phone: contacts.phone, email: contacts.email, website: '', source: 'jetsreview' })
    if (contacts.phone || contacts.email) process.stdout.write('✓')
    else process.stdout.write('.')
  }
  process.stdout.write(` p${page}`)
  await sleep(1000)
}

// ── 4. Aviapages ──────────────────────────────────────────────────────────────
console.log('\n=== Aviapages ===')
for (let page = 1; page <= 15; page++) {
  const url = `https://aviapages.com/charter-operators/?country=US&page=${page}`
  const html = await fetchText(url)
  if (!html || html.includes('No operators')) break
  const links = [...html.matchAll(/href="(\/charter-operators\/[^"]+\/)"/gi)].map(m => m[1])
  for (const link of [...new Set(links)].slice(0, 15)) {
    await sleep(600)
    const opHtml = await fetchText(`https://aviapages.com${link}`)
    if (!opHtml) continue
    const nameMatch = opHtml.match(/<h1[^>]*>([^<]+)<\/h1>/)
    const name = nameMatch ? nameMatch[1].trim() : ''
    if (!name) continue
    const contacts = extractContacts(opHtml)
    results.push({ name, state: 'US', phone: contacts.phone, email: contacts.email, website: '', source: 'aviapages' })
    if (contacts.phone || contacts.email) process.stdout.write('✓')
    else process.stdout.write('.')
  }
  process.stdout.write(` p${page}`)
  await sleep(1000)
}

// ── Save results ──────────────────────────────────────────────────────────────
const withContact = results.filter(r => r.phone || r.email)
const escape = v => v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
const headers = ['name', 'state', 'phone', 'email', 'website', 'source']
const csv = [headers.join(','), ...withContact.map(r => headers.map(h => escape(r[h] || '')).join(','))].join('\n')
writeFileSync(OUT, csv, 'utf8')
console.log(`\n\nDone. ${withContact.length} operators with contact info saved to directory-operators.csv`)
console.log('Sources:', [...new Set(withContact.map(r => r.source))].map(s => `${s}: ${withContact.filter(r => r.source === s).length}`).join(', '))
