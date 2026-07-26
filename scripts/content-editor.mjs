#!/usr/bin/env node

/**
 * KQCMM Content Editor + Admin Panel Server
 * ============================================
 * node scripts/content-editor.mjs  →  http://localhost:3030
 *
 * Serves:
 *  - The original single-page HTML editor at /
 *  - The new React admin panel at /admin/
 *  - REST API at /api/*
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR = path.resolve(ROOT, 'src/config/content')
const STRINGS_DIR = path.resolve(ROOT, 'src/config/strings')
const NAV_FILE = path.resolve(ROOT, 'src/config/navigation.json')
const VIEW_FILE = path.resolve(ROOT, 'src/config/view.json')
const LANG_CTX_FILE = path.resolve(ROOT, 'src/context/LanguageContext.jsx')
const ADMIN_DIST = path.resolve(__dirname, 'admin/dist')
const PORT = 3030

/* ── helpers ── */
const readJSON = (fp) => { try { return JSON.parse(fs.readFileSync(fp, 'utf8')) } catch { return null } }
const writeJSON = (fp, data) => fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n')
const listPages = () => fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')).sort()
const contentType = (ext) => ({
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}[ext] || 'application/octet-stream')

/* ── TEMPLATES for new pages ── */
function generateTemplate(template, name) {
  const title = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ')
  const base = {
    en: { title: title + ' (English)', sections: [{ title: 'Section 1', text: 'Content here...' }] },
    hinglish: { title: title + ' (Hinglish)', sections: [{ title: 'Section 1', text: 'Content here...' }] },
    urdu: { title: title + ' (Urdu)', sections: [{ title: 'Section 1', text: 'Content here...' }] },
  }
  if (template === 'dua') {
    return {
      en: { title: title, quickJump: [{ label: '1st DUA', sectionIndex: 0 }], duas: [{ heading: '1st DUA', text: 'Dua text...' }] },
      hinglish: { title: title, quickJump: [{ label: '1st Dua', sectionIndex: 0 }], duas: [{ heading: '1st Dua', text: 'Dua text...' }] },
      urdu: { title: title, quickJump: [{ label: 'پہلی دعا', sectionIndex: 0 }], duas: [{ heading: 'پہلی دعا', text: 'دعا کا متن...' }] },
    }
  }
  if (template === 'fateha') {
    return {
      en: { title: title, quickJump: [{ label: 'START', sectionIndex: 0 }], sections: [{ title: 'Opening', text: 'Bismillah...\n|||\nSurah...::...\n|||\nDarood...::...' }] },
      hinglish: { title: title, quickJump: [{ label: 'Shuru', sectionIndex: 0 }], sections: [{ title: 'Shuruat', text: 'Bismillah...\n|||\nSurah...::...' }] },
      urdu: { title: title, quickJump: [{ label: 'شروع', sectionIndex: 0 }], sections: [{ title: 'شروع', text: 'بسم اللہ...\n|||\nسورہ...::...' }] },
    }
  }
  return base
}

/* ── STRINGS fallback for new lang ── */
function generateStrings(lang) {
  return {
    appName: 'KQCMM',
    tagline: 'Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya',
    nav: { home: 'Home', khatmEKhwajagan: 'Khatm-e-Khwajagan', sijrah: 'Sijrah Nama', roshni: 'Roshni', duas: 'Duas' },
    drawer: { home: 'Home', duas: 'Duas', hmk: 'Hmk', sijrahNama: 'Sijrah Nama', fatehaKhwani: 'Fateha Khwani', khatm: 'Khatm', salimPappa: 'Salim Pappa', about: 'About', calendar: 'Calendar', roshni: 'Roshni', abbajaan: 'Abbajaan', changelog: 'Changelog' },
    home: { welcome: 'Welcome to KQCMM' },
    settings: { title: 'Settings', language: 'Language', theme: 'Theme', font: 'Font', fontSize: 'Font Size', fontFamily: 'Font Family' },
    notFound: { title: '404', msg: 'Page not found', goHome: '← Go Home' },
  }
}

