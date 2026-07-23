import { launch } from 'puppeteer'
import { createServer } from 'http'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = join(__dirname, '..', 'dist')
const BASENAME = '/kqcmm-web'

const routes = [
  BASENAME + '/',
  BASENAME + '/dua',
  BASENAME + '/hmk',
  BASENAME + '/sijrah-nama',
  BASENAME + '/fateha-khwani',
  BASENAME + '/khatm',
  BASENAME + '/salim-pappa',
  BASENAME + '/about',
  BASENAME + '/calendar',
  BASENAME + '/roshni',
  BASENAME + '/abbajaan',
  BASENAME + '/changelog',
]

// Static file server that handles the /kqcmm-web/ basename prefix
function startServer(port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json',
  }

  const server = createServer((req, res) => {
    // Strip the /kqcmm-web/ prefix from the URL
    let urlPath = req.url
    if (urlPath.startsWith(BASENAME)) {
      urlPath = urlPath.slice(BASENAME.length) || '/'
    }

    // Determine file path
    let filePath
    if (urlPath === '/' || !urlPath.includes('.')) {
      // SPA fallback: for any route without a file extension, serve index.html
      filePath = join(dist, 'index.html')
    } else {
      filePath = join(dist, urlPath)
    }

    try {
      const content = readFileSync(filePath)
      const ext = '.' + filePath.split('.').pop().split('?')[0]
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' })
      res.end(content)
    } catch {
      // Final fallback
      try {
        const content = readFileSync(join(dist, 'index.html'))
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(content)
      } catch {
        res.writeHead(404)
        res.end('Not found')
      }
    }
  })

  return new Promise(resolve => {
    server.listen(port, () => resolve(server))
  })
}

async function prerender() {
  console.log('Starting prerender server...')
  const server = await startServer(8090)
  console.log(`Server running on http://localhost:8090`)

  const browser = await launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  for (const route of routes) {
    const url = `http://localhost:8090${route}`
    console.log(`  Prerendering: ${route}`)

    try {
      const page = await browser.newPage()

      // Capture console logs for debugging
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`    [console.error] ${msg.text()}`)
        }
      })
      page.on('pageerror', err => {
        console.log(`    [pageerror] ${err.message}`)
      })

      // Skip splash screen during prerender
      await page.evaluateOnNewDocument(() => {
        sessionStorage.setItem('kqcmm_splash', '1')
      })

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })

      // Wait enough time for React to render and Helmet to inject tags
      await page.waitForSelector('#root', { timeout: 10000 })
      await new Promise(r => setTimeout(r, 3000))

      // Check if React rendered anything
      const rootContent = await page.evaluate(() => {
        const root = document.getElementById('root')
        return root ? root.innerHTML.substring(0, 200) : 'empty'
      })

      if (rootContent === '' || rootContent === 'empty') {
        console.log(`    ⚠ Root empty — React may not have rendered`)
      }

      const html = await page.content()
      await page.close()

      // Determine output path
      const routePath = route.replace(BASENAME + '/', '') || 'index.html'
      let finalOutputPath
      if (routePath === 'index.html') {
        finalOutputPath = join(dist, 'index.html')
      } else {
        finalOutputPath = join(dist, routePath, 'index.html')
      }

      const outDir = dirname(finalOutputPath)
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true })
      }

      writeFileSync(finalOutputPath, html)
      console.log(`  ✓ ${routePath}`)
    } catch (err) {
      console.error(`  ✗ Failed: ${route} — ${err.message}`)
    }
  }

  await browser.close()
  server.close()
  console.log('Done!')
}

prerender().catch(err => {
  console.error('Prerender failed:', err)
  process.exit(1)
})
