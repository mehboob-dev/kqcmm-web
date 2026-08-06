#!/usr/bin/env node
/**
 * Import the Hajee Mahboob Kassim books into the app's content folders.
 *
 * Reads the 9 clean sources (docx + pdf) from `D:\Work\KQCMM\Content\Books`,
 * extracts paragraph text, auto-splits into chapters (v1: headings where
 * detected, else numbered chunks), and writes:
 *   - src/config/content/en/books/{slug}.json       (full book)
 *   - src/config/content/en/books/_index.json       (book registry)
 *   - src/config/content/hinglish/books/_index.json (registry shell)
 *
 * Hinglish books intentionally have NO per-book file — the loader falls back to
 * en/. Empty `{}` shells are never written (they trip a Vite dedup-chunk bug
 * that breaks hydration).
 *
 * The 3 legacy .doc (OLE2) books are held back (status "coming-soon") until
 * converted. See docs/books.md for the full design.
 *
 * Usage:
 *   node scripts/import-books.mjs                # import all 9
 *   node scripts/import-books.mjs --dry-run      # print what would happen
 *   node scripts/import-books.mjs --reindex      # only rebuild _index.json
 */
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const ROOT = path.resolve(__dirname, '..')
const BOOKS_SRC = process.env.KQCMM_BOOKS_DIR || 'D:/Work/KQCMM/Content/Books'
const CONTENT_DIR = path.resolve(ROOT, 'src/config/content')
const EN_BOOKS_DIR = path.join(CONTENT_DIR, 'en', 'books')
const HINGLISH_BOOKS_DIR = path.join(CONTENT_DIR, 'hinglish', 'books')

const CHUNK_WORDS = 800      // auto-split threshold
const HEADING_MAX_WORDS = 12
const KNOWN_HEADING_RE = /^(about the author|chapter|part|section|contents|introduction|foreword|preface|conclusion|index|appendix|dedication)/i

// ── BOOKS TABLE ────────────────────────────────────────────────────────────────
// Deterministic slug / title / cover / description per source file. Add/remove
// here and re-run to change what's shipped. `.doc` books are "coming-soon".
const BOOKS = [
  { file: 'What-is-Hazrat-Muhammad.docx', slug: 'what-is-hazrat-muhammad', title: 'What is Hazrat Muhammad', cover: '#2e7d32', description: 'An introduction to the Prophethood of the Divine Creator, and how the signs of the Prophet Muhammad (peace be upon him) were foretold.' },
  { file: 'GOD SAID LET THERE BE LIGHT.docx', slug: 'god-said-let-there-be-light', title: 'God Said: Let There Be Light', cover: '#b8860b', description: 'The divine light of creation and its place in the Islamic worldview.' },
  { file: 'OH LIGHT ! GUIDE US THROUGH NUCLEAR HOLOCAUST.docx', slug: 'oh-light-guide-us-through-nuclear-holocaust', title: 'Oh Light! Guide Us Through Nuclear Holocaust', cover: '#c2185b', description: 'A spiritual appeal for guidance through the perils of the modern age.' },
  { file: 'Pappa - Meraj un Nabi.docx', slug: 'meraj-un-nabi', title: 'Meraj un Nabi', cover: '#3f3aa8', description: 'The night journey of the Holy Prophet Muhammad (peace be upon him) to Heaven and his meeting with Allah.' },
  { file: 'THE PANJATAN PAK AND WASILAH IN THE LIGHT OF THE QUR\'AN.docx', slug: 'panjatan-pak-and-wasilah', title: 'The Panjatan Pak and Wasilah in the Light of the Qur\'an', cover: '#0f766e', description: 'The Holy Five (Ahl al-Kisa) and the concept of wasilah (intercession) as shown in the Qur\'an.' },
  { file: 'MiladunNabi.pdf', slug: 'milad-un-nabi', title: 'Milad un Nabi', cover: '#2e7d32', description: 'The birth and celebration of the Holy Prophet Muhammad (peace be upon him).' },
  { file: 'Pappa - Lailatul_Qadar[1].pdf', slug: 'lailatul-qadar', title: 'Lailatul Qadar', cover: '#4f3fd1', description: 'The Night of Power — its virtues, signs, and blessings.' },
  { file: 'Pappa-Panjatan Pak and Wasilah in the Quran.pdf', slug: 'panjatan-pak-wasilah-in-quran', title: 'Panjatan Pak and Wasilah in the Quran', cover: '#0f766e', description: 'The Holy Five and wasilah in the Qur\'an (companion volume).' },
  { file: 'THE ORIGINAL TEACHINGS OF JESUS.pdf', slug: 'original-teachings-of-jesus', title: 'The Original Teachings of Jesus', cover: '#9d2b4a', description: 'An Islamic exposition of the original teachings of Jesus, peace be upon him.' },
  // v2 — legacy .doc, held back until converted
  { file: 'Pappa-ISLAM-MILADUNNabi.doc', slug: 'islam-milad-un-nabi', title: 'Islam Milad un Nabi', cover: '#2e7d32', description: '', status: 'coming-soon' },
  { file: 'Pappa-MaulaAli.doc', slug: 'maula-ali', title: 'Maula Ali', cover: '#4f3fd1', description: '', status: 'coming-soon' },
  { file: 'Talaq Talaq Talaq- In the light of Quran & Hadiths.doc', slug: 'talaq-talaq-talaq', title: 'Talaq, Talaq, Talaq', cover: '#b8860b', description: '', status: 'coming-soon' },
]

