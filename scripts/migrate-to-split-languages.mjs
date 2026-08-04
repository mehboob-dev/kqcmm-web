// NOTE: This is a one-shot, run-once migration script.
// It has already been run to split content files into locale folders.
// Re-running it will result in errors since the original flat files no longer exist at the root.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR = path.resolve(ROOT, 'src/config/content')

const activeLangs = ['en', 'hinglish']

function runMigration() {
  console.log('Starting migration to split-language folders...')

  // Create directories
  activeLangs.forEach(lang => {
    const dir = path.join(CONTENT_DIR, lang)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`Created directory: ${dir}`)
    }
  })

  // List all original json files in root CONTENT_DIR
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.json'))

  files.forEach(file => {
    const name = file.replace('.json', '')
    const filePath = path.join(CONTENT_DIR, file)
    console.log(`Processing: ${file}`)

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    if (name === 'calendar') {
      // Special Calendar split
      // English
      const enCal = {
        schemaVersion: data.schemaVersion,
        monthStarts: data.monthStarts,
        monthNames: data.monthNames?.en || [],
        monthNamesShort: data.monthNamesShort?.en || [],
        events: (data.events || []).map(ev => {
          const copy = { ...ev }
          delete copy.translations
          return copy
        })
      }
      fs.writeFileSync(
        path.join(CONTENT_DIR, 'en', 'calendar.json'),
        JSON.stringify(enCal, null, 2) + '\n'
      )

      // Hinglish
      const hinglishCal = {
        schemaVersion: data.schemaVersion,
        monthStarts: data.monthStarts,
        monthNames: data.monthNames?.hinglish || [],
        monthNamesShort: data.monthNamesShort?.hinglish || [],
        events: (data.events || []).map(ev => {
          const trans = ev.translations?.hinglish || {}
          return {
            id: ev.id,
            rule: ev.rule,
            hijriMonth: ev.hijriMonth,
            hijriDays: ev.hijriDays,
            gregorianMonth: ev.gregorianMonth,
            label: trans.label || ev.label,
            description: trans.description || ev.description
          }
        })
      }
      fs.writeFileSync(
        path.join(CONTENT_DIR, 'hinglish', 'calendar.json'),
        JSON.stringify(hinglishCal, null, 2) + '\n'
      )

      console.log('  ✓ Split calendar.json')
    } else {
      // Standard page split
      activeLangs.forEach(lang => {
        const split = {}
        if (data.quickJump) split.quickJump = data.quickJump
        if (data.schemaVersion) split.schemaVersion = data.schemaVersion

        if (data[lang]) {
          split[lang] = data[lang]
        } else {
          // Empty fallback if the page is missing this language
          // Find first available language as template
          const first = Object.keys(data).find(k => k !== 'quickJump' && typeof data[k] === 'object' && data[k] !== null)
          if (first) {
            split[lang] = JSON.parse(JSON.stringify(data[first]))
          } else {
            split[lang] = { title: name, sections: [] }
          }
        }

        fs.writeFileSync(
          path.join(CONTENT_DIR, lang, file),
          JSON.stringify(split, null, 2) + '\n'
        )
      })
      console.log(`  ✓ Split ${file}`)
    }

    // Delete original file
    fs.unlinkSync(filePath)
    console.log(`  ✓ Deleted original: ${file}`)
  })

  console.log('Migration completed successfully!')
}

runMigration()
