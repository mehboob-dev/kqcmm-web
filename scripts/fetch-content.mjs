#!/usr/bin/env node

/**
 * KQCMM Content Fetcher
 * ======================
 * Fetches HTML pages from Firebase Hosting and extracts ALL content
 * preserving multi-line text within each collapsible section.
 *
 * Usage:  node scripts/fetch-content.mjs
 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../src/config/content')
const HOST = 'kqcmm-7d71b.web.app'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'KQCMM-Fetcher/1.0' } }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

function readJSON(filepath) {
  try { return JSON.parse(fs.readFileSync(filepath, 'utf8')) } catch { return null }
}

function writeJSON(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n')
  console.log(`  ✓ Updated ${path.basename(filepath)}`)
}

/** Strip tags but keep line structure */
function textPreserveLines(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&rsquo;/gi, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/&ndash;/gi, '–')
    .replace(/\n +/g, '\n')
    .replace(/ +\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Extract full content of collapsible sections */
function extractCollapsibles(html) {
  const items = []
  // Match <li> containing collapsible-header and collapsible-body
  const blockRe = /<li>[\s\S]*?<div class="collapsible-header"[^>]*>[\s\S]*?<i[^>]*>.*?<\/i>\s*(.+?)<\/div>[\s\S]*?<div class="collapsible-body">([\s\S]*?)<\/div>\s*<\/li>/gi
  let m
  while ((m = blockRe.exec(html)) !== null) {
    const title = textPreserveLines(m[1]).replace(/\s+/g, ' ')
    const body = textPreserveLines(m[2])
    items.push({ title, body })
  }
  return items
}

/** Extract text from <div dir="ltr"> blocks */
function extractLtrDivs(html) {
  const divs = []
  const re = /<div dir="ltr">([\s\S]*?)<\/div>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    divs.push(textPreserveLines(m[1]))
  }
  return divs
}

/** Extract <p> tag text */
function paragraphs(html) {
  const ps = []
  const re = /<p>(.*?)<\/p>/gs
  let m
  while ((m = re.exec(html)) !== null) {
    const t = textPreserveLines(m[1])
    if (t.length > 10) ps.push(t)
  }
  return ps
}

/** Raw body text */
function bodyText(html) {
  const b = html.match(/<body>([\s\S]*?)<\/body>/i)
  return b ? textPreserveLines(b[1]) : textPreserveLines(html)
}

// ---------------------------------------------------------------------------
// Page parsers
// ---------------------------------------------------------------------------

function parseDua(html) {
  return extractCollapsibles(html).map(item => ({
    heading: item.title,
    text: item.body,
  }))
}

function parseKhatm(html) {
  return extractCollapsibles(html).map((item, i) => `${i + 1}. ${item.title}`).join('\n')
}

function parseSijrah(html) {
  return extractCollapsibles(html).map(item => ({ title: item.title, text: item.body }))
}

function parseFateha(html) {
  return extractCollapsibles(html).map(item => ({ title: item.title, text: item.body }))
}

function parseRoshni(html) {
  return extractCollapsibles(html).map(item => ({ title: item.title, text: item.body }))
}

function parseAbout(html) {
  const items = extractCollapsibles(html)
  if (items.length) return { intro: items[0]?.body || '', items }
  return { intro: bodyText(html), items: [] }
}

function parseAbbajaan(html) {
  const items = extractCollapsibles(html)
  if (items.length) return items
  return paragraphs(html).map(p => ({ title: '', body: p }))
}

function parseHmk(html) {
  // hmk page has a tree structure, not collapsible
  const ps = paragraphs(html)
  return ps
}

// ---------------------------------------------------------------------------
// Update a single content file
// ---------------------------------------------------------------------------

async function updateContent(page, filename, parser, buildEnglish) {
  const url = `https://${HOST}/${page}`
  process.stdout.write(`  ${url}... `)
  const html = await fetch(url).catch(() => null)
  if (!html) { console.log(`✗ failed`); return }

  const parsed = parser(html)
  const filepath = path.join(CONTENT_DIR, filename)
  const existing = readJSON(filepath) || {}

  existing.en = buildEnglish(parsed, existing.en || {})

  writeJSON(filepath, existing)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('KQCMM Content Fetcher — pulling full content from Firebase Hosting\n')

  await updateContent('dua.html', 'dua.json', parseDua, (parsed) => ({
    title: 'Duas (Supplications)',
    duas: parsed,
  }))

  await updateContent('hmk.html', 'hmk.json', parseHmk, (parsed, prev) => ({
    title: 'Hajee Mahboob Kassim',
    intro: prev.intro || '',
    paragraphs: parsed,
  }))

  await updateContent('khatm_e_khwajagan.html', 'khatm.json', parseKhatm, (parsed, prev) => ({
    title: 'Khatm-e-Khwajagan',
    intro: prev.intro || 'Khatm-e-Khwajagan is a special collective dhikr performed in the Chishti tradition.',
    structure: { title: 'Structure of Khatm', text: parsed },
    masters: prev.masters || { title: 'The Khwajagan', text: 'The Khwajagan are the spiritual chain of the Chishti order.' },
  }))

  await updateContent('sijrah_nama.html', 'sijrahNama.json', parseSijrah, (parsed, prev) => ({
    title: 'Sijrah Nama',
    intro: prev.intro || '',
    verses: parsed,
  }))

  await updateContent('fateha_khwani.html', 'fatehaKhwani.json', parseFateha, (parsed) => ({
    title: 'Fateha Khwani',
    intro: '',
    sections: parsed,
  }))

  await updateContent('roshni.html', 'roshni.json', parseRoshni, (parsed) => ({
    title: 'Roshni (Chirag Raushan)',
    sections: parsed,
  }))

  await updateContent('about.html', 'about.json', parseAbout, (parsed) => ({
    title: 'About KQCMM',
    intro: parsed.intro,
    sections: parsed.items,
  }))

  await updateContent('abbajaan.html', 'abbajaan.json', parseAbbajaan, (parsed) => ({
    title: 'Abbajaan',
    sections: Array.isArray(parsed) ? parsed.map(p => ({ title: '', text: p })) : parsed,
  }))

  await updateContent('salim_pappa_hindi.html', 'salimPappa.json', parseHmk, (parsed, prev) => ({
    title: 'Salim Pappa',
    intro: prev.intro || '',
    paragraphs: parsed,
  }))

  await updateContent('calendar.html', 'calendar.json', (html) => {
    const items = extractCollapsibles(html)
    return items.map(item => ({ title: item.title, desc: item.body }))
  }, (parsed, prev) => ({
    title: 'Islamic Calendar',
    events: parsed.length ? parsed : prev.events,
  }))

  console.log('\n✅ Done! English sections updated with full content from Firebase Hosting.')
}

main().catch(console.error)
