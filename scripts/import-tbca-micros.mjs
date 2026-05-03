#!/usr/bin/env node
/**
 * Importa micronutrientes (ferro, colesterol, zinco, selênio, magnésio)
 * para alimentos já existentes em fitness_global_foods, fazendo UPDATE
 * por source_id (ID original da TBCA).
 *
 * Uso:
 *   node scripts/import-tbca-micros.mjs <input.csv> [--out=<arquivo.sql>]
 *
 * O CSV precisa ter cabeçalho com pelo menos:
 *   source_id, ferro, colesterol, zinco, selenio, magnesio
 *
 * Colunas extras são ignoradas. Valores vazios, "NA", "Tr" ou "-" viram null.
 *
 * Saída: arquivo SQL com UPDATEs em batches de 500. O usuário roda no
 * Supabase SQL editor ou via psql. NÃO modifica o banco diretamente
 * (mais seguro: o usuário revisa antes de aplicar).
 *
 * Unidades esperadas (mesma referência da TBCA, por 100g):
 *   ferro      mg
 *   colesterol mg
 *   zinco      mg
 *   selenio    µg (microgramas)
 *   magnesio   mg
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const inputPath = args.find((a) => !a.startsWith('--'))
const outArg = args.find((a) => a.startsWith('--out='))
const outputPath = outArg
  ? outArg.slice('--out='.length)
  : 'supabase/migrations/20260503_food_micronutrients_data.sql'

if (!inputPath) {
  console.error('Uso: node scripts/import-tbca-micros.mjs <input.csv> [--out=<arquivo.sql>]')
  process.exit(1)
}

// Parser CSV simples (RFC 4180-ish) — suporta vírgula, aspas duplas com escape "".
function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else {
        field += c
      }
    } else {
      if (c === '"') {
        inQuotes = true
      } else if (c === ',' || c === ';') {
        row.push(field)
        field = ''
      } else if (c === '\n') {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
      } else if (c === '\r') {
        // ignora CR (CRLF)
      } else {
        field += c
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function parseNum(raw) {
  if (raw == null) return null
  const v = String(raw).trim().toLowerCase()
  if (!v || v === 'na' || v === 'tr' || v === '-' || v === 'nd') return null
  // TBCA usa vírgula como separador decimal. Aceita os dois.
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}

function escapeSqlLiteral(value) {
  if (value == null) return 'NULL'
  if (typeof value === 'number') return value.toString()
  return `'${String(value).replace(/'/g, "''")}'`
}

const csvText = readFileSync(resolve(inputPath), 'utf8')
const rows = parseCSV(csvText).filter((r) => r.length > 0 && r.some((c) => c.trim()))

if (rows.length < 2) {
  console.error('CSV vazio ou sem linhas de dados.')
  process.exit(1)
}

const header = rows[0].map((h) => h.trim().toLowerCase())
const idx = {
  source_id: header.indexOf('source_id'),
  ferro: header.indexOf('ferro'),
  colesterol: header.indexOf('colesterol'),
  zinco: header.indexOf('zinco'),
  selenio: header.indexOf('selenio'),
  magnesio: header.indexOf('magnesio'),
}

if (idx.source_id < 0) {
  console.error('Cabeçalho precisa conter a coluna "source_id".')
  process.exit(1)
}

const dataRows = rows.slice(1)
const stats = { total: 0, updates: 0, semDados: 0, semSourceId: 0 }
const updates = []

for (const r of dataRows) {
  stats.total++
  const sourceId = (r[idx.source_id] || '').trim()
  if (!sourceId) {
    stats.semSourceId++
    continue
  }
  const ferro      = idx.ferro      >= 0 ? parseNum(r[idx.ferro])      : null
  const colesterol = idx.colesterol >= 0 ? parseNum(r[idx.colesterol]) : null
  const zinco      = idx.zinco      >= 0 ? parseNum(r[idx.zinco])      : null
  const selenio    = idx.selenio    >= 0 ? parseNum(r[idx.selenio])    : null
  const magnesio   = idx.magnesio   >= 0 ? parseNum(r[idx.magnesio])   : null

  // Pula se nenhum micro tem valor — UPDATE seria no-op.
  if (ferro == null && colesterol == null && zinco == null && selenio == null && magnesio == null) {
    stats.semDados++
    continue
  }

  updates.push({ sourceId, ferro, colesterol, zinco, selenio, magnesio })
  stats.updates++
}

// Gera o SQL em batches de 500 UPDATEs por bloco — evita um único transação
// gigante e facilita re-execução se algum batch falhar.
const BATCH = 500
const sqlParts = []
sqlParts.push('-- ============================================================')
sqlParts.push('-- IMPORT DE MICRONUTRIENTES NA TBCA')
sqlParts.push(`-- Gerado em ${new Date().toISOString()} a partir de ${inputPath}`)
sqlParts.push(`-- Total de updates: ${stats.updates}`)
sqlParts.push('-- Idempotente: roda múltiplas vezes sem efeito colateral.')
sqlParts.push('-- ============================================================')
sqlParts.push('')

for (let i = 0; i < updates.length; i += BATCH) {
  const batch = updates.slice(i, i + BATCH)
  sqlParts.push(`-- Batch ${i / BATCH + 1} (${batch.length} alimentos)`)
  sqlParts.push('BEGIN;')
  for (const u of batch) {
    const sets = [
      `ferro = ${escapeSqlLiteral(u.ferro)}`,
      `colesterol = ${escapeSqlLiteral(u.colesterol)}`,
      `zinco = ${escapeSqlLiteral(u.zinco)}`,
      `selenio = ${escapeSqlLiteral(u.selenio)}`,
      `magnesio = ${escapeSqlLiteral(u.magnesio)}`,
    ].join(', ')
    sqlParts.push(
      `UPDATE fitness_global_foods SET ${sets} WHERE source = 'tbca' AND source_id = ${escapeSqlLiteral(u.sourceId)};`
    )
  }
  sqlParts.push('COMMIT;')
  sqlParts.push('')
}

writeFileSync(resolve(outputPath), sqlParts.join('\n'))

console.log('--- IMPORT TBCA MICROS ---')
console.log(`Linhas lidas:           ${stats.total}`)
console.log(`Updates gerados:        ${stats.updates}`)
console.log(`Pulados (sem dados):    ${stats.semDados}`)
console.log(`Pulados (sem source_id):${stats.semSourceId}`)
console.log(`SQL gerado em:          ${outputPath}`)
console.log('Revise o arquivo e rode no Supabase SQL editor.')