// ── helpers ────────────────────────────────────────────────────────────────────
const readJSON = (fp) => { try { return JSON.parse(fs.readFileSync(fp, 'utf8')) } catch { return null } }
const writeJSON = (fp, data) => { fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n') }

function slugify(s) {
  return String(s).toLowerCase()
    .replace(/[']/g, '')               // apostrophes
    .replace(/[^a-z0-9]+/g, '-')       // non-alnum → dash
    .replace(/^-+|-+$/g, '')           // trim dashes
    .replace(/-{2,}/g, '-')
}

function wordCount(s) { return String(s).trim().split(/\s+/).filter(Boolean).length }

// ── extraction ──────────────────────────────────────────────────────────────────

/** Extract paragraphs from a .docx (zip → word/document.xml → <w:t> runs). */
function extractDocx(filePath) {
  const xml = execFileSync('unzip', ['-p', filePath, 'word/document.xml'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  const paras = []
  // Each <w:p ...>...</w:p> is a paragraph.
  const re = /<w:p[ >].*?<\/w:p>/g
  let m
  while ((m = re.exec(xml))) {
    const block = m[0]
    let text = ''
    const runRe = /<w:t[^>]*>(.*?)<\/w:t>/g
    let r
    while ((r = runRe.exec(block))) text += r[1]
    // Decode XML entities, collapse internal whitespace to single spaces.
    text = text
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ').trim()
    if (text) paras.push(text)
  }
  return paras
}

/** Extract paragraphs from a .pdf via the python helper (pymupdf). */
function extractPdf(filePath) {
  const py = path.join(__dirname, 'extract-pdf.py')
  // Large books (483 pp / ~800k chars) exceed the default 1MB stdout buffer.
  const out = execFileSync('python', [py, filePath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).trim()
  return JSON.parse(out)
}

function extractParagraphs(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.docx') return extractDocx(filePath)
  if (ext === '.pdf') return extractPdf(filePath)
  throw new Error(`Unsupported format for extraction: ${ext} (${path.basename(filePath)})`)
}

// ── auto-split ──────────────────────────────────────────────────────────────────

// Repeating PDF running-header / footer lines seen across many pages. These
// are noise, not headings — dropping them keeps page breaks from spawning
// phantom chapters.
const NOISE_LINES = new Set([
  'MILAD UN NABI',
  'KHANQAH QADRIYA CHISHTIYA MUSHARRAFIYA',
  'ISRIS INSTITUTE OF SUFI RESEARCHES AND ISLAMIC STUDIES',
  'AUTHORS: HAJEE MAHBOOB KASSIM',
  'HAJEE MAHBOOB KASSIM',
  'CONTENTS',
  'NO PERMISSION REQUIRED',
])

function isNoise(p) {
  if (/^\d+$/.test(p)) return true                            // bare page number
  if (NOISE_LINES.has(p)) return true                          // known header/footer
  if (/^khanqah|^20, royd street|^published in|^issued on/i.test(p)) return true // address/colophon
  if (/^[ivxlc]+$/i.test(p)) return true                       // bare roman numeral page
  return false
}

function isTocLine(p) {
  // CONTENTS-page lines, e.g. "12. MUHAMMAD UPON BIRTH WORSHIPS ALLAH ... 99"
  // (with dotted leaders) or "2. Nimrod—the genius mastermind 9" (page number
  // without leaders). Both patterns belong to the TOC, not the body.
  if (/^\d+\.\s/.test(p) && /[. ]{5,}\d+$/.test(p)) return true        // dotted leaders
  if (/^\d{1,2}\.\s.{2,50}\s\d{1,3}$/.test(p)) return true              // "N. Title page"
  if (/^PART\s+\d/.test(p)) return true                                  // TOC PART lines
  return false
}

function isHeading(p) {
  if (wordCount(p) > HEADING_MAX_WORDS) return false
  if (isNoise(p)) return false
  if (KNOWN_HEADING_RE.test(p)) return true
  if (/^[^a-z]{0,2}[A-Z][A-Z0-9 .:'"-]{2,}$/.test(p)) return true   // mostly-uppercase
  if (/[:;]$/.test(p)) return true                                  // ends with colon
  if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\.?\s/.test(p)) return true  // roman numeral
  return false
}

/**
 * Turn a flat paragraph list into chapters.
 *
 * v1 auto-split strategy:
 *   - Noise (page numbers, repeating headers/footers, TOC lines) is dropped.
 *   - A clean, short uppercase/known heading line starts a new chapter with
 *     that heading. This works well for the .docx books (real headings like
 *     "WHAT IS MUHAMMAD") and the simpler PDFs.
 *   - Otherwise prose is cut into ~CHUNK_WORDS numbered sections ("Section N").
 *
 * Every produced chapter is marked isAuto: true — the admin Books editor is
 * the tool to merge/rename these into real chapters later. The auto-split is a
 * starting point, not a final structure (see docs/books.md §4.3).
 */
function splitChapters(paras, detectHeadings = true) {
  const clean = paras.filter((p) => !isNoise(p) && !isTocLine(p))
  const chapters = []
  let cur = null
  let pendingHeading = null

  const flush = () => {
    if (cur && (cur.heading || cur.paragraphs.length)) {
      chapters.push(cur)
    }
    cur = null
  }
  const ensure = () => {
    if (!cur) {
      cur = { heading: pendingHeading || `Section ${chapters.length + 1}`, isAuto: true, paragraphs: [] }
      pendingHeading = null
    }
  }

  let sectionWord = 0
  for (const p of clean) {
    if (detectHeadings && isHeading(p)) {
      // A heading with no body yet starts a chapter; if we were mid-chapter,
      // flush and start fresh with this as the new heading.
      flush()
      pendingHeading = p
      cur = null
      sectionWord = 0
      continue
    }
    ensure()
    // Auto-chunk: if the current chapter is an auto section (no real heading)
    // and exceeds the threshold, close it and start the next numbered section.
    const w = wordCount(p)
    if (cur.isAuto && /^Section \d+$/.test(cur.heading) && sectionWord + w > CHUNK_WORDS && cur.paragraphs.length) {
      flush()
      pendingHeading = null
      ensure()
      sectionWord = 0
    }
    cur.paragraphs.push(p)
    sectionWord += w
  }
  flush()
  // A trailing heading with no body still becomes a (heading-only) chapter.
  if (pendingHeading) {
    chapters.push({ heading: pendingHeading, isAuto: true, paragraphs: [] })
  }
  return chapters
}

// ── build + emit ────────────────────────────────────────────────────────────────

function buildBook(book, paras, { detectHeadings = true } = {}) {
  return {
    title: book.title,
    author: 'Hajee Mahboob Kassim',
    description: book.description || '',
    cover: book.cover || '#4a6cf7',
    chapters: splitChapters(paras, detectHeadings),
  }
}

function registryEntries(books) {
  return books.map((b) => {
    const entry = {
      slug: b.slug,
      title: b.title,
      author: 'Hajee Mahboob Kassim',
      description: b.description || '',
      cover: b.cover || '#4a6cf7',
      status: b.status || 'live',
    }
    if (b.status !== 'coming-soon') {
      const fp = path.join(EN_BOOKS_DIR, b.slug + '.json')
      const data = readJSON(fp)
      entry.chapterCount = (data && data.chapters) ? data.chapters.length : 0
    }
    return entry
  })
}

function importAll({ dryRun = false } = {}) {
  if (!fs.existsSync(BOOKS_SRC)) throw new Error(`Books source dir not found: ${BOOKS_SRC}`)
  const live = BOOKS.filter((b) => (b.status || 'live') === 'live')
  const done = []

  for (const book of live) {
    const srcPath = path.join(BOOKS_SRC, book.file)
    if (!fs.existsSync(srcPath)) {
      console.warn(`  ⚠ missing source: ${book.file} — skipping`)
      continue
    }
    const paras = extractParagraphs(srcPath)
    // .docx has clean, human-authored heading structure we can trust. .pdf text
    // blocks are page-fragment noisy (running headers, numbered lists, TOC), so
    // for PDFs we chunk into fixed-size sections rather than guess headings —
    // the admin Books editor is the curation tool (docs/books.md §4.3).
    const detectHeadings = path.extname(book.file).toLowerCase() === '.docx'
    const bookJson = buildBook(book, paras, { detectHeadings })
    const enPath = path.join(EN_BOOKS_DIR, book.slug + '.json')
    if (dryRun) {
      console.log(`  [dry] ${book.file} -> ${book.slug}.json (${bookJson.chapters.length} chapters, ${paras.length} paras)`)
    } else {
      writeJSON(enPath, bookJson)
      // NO hinglish shell file. Hinglish books rely on the loader's fallback to
      // en/ (missing file -> en). Empty `{}` shells must NOT be written: Vite
      // dedupes identical empty JSON into a shared chunk that breaks hydration
      // (React #418/#423) when the glob loader tries to consume it as data.
      console.log(`  ✓ ${book.slug}.json (${bookJson.chapters.length} chapters)`)
    }
    done.push(book.slug)
  }

  // Registry for both languages.
  const enIndex = { books: registryEntries(BOOKS) }
  const hiIndex = { books: BOOKS.map((b) => ({ slug: b.slug, title: b.title, status: b.status || 'live' })) }
  if (!dryRun) {
    writeJSON(path.join(EN_BOOKS_DIR, '_index.json'), enIndex)
    writeJSON(path.join(HINGLISH_BOOKS_DIR, '_index.json'), hiIndex)
    console.log(`  ✓ _index.json (${enIndex.books.length} books)`)
  }
  console.log(`\n${done.length} books imported${dryRun ? ' (dry-run, nothing written)' : ''}`)
}

// ── CLI ─────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
if (args.includes('--dry-run')) {
  importAll({ dryRun: true })
} else if (args.includes('--reindex')) {
  // Only rebuild the registry from existing content files.
  const live = BOOKS.filter((b) => fs.existsSync(path.join(EN_BOOKS_DIR, b.slug + '.json')))
    .map((b) => ({ ...b, status: 'live' }))
  const all = BOOKS.map((b) => live.some((l) => l.slug === b.slug) ? { ...b, status: 'live' } : b)
  writeJSON(path.join(EN_BOOKS_DIR, '_index.json'), { books: registryEntries(all) })
  writeJSON(path.join(HINGLISH_BOOKS_DIR, '_index.json'), { books: all.map((b) => ({ slug: b.slug, title: b.title, status: b.status })) })
  console.log('Reindexed', all.length, 'books')
} else {
  importAll()
}
