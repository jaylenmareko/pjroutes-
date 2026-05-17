/**
 * Operator enrichment — Node.js version
 * Finds phone + email for operators missing contact info.
 * Tries jetmembership.com first, falls back to DuckDuckGo search.
 * Run: node enrich_operators.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_PATH = join(__dirname, 'tier1-operators-enriched.csv')
const BATCH = 50     // how many to process per run
const DELAY = 2500   // ms between requests

const PHONE_RE = /(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const SKIP_EMAILS = ['noreply', 'example', 'sentry', 'domain', 'email.com', 'test.com', 'yourcompany']
const SKIP_DOMAINS = ['google.com','facebook.com','linkedin.com','yelp.com','youtube.com',
  'instagram.com','twitter.com','faa.gov','wikipedia.org','indeed.com','ziprecruiter.com',
  'glassdoor.com','bbb.org','dnb.com','aircharteradvisors.com','stratosjets.com']

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim())
  const headers = parseRow(lines[0])
  return { headers, rows: lines.slice(1).map(line => {
    const vals = parseRow(line)
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })}
}

function parseRow(line) {
  const result = []; let cur = '', inQuote = false
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote }
    else if (ch === ',' && !inQuote) { result.push(cur.trim()); cur = '' }
    else cur += ch
  }
  result.push(cur.trim())
  return result
}

function toCSV(rows, headers) {
  const escape = v => (v.includes(',') || v.includes('"') || v.includes('\n'))
    ? `"${v.replace(/"/g, '""')}"` : v
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h] ?? '')).join(','))].join('\n')
}

function extractContact(html, url = '') {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const phone = PHONE_RE.exec(text)?.[1] ?? ''
  const emails = [...(text.matchAll(EMAIL_RE) ?? [])].map(m => m[0])
  const email = emails.find(e => !SKIP_EMAILS.some(s => e.toLowerCase().includes(s))) ?? ''
  return { phone, email }
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return ''
    return await res.text()
  } catch { return '' }
}

async function tryJetmembership(name) {
  const slug = name.toLowerCase().replace(/[,.']/g, '').replace(/\s+/g, '-')
  const url = `https://jetmembership.com/operators/${slug}/`
  const html = await fetchPage(url)
  if (!html || !html.includes('Operator')) return {}
  return extractContact(html, url)
}

async function ddgSearch(name, state) {
  const q = encodeURIComponent(`"${name}" ${state} charter aviation contact`)
  const url = `https://html.duckduckgo.com/html/?q=${q}`
  try {
    const html = await fetchPage(url)
    // Extract result links
    const links = [...html.matchAll(/href="(https?:\/\/[^"&]+)"/g)].map(m => m[1])
    for (const link of links.slice(0, 6)) {
      const domain = link.split('/')[2]?.replace('www.', '') ?? ''
      if (SKIP_DOMAINS.some(s => domain.includes(s))) continue
      return link
    }
  } catch {}
  return null
}

async function enrich(name, state) {
  // 1. Try jetmembership
  const jm = await tryJetmembership(name)
  if (jm.phone || jm.email) return jm

  await sleep(1000)

  // 2. DDG search → scrape top result
  const url = await ddgSearch(name, state)
  if (url) {
    await sleep(1000)
    const html = await fetchPage(url)
    if (html) return extractContact(html, url)
  }

  return { phone: '', email: '' }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const raw = readFileSync(CSV_PATH, 'utf8')
const { headers, rows } = parseCSV(raw)

// Ensure columns exist
if (!headers.includes('Phone')) headers.push('Phone')

// Find operators missing both email AND phone
const queue = rows.filter(r =>
  !r['Email']?.includes('@') &&
  r['Contacted']?.trim() !== 'Yes'
)

const batch = queue.slice(0, BATCH)
console.log(`Operators missing email: ${queue.length} | Processing: ${batch.length}\n`)

let found = 0
for (const row of batch) {
  process.stdout.write(`[${batch.indexOf(row) + 1}/${batch.length}] ${row['Operator Name']} ... `)
  const data = await enrich(row['Operator Name'], row['State'])

  if (data.phone && !row['Phone']) row['Phone'] = data.phone
  if (data.email) row['Email'] = data.email

  const tag = data.email ? `✓ ${data.email}` : data.phone ? `📞 ${data.phone}` : '--'
  console.log(tag)
  if (data.email || data.phone) found++

  writeFileSync(CSV_PATH, toCSV(rows, headers), 'utf8')
  await sleep(DELAY)
}

console.log(`\nDone. Found new contact info for ${found}/${batch.length} operators.`)
console.log(`Run again to process next ${Math.min(BATCH, queue.length - batch.length)} operators.`)
