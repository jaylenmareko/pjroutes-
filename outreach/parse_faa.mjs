import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const __dirname = dirname(fileURLToPath(import.meta.url))
const xlsxPath = join(__dirname, 'FAA_Part135_Operators.xlsx')

const workbook = XLSX.readFile(xlsxPath)
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet)

console.log(`Total rows: ${rows.length}`)
console.log('Columns:', Object.keys(rows[0] || {}).join(', '))
console.log('Sample row:', JSON.stringify(rows[0], null, 2))

// Find state column
const stateKey = Object.keys(rows[0] || {}).find(k => k.toLowerCase().includes('state'))
const nameKey = Object.keys(rows[0] || {}).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('operator'))
const phoneKey = Object.keys(rows[0] || {}).find(k => k.toLowerCase().includes('phone'))
const emailKey = Object.keys(rows[0] || {}).find(k => k.toLowerCase().includes('email'))
const cityKey = Object.keys(rows[0] || {}).find(k => k.toLowerCase().includes('city'))

console.log('\nKey columns:', { stateKey, nameKey, phoneKey, emailKey, cityKey })

// Export all US operators with state info
const allOps = rows.map(r => ({
  name: r[nameKey] || '',
  state: r[stateKey] || '',
  city: r[cityKey] || '',
  phone: r[phoneKey] || '',
  email: r[emailKey] || '',
  cert: r['Certificate Number'] || r['Cert #'] || r['CertNo'] || '',
})).filter(r => r.name)

// Save full list
const headers = ['name','state','city','phone','email','cert']
const escape = v => String(v).includes(',') || String(v).includes('"') ? `"${String(v).replace(/"/g,'""')}"` : String(v)
const csv = [headers.join(','), ...allOps.map(r => headers.map(h => escape(r[h]||'')).join(','))].join('\n')
writeFileSync(join(__dirname, 'faa-all-operators.csv'), csv, 'utf8')
console.log(`\nSaved ${allOps.length} operators to faa-all-operators.csv`)

// Kansas only
const ks = allOps.filter(r => r.state === 'KS' || r.state === 'Kansas')
console.log(`Kansas operators: ${ks.length}`)
ks.forEach(r => console.log(`  ${r.name} | ${r.city} | ${r.phone}`))