/* ── SEARCH ── */
function searchContent(query) {
  const q = query.toLowerCase()
  const results = []
  listPages().forEach(name => {
    const d = readJSON(path.join(CONTENT_DIR, name + '.json'))
    if (!d) return
    const hits = []
    Object.entries(d).forEach(([lang, data]) => {
      const str = JSON.stringify(data).toLowerCase()
      if (str.includes(q)) {
        // count occurrences
        let count = 0, idx = 0
        while ((idx = str.indexOf(q, idx)) !== -1) { count++; idx += q.length }
        hits.push({ lang, count })
      }
    })
    if (hits.length) results.push({ name, hits: hits.sort((a, b) => b.count - a.count) })
  })
  return results.sort((a, b) => b.hits.reduce((s, h) => s + h.count, 0) - a.hits.reduce((s, h) => s + h.count, 0))
}

/* ── MIME TYPES for admin static files ── */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

/* ── SERVER ── */
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost:' + PORT)
  const method = req.method
  const sendJSON = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }
  const sendError = (msg, status = 400) => sendJSON({ error: msg }, status)

  // ── API ROUTES ──
  if (u.pathname === '/api/pages' && method === 'GET') {
    return sendJSON(listPages().map(n => ({ name: n, title: n })))
  }

  // Search
  if (u.pathname === '/api/search' && method === 'GET') {
    const q = u.searchParams.get('q')
    if (!q) return sendJSON([])
    return sendJSON(searchContent(q))
  }

  // Get page info
  const pageInfoMatch = u.pathname.match(/^\/api\/page\/(.+)\.json\/info$/)
  if (pageInfoMatch && method === 'GET') {
    const name = pageInfoMatch[1]
    const d = readJSON(path.join(CONTENT_DIR, name + '.json'))
    if (!d) return sendError('Not found', 404)
    const langs = Object.keys(d).filter(k => typeof d[k] === 'object' && d[k] !== null && !Array.isArray(d[k]))
    return sendJSON({ name, langs, fields: Object.keys(d[langs[0]] || {}) })
  }

  // Get / save page
  const pageMatch = u.pathname.match(/^\/api\/page\/(.+)\.json$/)
  if (pageMatch && method === 'GET') {
    const d = readJSON(path.join(CONTENT_DIR, pageMatch[1] + '.json'))
    if (!d) return sendError('Not found', 404)
    return sendJSON(d)
  }
  if (pageMatch && method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        writeJSON(path.join(CONTENT_DIR, pageMatch[1] + '.json'), JSON.parse(body))
        sendJSON({ ok: true })
      } catch (e) { sendError(e.message) }
    })
    return
  }
  if (pageMatch && method === 'DELETE') {
    const fp = path.join(CONTENT_DIR, pageMatch[1] + '.json')
    if (!fs.existsSync(fp)) return sendError('Not found', 404)
    fs.unlinkSync(fp)
    return sendJSON({ ok: true })
  }

  // Create page
  if (u.pathname === '/api/page' && method === 'PUT') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        const { name, template } = JSON.parse(body)
        if (!name) return sendError('Name required')
        const fp = path.join(CONTENT_DIR, name + '.json')
        if (fs.existsSync(fp)) return sendError('Page already exists')
        writeJSON(fp, generateTemplate(template || '', name))
        sendJSON({ ok: true })
      } catch (e) { sendError(e.message) }
    })
    return
  }

  // Duplicate page
  if (u.pathname === '/api/page/duplicate' && method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        const { from, to } = JSON.parse(body)
        if (!from || !to) return sendError('from and to required')
        const src = path.join(CONTENT_DIR, from + '.json')
        if (!fs.existsSync(src)) return sendError('Source not found', 404)
        const dst = path.join(CONTENT_DIR, to + '.json')
        if (fs.existsSync(dst)) return sendError('Destination already exists')
        fs.copyFileSync(src, dst)
        sendJSON({ ok: true })
      } catch (e) { sendError(e.message) }
    })
    return
  }

  // List templates
  if (u.pathname === '/api/templates' && method === 'GET') {
    return sendJSON([
      { id: '', name: 'Plain sections' },
      { id: 'dua', name: 'Duas layout (heading + text)' },
      { id: 'fateha', name: 'Fateha layout (master-child cards)' },
    ])
  }

  // ── NAV ROUTES ──
  if (u.pathname === '/api/nav' && method === 'GET') {
    const d = readJSON(NAV_FILE) || { bottomNav: [], sideDrawer: [] }
    return sendJSON(d)
  }
  if (u.pathname === '/api/nav' && method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        writeJSON(NAV_FILE, JSON.parse(body))
        sendJSON({ ok: true })
      } catch (e) { sendError(e.message) }
    })
    return
  }

  // ── STRINGS ROUTES ──
  // List lang codes
  if (u.pathname === '/api/strings' && method === 'GET') {
    const files = fs.readdirSync(STRINGS_DIR).filter(f => f.endsWith('.json'))
    return sendJSON(files.map(f => f.replace('.json', '')))
  }
  const stringsMatch = u.pathname.match(/^\/api\/strings\/(\w+)$/)
  if (stringsMatch && method === 'GET') {
    const d = readJSON(path.join(STRINGS_DIR, stringsMatch[1] + '.json'))
    if (!d) return sendError('Not found', 404)
    return sendJSON(d)
  }
  if (stringsMatch && method === 'PUT') {
    // Create new strings file
    const lang = stringsMatch[1]
    const fp = path.join(STRINGS_DIR, lang + '.json')
    if (fs.existsSync(fp)) return sendError('Already exists')
    writeJSON(fp, generateStrings(lang))
    // Update strings/index.js
    updateStringsIndex()
    return sendJSON({ ok: true })
  }
  if (stringsMatch && method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        writeJSON(path.join(STRINGS_DIR, stringsMatch[1] + '.json'), JSON.parse(body))
        sendJSON({ ok: true })
      } catch (e) { sendError(e.message) }
    })
    return
  }
  if (stringsMatch && method === 'DELETE') {
    const fp = path.join(STRINGS_DIR, stringsMatch[1] + '.json')
    if (!fs.existsSync(fp)) return sendError('Not found', 404)
    fs.unlinkSync(fp)
    updateStringsIndex()
    return sendJSON({ ok: true })
  }

  // ── CONTENT LANGUAGE ROUTES ──
  // Add a lang to all content pages (clones from a source lang or creates empty)
  if (u.pathname === '/api/content-lang' && method === 'PUT') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        const { lang, sourceLang } = JSON.parse(body)
        if (!lang) return sendError('Language code required')
        let modified = 0
        listPages().forEach(name => {
          const fp = path.join(CONTENT_DIR, name + '.json')
          const d = readJSON(fp)
          if (!d) return
          if (d[lang]) return // already exists
          if (sourceLang && d[sourceLang]) {
            d[lang] = JSON.parse(JSON.stringify(d[sourceLang]))
          } else {
            // Create empty structure based on first available lang
            const first = Object.keys(d).find(k => typeof d[k] === 'object' && d[k] !== null && !Array.isArray(d[k]))
            if (first) d[lang] = JSON.parse(JSON.stringify(d[first]))
            else d[lang] = { title: '', sections: [] }
          }
          writeJSON(fp, d)
          modified++
        })
        // Also create strings if not exists
        const stringsFp = path.join(STRINGS_DIR, lang + '.json')
        if (!fs.existsSync(stringsFp)) {
          writeJSON(stringsFp, generateStrings(lang))
          updateStringsIndex()
        }
        // Also add to LanguageContext.jsx
        addLangToContext(lang)
        sendJSON({ ok: true, modified })
      } catch (e) { sendError(e.message) }
    })
    return
  }

  // Remove a lang from all content pages
  if (u.pathname === '/api/content-lang' && method === 'DELETE') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        const { lang } = JSON.parse(body)
        if (!lang) return sendError('Language code required')
        if (lang === 'en') return sendError('Cannot remove English')
        let modified = 0
        listPages().forEach(name => {
          const fp = path.join(CONTENT_DIR, name + '.json')
          const d = readJSON(fp)
          if (!d || !d[lang]) return
          delete d[lang]
          writeJSON(fp, d)
          modified++
        })
        // Also remove strings
        const stringsFp = path.join(STRINGS_DIR, lang + '.json')
        if (fs.existsSync(stringsFp)) {
          fs.unlinkSync(stringsFp)
          updateStringsIndex()
        }
        // Also remove from LanguageContext.jsx
        removeLangFromContext(lang)
        sendJSON({ ok: true, modified })
      } catch (e) { sendError(e.message) }
    })
    return
  }

  // ── LANGUAGE CONFIG ──
  // Read the current language list from LanguageContext.jsx
  if (u.pathname === '/api/lang-config' && method === 'GET') {
    try {
      const raw = fs.readFileSync(LANG_CTX_FILE, 'utf8')
      const m = raw.match(/const languages = \[([\s\S]*?)\]/)
      if (!m) return sendJSON([])
      const langs = [...m[1].matchAll(/\{ code:\s*'(\w+)',\s*label:\s*'([^']+)',\s*dir:\s*'(\w+)'\s*\}/g)]
        .map(m => ({ code: m[1], label: m[2], dir: m[3] }))
      return sendJSON(langs)
    } catch (e) { return sendError(e.message) }
  }
  // Save updated language list to LanguageContext.jsx
  if (u.pathname === '/api/lang-config' && method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        const langs = JSON.parse(body)
        if (!Array.isArray(langs) || !langs.length) return sendError('Invalid language list')
        const entries = langs.map(l => `  { code: '${l.code}', label: '${l.label}', dir: '${l.dir}' }`)
        const raw = fs.readFileSync(LANG_CTX_FILE, 'utf8')
        const updated = raw.replace(/const languages = \[[\s\S]*?\]/, `const languages = [\n${entries.join(',\n')},\n]`)
        fs.writeFileSync(LANG_CTX_FILE, updated)
        sendJSON({ ok: true })
      } catch (e) { sendError(e.message) }
    })
    return
  }

  // ── VIEW CONFIG ──
  if (u.pathname === '/api/view' && method === 'GET') {
    return sendJSON(readJSON(VIEW_FILE) || { defaultMode: 'list' })
  }
  if (u.pathname === '/api/view' && method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        writeJSON(VIEW_FILE, JSON.parse(body))
        sendJSON({ ok: true })
      } catch (e) { sendError(e.message) }
    })
    return
  }

  // ── ADMIN SPA ──
  if (u.pathname.startsWith('/admin/') || u.pathname === '/admin') {
    // Strip /admin prefix
    let filePath = u.pathname === '/admin' || u.pathname === '/admin/'
      ? '/index.html'
      : u.pathname.replace(/^\/admin/, '')
    const fullPath = path.join(ADMIN_DIST, filePath)
    // SPA fallback — serve index.html for any unknown path under /admin
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
      const fallback = path.join(ADMIN_DIST, 'index.html')
      if (fs.existsSync(fallback)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(fs.readFileSync(fallback))
      }
    }
    if (fs.existsSync(fullPath) && !fs.statSync(fullPath).isDirectory()) {
      const ext = path.extname(fullPath).toLowerCase()
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      return res.end(fs.readFileSync(fullPath))
    }
    res.writeHead(404)
    return res.end('Not found')
  }

  // ── ORIGINAL EDITOR (legacy) ──
  if (u.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(legacyHTML)
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

function addLangToContext(code) {
  if (!fs.existsSync(LANG_CTX_FILE)) return
  let raw = fs.readFileSync(LANG_CTX_FILE, 'utf8')
  if (raw.includes(`code: '${code}'`)) return
  const langMatch = raw.match(/const languages = \[([\s\S]*?)\]/)
  if (!langMatch) return
  const existing = langMatch[1].trim()
  const lines = existing.split('\n').map(l => l.trim()).filter(Boolean)
  const cleaned = lines.map(l => l.replace(/,\s*$/, ''))
  const newEntry = `  { code: '${code}', label: '${code}', dir: 'ltr' },`
  const formatted = [...cleaned.map(l => `  ${l},`), newEntry]
  const updated = `const languages = [\n${formatted.join('\n')}\n]`
  raw = raw.replace(/const languages = \[[\s\S]*?\]/, updated)
  fs.writeFileSync(LANG_CTX_FILE, raw)
}

function removeLangFromContext(code) {
  if (!fs.existsSync(LANG_CTX_FILE)) return
  let raw = fs.readFileSync(LANG_CTX_FILE, 'utf8')
  const langMatch = raw.match(/const languages = \[([\s\S]*?)\]/)
  if (!langMatch) return
  const entries = langMatch[1].trim()
  const lines = entries.split('\n').map(l => l.trim()).filter(Boolean)
  const kept = lines.filter(l => !l.includes(`code: '${code}'`))
  if (kept.length === lines.length) return
  // Strip trailing commas from each line and rebuild with proper indentation + commas
  const cleaned = kept.map(l => l.replace(/,\s*$/, ''))
  const formatted = cleaned.map(l => `  ${l},`)
  const updated = `const languages = [\n${formatted.join('\n')}\n]`
  raw = raw.replace(/const languages = \[[\s\S]*?\]/, updated)
  fs.writeFileSync(LANG_CTX_FILE, raw)
}

function updateStringsIndex() {
  const files = fs.readdirSync(STRINGS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
  const imports = files.map(f => `import ${f} from './${f}.json'`).join('\n')
  const map = files.map(f => `  ${f},`).join('\n')
  const content = `${imports}\n\nconst all = {\n${map}}\nconst cache = {}\n\nexport function loadStrings(lang) {\n  if (cache[lang]) return Promise.resolve(cache[lang])\n  const data = all[lang] || all.en\n  cache[lang] = data\n  return Promise.resolve(data)\n}\n\nexport function getCachedStrings(lang) {\n  return cache[lang] || all[lang] || all.en\n}\n`
  fs.writeFileSync(path.join(STRINGS_DIR, 'index.js'), content)
}

/* ── LEGACY HTML (the original single-page editor) ── */
const legacyHTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>KQCMM Editor</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,system-ui,sans-serif;background:#f5f5f5;color:#333;height:100vh;overflow:hidden}
#app{display:flex;height:100vh}
.sidebar{width:200px;background:#fff;border-right:1px solid #e0e0e0;overflow-y:auto;flex-shrink:0}
.sidebar h2{padding:14px 16px;font-size:14px;color:#7c5cfc;border-bottom:1px solid #eee}
.pl{display:block;padding:9px 16px;color:#555;font-size:13px;cursor:pointer;border:none;background:none;width:100%;text-align:left;border-left:2px solid transparent}
.pl:hover{background:#f0f0f8}
.pl.a{color:#7c5cfc;background:rgba(124,92,252,.07);border-left-color:#7c5cfc;font-weight:600}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.tb{display:flex;align-items:center;gap:10px;padding:10px 16px;background:#fff;border-bottom:1px solid #e0e0e0;flex-shrink:0;flex-wrap:wrap}
.tb .t{font-weight:600;font-size:15px;color:#222;flex:1}
.lt{display:flex;gap:3px}
.ll{padding:3px 10px;border-radius:5px;font-size:12px;cursor:pointer;border:1px solid #e0e0e0;background:transparent;color:#888}
.ll.a{background:#7c5cfc;color:#fff;border-color:#7c5cfc}
button{font-family:inherit}
.bn{padding:5px 14px;border-radius:5px;border:none;cursor:pointer;font-size:13px;font-weight:600}
.bp{background:#7c5cfc;color:#fff}
.bp:hover{background:#6a4de6}
.ed{flex:1;overflow-y:auto;padding:16px;background:#fafafa}
.fg{margin-bottom:12px}
.fl{font-size:10px;color:#888;margin-bottom:3px;text-transform:uppercase;letter-spacing:.4px;font-weight:600}
.ta{width:100%;padding:8px 10px;border-radius:5px;border:1px solid #ddd;background:#fff;color:#333;font-size:14px;font-family:inherit;min-height:80px;resize:vertical;line-height:1.5}
.ta:focus{outline:none;border-color:#7c5cfc;box-shadow:0 0 0 2px rgba(124,92,252,.12)}
.tc{min-height:36px}
.ai{background:#fff;border-radius:8px;padding:10px;margin-bottom:10px;border:1px solid #e8e8e8}
.ah{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.an{font-size:10px;color:#999;font-weight:600}
.dx{background:none;border:none;color:#e74c3c;cursor:pointer;font-size:15px;padding:0 4px;border-radius:3px}
.dx:hover{background:#fef0ef}
.ad{padding:5px 10px;border-radius:5px;border:1px dashed #ccc;background:transparent;color:#7c5cfc;cursor:pointer;font-size:12px;width:100%;margin-bottom:10px}
.ad:hover{border-color:#7c5cfc;background:rgba(124,92,252,.04)}
.sb{padding:5px 16px;background:#fff;border-top:1px solid #e0e0e0;font-size:11px;color:#999;flex-shrink:0}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:8px 20px;border-radius:6px;font-size:13px;z-index:100;display:none;box-shadow:0 3px 10px rgba(0,0,0,.12)}
.toast.s{display:block;background:#2ecc71;color:#fff}
@media(max-width:700px){.sidebar{width:150px}}hint{display:block;padding:8px 16px;font-size:11px;color:#999;border-bottom:1px solid #eee}
hint a{color:#7c5cfc;text-decoration:none;font-weight:600}
</style></head><body>
<div id="app"><div class="sidebar" id="side"></div><div class="main">
<div class="tb"><span class="t" id="pt">Select a page</span><div class="lt" id="lt"></div><button class="bn bp" id="sv">Save</button></div>
<div class="ed" id="ed"></div><div class="sb" id="sb">Ready</div></div></div>
<div class="toast" id="toast"></div>
<hint>✨ New <a href="/admin/">Admin Panel</a> available — richer editor, preview, nav &amp; strings management</hint>
<script>
let P=null, L=null, D={}
async function load(){
  const side=document.getElementById('side')
  side.innerHTML='<h2>Content</h2>'
  try {
    const r=await fetch('/api/pages'), pages=await r.json()
    if(!pages.length){side.innerHTML+='<p style="padding:16px;color:#999;font-size:13px">No files</p>';return}
    pages.forEach(p=>{
      const b=document.createElement('button')
      b.className='pl', b.textContent=p.title, b.onclick=()=>openPage(p.name)
      side.appendChild(b)
    })
    document.getElementById('sb').textContent='Select a page'
  } catch(e){side.innerHTML+='<p style="padding:16px;color:red;font-size:13px">'+e.message+'</p>'}
}
async function openPage(name){
  P=name, D=await (await fetch('/api/page/'+name+'.json')).json(), L=Object.keys(D)[0]
  renderLangs(), render(), document.getElementById('pt').textContent=name
  document.querySelectorAll('.pl').forEach(e=>e.classList.remove('a'))
  document.querySelectorAll('.pl').forEach(e=>{if(e.textContent===name)e.classList.add('a')})
  status('Editing: '+name)
}
function renderLangs(){
  const c=document.getElementById('lt')
  c.innerHTML=Object.keys(D).map(l=>'<button class="ll'+(l===L?' a':'')+'" data-l="'+l+'">'+l+'</button>').join('')
}
document.getElementById('lt').onclick=e=>{
  if(e.target.dataset.l){L=e.target.dataset.l; document.querySelectorAll('.ll').forEach(b=>b.classList.toggle('a',b.dataset.l===L)); render()}
}
function render(){
  const c=document.getElementById('ed')
  if(!L||!D[L]){c.innerHTML='<p style="color:#999;padding:20px">No content</p>';return}
  c.innerHTML=build(D[L],'')
}
function build(o,p){
  if(typeof o==='string'){
    const d=o.replace(/\\\\\\\\n/g,'\\\\n').replace(/\\\\n/g,'\\\\n'), isL=o.length>50||o.indexOf('\\\\n')>-1
    return '<div class="fg"><div class="fl">'+esc(p)+'</div><textarea class="ta'+(isL?'':' tc')+'" data-p="'+esc(p)+'">'+esc(d)+'</textarea></div>'
  }
  if(Array.isArray(o)){
    let h=''
    o.forEach((_,i)=>{
      const cp=p?p+'.'+i:''+i
      h+='<div class="ai"><div class="ah"><span class="an">#'+(i+1)+'</span><div><button class="dx" data-u="'+esc(p)+'" data-ui="'+i+'">↑</button><button class="dx" data-dn="'+esc(p)+'" data-dni="'+i+'">↓</button><button class="dx" style="color:#e74c3c" data-r="'+esc(p)+'" data-ri="'+i+'">✕</button></div></div>'+build(o[i],cp)+'</div>'
    })
    h+='<button class="ad" data-a="'+esc(p)+'">+ Add item</button>'
    return h
  }
  if(typeof o==='object'&&o!==null){return Object.entries(o).map(([k,v])=>build(v,p?p+'.'+k:k)).join('')}
  return ''
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function gvp(path){
  const keys=String(path).split('.'); let v=D[L]
  for(const k of keys){if(v==null)return''; if(typeof v==='object'&&k in v)v=v[k]; else if(Array.isArray(v)&&/^\\\\d+$/.test(k))v=v[parseInt(k)]; else return''}
  return typeof v==='string'?String(v):''
}
function svp(path,val){
  const keys=String(path).split('.'); let v=D[L]
  for(let i=0;i<keys.length-1;i++){const k=keys[i]; if(/^\\\\d+$/.test(k))v=v[parseInt(k)]; else v=v[k]}
  const last=keys[keys.length-1]
  if(/^\\\\d+$/.test(last))v[parseInt(last)]=val; else v[last]=val
}
function autoGrow(ta){ta.style.height='auto'; ta.style.height=ta.scrollHeight+'px'}
document.getElementById('ed').onchange=e=>{
  if(e.target.tagName==='TEXTAREA'&&e.target.dataset.p){svp(e.target.dataset.p,e.target.value); status('Unsaved','#e67e22')}
}
document.getElementById('ed').oninput=e=>{
  if(e.target.tagName==='TEXTAREA')autoGrow(e.target)
}
document.getElementById('ed').onclick=e=>{
  if(e.target.dataset.r!==undefined){
    if(!confirm('Delete item '+(parseInt(e.target.dataset.ri)+1)+'?'))return
    const keys=String(e.target.dataset.r).split('.'); let v=D[L]
    for(const k of keys){if(/^\\\\d+$/.test(k))v=v[parseInt(k)]; else v=v[k]}
    v.splice(parseInt(e.target.dataset.ri),1); render(); status('Deleted, unsaved','#e67e22')
  }
  if(e.target.dataset.u!==undefined){
    const i=parseInt(e.target.dataset.ui); if(i===0)return
    const keys=String(e.target.dataset.u).split('.'); let v=D[L]
    for(const k of keys){if(/^\\\\d+$/.test(k))v=v[parseInt(k)]; else v=v[k]}
    const t=v.splice(i,1)[0]; v.splice(i-1,0,t); render(); status('Moved up, unsaved','#e67e22')
  }
  if(e.target.dataset.dn!==undefined){
    const keys=String(e.target.dataset.dn).split('.'); let v=D[L]
    for(const k of keys){if(/^\\\\d+$/.test(k))v=v[parseInt(k)]; else v=v[k]}
    const i=parseInt(e.target.dataset.dni); if(i>=v.length-1)return
    const t=v.splice(i,1)[0]; v.splice(i+1,0,t); render(); status('Moved down, unsaved','#e67e22')
  }
  if(e.target.dataset.a!==undefined){
    const keys=e.target.dataset.a?String(e.target.dataset.a).split('.'):[]; let v=D[L]
    for(const k of keys){if(/^\\\\d+$/.test(k))v=v[parseInt(k)]; else v=v[k]}
    if(v.length>0&&typeof v[0]==='object'){const t={};for(const k of Object.keys(v[0]))t[k]='';v.push(t)}
    else v.push('')
    render(); status('Added, unsaved','#e67e22')
  }
}
const origRender=render; render=function(){origRender();document.querySelectorAll('.ta').forEach(autoGrow)}
document.getElementById('sv').onclick=async()=>{
  if(!P||!D)return
  document.getElementById('sv').textContent='Saving...'
  try{
    const r=await fetch('/api/page/'+P+'.json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(D)})
    if((await r.json()).ok){showToast('Saved!'); status('Saved '+new Date().toLocaleTimeString())}
  }catch(e){showToast('Error: '+e.message)}
  document.getElementById('sv').textContent='Save'
}
function showToast(m){const t=document.getElementById('toast'); t.textContent=m; t.className='toast s'; setTimeout(()=>t.classList.remove('s'),2500)}
function status(m,c){const e=document.getElementById('sb'); e.textContent=m; e.style.color=c||'#999'}
load()
</script></body></html>`

server.listen(PORT, () => {
  console.log('\n  KQCMM Editor → http://localhost:' + PORT)
  console.log('  Admin Panel    → http://localhost:' + PORT + '/admin/')
  console.log()
})
