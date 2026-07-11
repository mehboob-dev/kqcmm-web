#!/usr/bin/env node

/**
 * Sync Quran translations into content JSONs
 * ============================================
 * Maps surah references in our content files to the proper
 * English translation from Iq_en.xml (Dr. Tahir-ul-Qadri).
 *
 * Run: node scripts/sync-quran.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../src/config/content')
const QURAN_FILE = path.resolve(__dirname, '../public/quran.json')

const q = JSON.parse(fs.readFileSync(QURAN_FILE, 'utf8'))

function readJSON(f) { return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8')) }
function writeJSON(f, d) { fs.writeFileSync(path.join(CONTENT_DIR, f), JSON.stringify(d, null, 2) + '\n'); console.log('  Updated ' + f) }

function verses(suraNum, start, end) {
  const s = q[String(suraNum)]
  if (!s) return ''
  return s.v.filter(v => v.i >= start && v.i <= (end || start))
    .map(v => v.i + '. ' + v.t).join('\n')
}

function fullSurah(suraNum, maxVerses, prependBismillah = true) {
  const s = q[String(suraNum)]
  if (!s) return ''
  const vv = maxVerses ? s.v.slice(0, maxVerses) : s.v
  const lines = vv.map(v => v.t)
  // Prepend the exact Bismillah wording requested
  if (prependBismillah) {
    lines.unshift('In the Name of Allah, the Most Compassionate, the Ever-Merciful')
  }
  // Remove duplicate Bismillah from verse 1 if we just added it
  if (prependBismillah && lines.length > 1 && lines[1].match(/In the Name of Allah|Bismillah/i)) {
    lines.splice(1, 1)
  }
  return lines.join('\n')
}

// ================================================================
// 1. KHATM — update English sections with real Quran text
// ================================================================
console.log('\nSync-ing khatm.json...')
let d = readJSON('khatm.json')

const en = d.en
en.sections = en.sections.map(s => {
  const title = s.title
  // Surah Fatiha
  if (title.match(/Surah Fatiha.*1.*1.*Time/i)) {
    s.text = fullSurah(1)
  }
  // Surah Ikhlas
  else if (title.match(/Surah Ikhlas/) && title.match(/3 Times/i) && !title.match(/1010|101/)) {
    s.text = fullSurah(112)
  }
  // Surah Ikhlas - 1010 Times
  else if (title.match(/Surah Ikhlas.*1010/)) {
    s.text = fullSurah(112)
  }
  // Surah Alam Nashrah
  else if (title.match(/Alam Nashrah/)) {
    s.text = fullSurah(94)
  }
  // Surah Muzzammil
  else if (title.match(/Muzzammil/)) {
    s.text = fullSurah(73)
  }
  // Darood Sharif
  else if (title.match(/Darood Sharif/)) {
    s.text = 'ALLAH HUMA SALLE ALLAH MUHAMMADIN WA LA AALE MUHAMMAD'
  }
  return s
})

// Fix the duplicate surah fatiha sections — make them reference vs 1-7 too
for (let i = 0; i < en.sections.length; i++) {
  const s = en.sections[i]
  if (s.title.match(/Surah Fatiha.*7 Times/i)) {
    s.text = fullSurah(1)
  }
  if (s.title.match(/Surah Fatiha.*1.*Time/i) && i > 0) {
    s.text = fullSurah(1)
  }
}

// Fix the second Ikhlas (1010 Times) and third Ikhlas (3 Times closing)
for (let i = 0; i < en.sections.length; i++) {
  if (en.sections[i].title.match(/Surah Ikhlas/) && en.sections[i].title.match(/1010|101/)) {
    en.sections[i].text = fullSurah(112)
  }
  if (en.sections[i].title.match(/Surah Ikhlas.*3 Times/) && i > 5) {
    en.sections[i].text = fullSurah(112)
  }
}

writeJSON('khatm.json', d)

// ================================================================
// 2. FATEHA KHWANI — update Quran sections
// ================================================================
console.log('\nSync-ing fatehaKhwani.json...')
d = readJSON('fatehaKhwani.json')

const fEn = d.en
fEn.sections = fEn.sections.map(s => {
  const t = s.title
  if (t.match(/Surah Al-Fateha|Surah Al-Fatiha/i)) {
    s.text = fullSurah(1)
  }
  if (t.match(/Surah Ya Sin/i) && !t.match(/Ya Ya Sin/)) {
    s.text = fullSurah(36)
  }
  if (t.match(/Ayat al-Kursi|Ayatul Kursi/i)) {
    s.text = q['2'].v.find(v => v.i === 255)?.t || s.text
  }
  if (t.match(/Amanar Rasul/i)) {
    s.text = q['2'].v.filter(v => v.i >= 285 && v.i <= 286).map(v => v.i + '. ' + v.t).join('\n')
  }
  if (t.match(/Surah Al-Muzzammil/i)) {
    s.text = fullSurah(73)
  }
  if (t.match(/Surah Wadduha|Wad Duha/i)) {
    s.text = fullSurah(93)
  }
  if (t.match(/Surah Alam Nashrah|Alam Nashrah/i)) {
    s.text = fullSurah(94)
  }
  if (t.match(/Surah Ikhlas|Surah Ekhlass/i)) {
    s.text = fullSurah(112)
  }
  return s
})

writeJSON('fatehaKhwani.json', d)

console.log('\n✅ Quran sync complete!')
console.log('   quran.json also available at /quran.json for future use in-app.')
