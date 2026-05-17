import { readFileSync, writeFileSync } from 'fs'

const RESEND_API_KEY = '***REMOVED***'
const FROM = 'Jaylen Davis <jaylen@pjroutes.com>'
const BATCH_SIZE = 50   // send 50 today, run again tomorrow for the rest
const DELAY_MS = 1500   // 1.5s between sends to avoid spam flags

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_PATH = join(__dirname, 'tier1-operators-enriched.csv')

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim())
  const headers = parseRow(lines[0])
  return lines.slice(1).map(line => {
    const vals = parseRow(line)
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
}

function parseRow(line) {
  const result = []
  let cur = '', inQuote = false
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote }
    else if (ch === ',' && !inQuote) { result.push(cur.trim()); cur = '' }
    else cur += ch
  }
  result.push(cur.trim())
  return result
}

function toCSV(rows, headers) {
  const escape = v => v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h] ?? '')).join(','))].join('\n')
}

function buildEmail(company) {
  return `Hey there,

I run PJRoutes.com — a marketplace built specifically for empty leg flights.

You set your price. We list it, handle booking, and collect payment from the passenger. You confirm, get paid, and fly. We add a 25% fee on top — the customer pays it, not you.

Would you be open to a quick 5-minute call this week?

— Jaylen Davis
PJRoutes
jaylen@pjroutes.com
314-503-9422
pjroutes.com`
}

async function sendEmail(to, company) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: 'Empty legs sitting on your schedule?',
      text: buildEmail(company),
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || JSON.stringify(data))
  return data.id
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

const raw = readFileSync(CSV_PATH, 'utf8')
const rows = parseCSV(raw)
const headers = Object.keys(rows[0])

const queue = rows.filter(r => r['Email']?.includes('@') && r['Contacted']?.trim() === 'No')
const batch = queue.slice(0, BATCH_SIZE)

console.log(`Total unsent: ${queue.length} | Sending now: ${batch.length}`)

let sent = 0, failed = 0
for (const row of batch) {
  try {
    const id = await sendEmail(row['Email'].trim(), row['Operator Name'])
    row['Contacted'] = 'Yes'
    row['Notes'] = `Sent ${new Date().toISOString().slice(0,10)} | id:${id}`
    sent++
    console.log(`✓ ${row['Email']} (${row['Operator Name']})`)
  } catch (err) {
    failed++
    row['Notes'] = `Error: ${err.message}`
    console.error(`✗ ${row['Email']} — ${err.message}`)
  }
  await sleep(DELAY_MS)
}

writeFileSync(CSV_PATH, toCSV(rows, headers), 'utf8')
console.log(`\nDone. Sent: ${sent} | Failed: ${failed} | Remaining: ${queue.length - sent}`)
