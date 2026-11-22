/**
 * Send outreach to Nevada operators with emails
 */

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_PATH = join(__dirname, 'nevada-operators.csv')
const RESEND_API_KEY = process.env.RESEND_API_KEY
if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY env var is not set')
const FROM = 'Jaylen Davis <jaylen@pjroutes.com>'
const DELAY_MS = 1500

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
  const escape = v => (String(v||'').includes(',') || String(v||'').includes('"')) ? `"${String(v||'').replace(/"/g,'""')}"` : String(v||'')
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n')
}

function buildEmail(name) {
  const firstName = name.split(' ')[0]
  return `Hey ${firstName},

I list empty legs for Part 135 operators at pjroutes.com. You set the price, we add 25% on top — customer pays it, not you.

Open to a quick call?

— Jaylen Davis · pjroutes.com · 314-503-9422`
}

async function sendEmail(to, name) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM, to,
      subject: 'Empty legs sitting on your schedule?',
      text: buildEmail(name),
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || JSON.stringify(data))
  return data.id
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

const raw = readFileSync(CSV_PATH, 'utf8')
const { headers, rows } = parseCSV(raw)

const queue = rows.filter(r =>
  r['Email']?.includes('@') &&
  r['Contacted']?.trim() !== 'Yes'
)

console.log(`Nevada send queue: ${queue.length}`)
queue.forEach(r => console.log(` - ${r['Operator Name']} <${r['Email']}>`))
console.log()

let sent = 0, failed = 0
for (const row of queue) {
  try {
    const id = await sendEmail(row['Email'].trim(), row['Operator Name'])
    row['Contacted'] = 'Yes'
    row['Notes'] = `Sent ${new Date().toISOString().slice(0,10)} | id:${id}`
    sent++
    console.log(`✓ ${row['Email']} (${row['Operator Name']})`)
  } catch (err) {
    failed++
    console.error(`✗ ${row['Email']} — ${err.message}`)
  }
  writeFileSync(CSV_PATH, toCSV(rows, headers), 'utf8')
  await sleep(DELAY_MS)
}

console.log(`\nDone. Sent: ${sent} | Failed: ${failed}`)
