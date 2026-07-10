// Firebase Admin SDK Import Script
// Save as: scripts/import-to-firebase.mjs
// Usage: node scripts/import-to-firebase.mjs
//
// First: firebase login
// Then:  Set up a Firebase Admin service account

import admin from 'firebase-admin'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// You'll need to download a service account key from Firebase Console
// and save it as service-account.json in the project root
// import serviceAccount from '../service-account.json' assert { type: 'json' }

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: 'https://kqcmm-7d71b.firebaseio.com'
// })

// const db = admin.database()

async function migrate() {
  const contentDir = join(__dirname, '../src/config/content')
  const files = readdirSync(contentDir).filter(f => f.endsWith('.json'))

  for (const file of files) {
    const data = JSON.parse(readFileSync(join(contentDir, file), 'utf8'))
    const pageName = file.replace('.json', '')

    console.log(`Uploading ${pageName}...`)

    // Upload each language under pages/{pageName}/{lang}
    for (const [lang, content] of Object.entries(data)) {
      // await db.ref(`pages/${pageName}/${lang}`).set(content)
    }
  }

  console.log('✅ Migration complete!')
}

migrate()
