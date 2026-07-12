#!/usr/bin/env node

/**
 * Sync hinglish (transliteration) and urdu sections for khatm + fateha
 * Run: node scripts/sync-other-langs.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../src/config/content')
const XML_DIR = 'D:/Work/KQCMM/QuranSharif-IrfanUlQuran'

function readJSON(f) { return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8')) }
function writeJSON(f, d) { fs.writeFileSync(path.join(CONTENT_DIR, f), JSON.stringify(d, null, 2) + '\n'); console.log('  Updated ' + f) }

// Manual XML parser — no dependencies, handles Unicode correctly
function parseQuranXML(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8')
  const q = {}
  const suraRegex = /<sura[^>]*?index="(\d+)"[^>]*?>([\s\S]*?)<\/sura>/gi
  let sm
  while ((sm = suraRegex.exec(raw)) !== null) {
    const suraIdx = parseInt(sm[1])
    const verses = []
    const ayaRegex = /<aya[^>]*?text="([\s\S]*?)"(?:\s*\/?>|>[\s\S]*?<\/aya>)/gi
    let am
    while ((am = ayaRegex.exec(sm[2])) !== null) {
      const idxMatch = am[0].match(/index="(\d+)"/)
      verses.push({ i: parseInt(idxMatch ? idxMatch[1] : 0), t: unescapeXml(am[1]) })
    }
    q[suraIdx] = verses
  }
  return q
}

function unescapeXml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

console.log('\nParsing XML files...')
const trans = parseQuranXML(path.join(XML_DIR, 'en_simple_transliteration1.xml'))
const ur = parseQuranXML(path.join(XML_DIR, 'iq_ur.xml'))
console.log('  Transliteration surahs:', Object.keys(trans).length)
console.log('  Urdu surahs:', Object.keys(ur).length)

const B_HINGLISH = 'Bismillaahir Rahmaanir Raheem'
const B_URDU = 'اللہ کے نام سے شروع جو نہایت مہربان ہمیشہ رحم فرمانے والا ہے۔'

function buildSuraText(qData, suraNum, maxVerses) {
  const vv = maxVerses ? qData[suraNum].slice(0, maxVerses) : qData[suraNum]
  let lines = [B_HINGLISH]
  let num = 1
  vv.forEach(v => {
    // Skip verse 1 if it's a Bismillah (for all surahs, including Fatiha)
    if (v.i === 1 && (v.t.match(/Bismillah/i) || suraNum === 1)) return
    lines.push(num + '. ' + v.t)
    num++
  })
  return lines.join('\n')
}

function buildUrduSuraText(suraNum, maxVerses) {
  const vv = maxVerses ? ur[suraNum].slice(0, maxVerses) : ur[suraNum]
  let lines = [B_URDU]
  let num = 1
  vv.forEach(v => {
    if (v.i === 1 && suraNum === 1) return
    lines.push(num + '. ' + v.t)
    num++
  })
  return lines.join('\n')
}

function getTransText(suraNum, startVerse, endVerse) {
  let vv = trans[suraNum].filter(v => v.i >= startVerse && v.i <= (endVerse || startVerse))
  let lines = [B_HINGLISH]
  let num = 1
  vv.forEach(v => {
    lines.push(num + '. ' + v.t)
    num++
  })
  return lines.join('\n')
}

function getUrduText(suraNum, startVerse, endVerse) {
  let vv = ur[suraNum].filter(v => v.i >= startVerse && v.i <= (endVerse || startVerse))
  let lines = [B_URDU]
  let num = 1
  vv.forEach(v => {
    lines.push(num + '. ' + v.t)
    num++
  })
  return lines.join('\n')
}

// ====== KHATM ======
console.log('\nUpdating khatm.json...')
let d = readJSON('khatm.json')

// Use index-based mapping for khatm (same structure across all languages)
const khatmSuraMap = [
  { idx: 0, sura: 1 },     // Surah Fatiha
  { idx: 1, sura: 112 },   // Surah Ikhlas 3 Times
  { idx: 4, sura: 1 },     // Surah Fatiha 7 Times
  { idx: 6, sura: 94 },    // Surah Alam Nashrah
  { idx: 7, sura: 112 },   // Surah Ikhlas 1010
  { idx: 8, sura: 1 },     // Surah Fatiha 7 Times (duplicate)
  { idx: 23, sura: 73 },   // Surah Muzzammil
  { idx: 25, sura: 1 },    // Surah Fatiha 1 Time (ending)
  { idx: 26, sura: 112 },  // Surah Ikhlas 3 Times (ending)
]

;['hinglish', 'urdu'].forEach(lang => {
  khatmSuraMap.forEach(m => {
    if (d[lang].sections[m.idx]) {
      d[lang].sections[m.idx].text = lang === 'urdu' ? buildUrduSuraText(m.sura) : buildSuraText(trans, m.sura)
    }
  })
})

writeJSON('khatm.json', d)

// ====== FATEHA KHWANI ======
console.log('\nUpdating fatehaKhwani.json...')
d = readJSON('fatehaKhwani.json')

// Indices are +1 from original due to inserted START EACH SURAH section at idx 3
const fatehaMap = [
  { idx: 4, sura: 1 },       // Surah Al-Fateha
  { idx: 6, sura: 36 },      // Surah Ya Sin
  { idx: 8, sura: 2, start: 255 },      // Ayat al-Kursi
  { idx: 9, sura: 2, start: 285, end: 286 },  // Amanar Rasul
  // idx 10 is the new composite surah — not mapping, its content is custom
  { idx: 11, sura: 73 },     // Surah Muzzammil
  { idx: 12, sura: 93 },     // Surah Wadduha
  { idx: 13, sura: 94 },     // Surah Ash-Sharh
  { idx: 14, sura: 102 },    // Surah At-Takathur
  { idx: 15, sura: 105 },    // Surah Al-Fil
  { idx: 16, sura: 109 },    // Surah Al-Kafirun
  { idx: 17, sura: 112 },    // Surah Al-Ikhlas
  { idx: 18, sura: 113 },    // Surah Al-Falaq
  { idx: 19, sura: 114 },    // Surah An-Nas
  { idx: 20, sura: 1 },      // Surah Al-Fateha (repeat)
]

;['hinglish', 'urdu'].forEach(lang => {
  fatehaMap.forEach(m => {
    if (d[lang].sections[m.idx]) {
      if (m.sura === 1) {
        d[lang].sections[m.idx].text = lang === 'urdu' ? buildUrduSuraText(1) : buildSuraText(trans, 1)
      } else if (m.start) {
        d[lang].sections[m.idx].text = lang === 'urdu' ? getUrduText(m.sura, m.start, m.end) : getTransText(m.sura, m.start, m.end)
      } else {
        d[lang].sections[m.idx].text = lang === 'urdu' ? buildUrduSuraText(m.sura) : buildSuraText(trans, m.sura)
      }
    }
  })
})

writeJSON('fatehaKhwani.json', d)

console.log('\n✅ Done! Hinglish (transliteration) and Urdu sections synced.')
