/**
 * Enrich nevada-operators.csv with phone + email.
 * Same logic as enrich_operators.mjs but targets nevada-operators.csv.
 */

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_PATH = join(__dirname, 'nevada-operators.csv')
const DELAY = 2500

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const PHONE_RE = /(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/
const SKIP_EMAILS = ['noreply', 'example', 'sentry', 'domain', 'email.com', 'test.com', '@google', '@yelp', '@facebook', '@linkedin']
const SKIP_DOMAINS = ['google.com','facebook.com','linkedin.com','yelp.com','youtube.com','instagram.com','twitter.com','faa.gov','wikipedia.org','indeed.com']

const HEADERS_HTTP = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' }

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
  const escape = v => (String(v||'').includes(',') || String(v||'').includes('"'))
    ? `"${String(v||'').replace(/"/g,'""')}"` : String(v||'')
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n')
}

function extractContact(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const phone = PHONE_RE.exec(text)?.[1] ?? ''
  const emails = [...(text.matchAll(EMAIL_RE) ?? [])].map(m => m[0])
  const email = emails.find(e => !SKIP_EMAILS.some(s => e.toLowerCase().includes(s))) ?? ''
  return { phone, email }
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, { headers: HEADERS_HTTP, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return ''
    return await res.text()
  } catch { return '' }
}

async function ddgSearch(name) {
  const q = encodeURIComponent(`"${name}" Nevada charter aviation contact email phone`)
  const html = await fetchPage(`https://html.duckduckgo.com/html/?q=${q}`)
  const links = [...(html.matchAll(/href="(https?:\/\/[^"&]+)"/g) ?? [])].map(m => m[1])
  for (const link of links.slice(0, 5)) {
    const domain = link.split('/')[2]?.replace('www.', '') ?? ''
    if (SKIP_DOMAINS.some(s => domain.includes(s))) continue
    return link
  }
  return null
}

const raw = readFileSync(CSV_PATH, 'utf8')
const { headers, rows } = parseCSV(raw)

const queue = rows.filter(r => !r['Email']?.includes('@') && r['Contacted']?.trim() !== 'Yes')
console.log(`Nevada operators to enrich: ${queue.length}\n`)

let found = 0
for (const row of queue) {
  process.stdout.write(`${row['Operator Name']} ... `)

  // 1. Try jetmembership
  const slug = row['Operator Name'].toLowerCase().replace(/[,.']/g, '').replace(/\s+/g, '-')
  const jmHtml = await fetchPage(`https://jetmembership.com/operators/${slug}/`)
  if (jmHtml?.includes('Operator')) {
    const { phone, email } = extractContact(jmHtml)
    if (phone && !row['Phone']) row['Phone'] = phone
    if (email) row['Email'] = email
    if (phone || email) {
      console.log(`✓ JM: ${email || phone}`)
      found++
      writeFileSync(CSV_PATH, toCSV(rows, headers), 'utf8')
      await sleep(DELAY)
      continue
    }
  }

  await sleep(1000)

  // 2. DDG search → scrape top result
  const url = await ddgSearch(row['Operator Name'])
  if (url) {
    await sleep(1200)
    const html = await fetchPage(url)
    if (html) {
      const { phone, email } = extractContact(html)
      if (phone && !row['Phone']) row['Phone'] = phone
      if (email) row['Email'] = email
      if (phone || email) {
        console.log(`✓ Web: ${email || phone}`)
        found++
        writeFileSync(CSV_PATH, toCSV(rows, headers), 'utf8')
        await sleep(DELAY)
        continue
      }
    }
  }

  console.log('—')
  await sleep(DELAY)
}

writeFileSync(CSV_PATH, toCSV(rows, headers), 'utf8')
console.log(`\nDone. Found contact for ${found}/${queue.length} operators.`)
