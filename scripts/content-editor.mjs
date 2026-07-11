#!/usr/bin/env node

/**
 * KQCMM Content Editor
 * =====================
 * node scripts/content-editor.mjs  →  http://localhost:3030
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../src/config/content')
const PORT = 3030

function readJSON(filepath) { try { return JSON.parse(fs.readFileSync(filepath,'utf8')) } catch { return null } }
function writeJSON(filepath, data) { fs.writeFileSync(filepath, JSON.stringify(data,null,2) + '\n') }
function listPages() { return fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json','')).sort() }

const HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
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
@media(max-width:700px){.sidebar{width:150px}}
</style></head><body>
<div id="app"><div class="sidebar" id="side"></div><div class="main">
<div class="tb"><span class="t" id="pt">Select a page</span><div class="lt" id="lt"></div><button class="bn bp" id="sv">Save</button></div>
<div class="ed" id="ed"></div><div class="sb" id="sb">Ready</div></div></div>
<div class="toast" id="toast"></div>
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
    const d=o.replace(/\\\\n/g,'\\n').replace(/\\n/g,'\\n'), isL=o.length>50||o.indexOf('\\n')>-1
    return '<div class="fg"><div class="fl">'+esc(p)+'</div><textarea class="ta'+(isL?'':' tc')+'" data-p="'+esc(p)+'">'+esc(d)+'</textarea></div>'
  }
  if(Array.isArray(o)){
    let h=''
    o.forEach((_,i)=>{
      const cp=p?p+'.'+i:''+i
      h+='<div class="ai"><div class="ah"><span class="an">#'+(i+1)+'</span><button class="dx" data-d="'+esc(p)+'" data-di="'+i+'">✕</button></div>'+build(o[i],cp)+'</div>'
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
  for(const k of keys){if(v==null)return''; if(typeof v==='object'&&k in v)v=v[k]; else if(Array.isArray(v)&&/^\\d+$/.test(k))v=v[parseInt(k)]; else return''}
  return typeof v==='string'?String(v):''
}
function svp(path,val){
  const keys=String(path).split('.'); let v=D[L]
  for(let i=0;i<keys.length-1;i++){const k=keys[i]; if(/^\\d+$/.test(k))v=v[parseInt(k)]; else v=v[k]}
  const last=keys[keys.length-1]
  if(/^\\d+$/.test(last))v[parseInt(last)]=val; else v[last]=val
}
document.getElementById('ed').onchange=e=>{
  if(e.target.tagName==='TEXTAREA'&&e.target.dataset.p){svp(e.target.dataset.p,e.target.value); status('Unsaved','#e67e22')}
}
document.getElementById('ed').onclick=e=>{
  // Delete
  if(e.target.dataset.d!==undefined){
    if(!confirm('Delete item '+(parseInt(e.target.dataset.di)+1)+'?'))return
    const keys=String(e.target.dataset.d).split('.'); let v=D[L]
    for(const k of keys){if(/^\\d+$/.test(k))v=v[parseInt(k)]; else v=v[k]}
    v.splice(parseInt(e.target.dataset.di),1); render(); status('Deleted, unsaved','#e67e22')
  }
  // Add
  if(e.target.dataset.a!==undefined){
    const keys=e.target.dataset.a?String(e.target.dataset.a).split('.'):[]; let v=D[L]
    for(const k of keys){if(/^\\d+$/.test(k))v=v[parseInt(k)]; else v=v[k]}
    if(v.length>0&&typeof v[0]==='object'){const t={};for(const k of Object.keys(v[0]))t[k]='';v.push(t)}
    else v.push('')
    render(); status('Added, unsaved','#e67e22')
  }
}
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

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost:' + PORT)
  if (u.pathname === '/api/pages' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(listPages().map(n => ({ name: n, title: n }))))
    return
  }
  const m = u.pathname.match(/^\/api\/page\/(.+)\.json$/)
  if (m && req.method === 'GET') {
    const d = readJSON(path.join(CONTENT_DIR, m[1] + '.json'))
    if (!d) { res.writeHead(404); res.end('{}'); return }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(d))
    return
  }
  if (m && req.method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      try {
        writeJSON(path.join(CONTENT_DIR, m[1] + '.json'), JSON.parse(body))
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }
  if (u.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(HTML)
    return
  }
  res.writeHead(404); res.end('Not found')
})

server.listen(PORT, () => console.log('\n  KQCMM Editor → http://localhost:' + PORT + '\n'))
