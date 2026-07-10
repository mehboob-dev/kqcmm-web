#!/usr/bin/env node
// Converts all src/config/content/*.json → *.js with template literals
// so you can use real line breaks when editing content.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = path.resolve(__dirname, '../src/config/content')

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))

for (const file of files) {
  const raw = fs.readFileSync(path.join(dir, file), 'utf8')
  const data = JSON.parse(raw)

  // Stringify with 2-space indent, then convert to .js with export default
  let js = 'const content = '
  js += JSON.stringify(data, null, 2)
  js += '\n\nexport default content\n'

  // Write .js file
  const jsFile = file.replace('.json', '.js')
  // Remove the .json file — we'll replace with .js
  fs.writeFileSync(path.join(dir, jsFile), js)
  // Remove old .json
  fs.unlinkSync(path.join(dir, file))

  console.log(`  ${file} → ${jsFile}`)
}

console.log('\nAll converted! Now update page imports.')
