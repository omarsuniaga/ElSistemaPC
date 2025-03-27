import 'dotenv/config'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get absolute path to service account file
const serviceAccountPath = resolve(__dirname, '../../../service-account.json')

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccountPath)
})

// Get Firestore instance with admin privileges
const adminDb = getFirestore()

import { migrateSchedules } from '../migrations/schedulesMigration.js'

console.log('🚀 Iniciando proceso de migración...')

try {
  const result = await migrateSchedules(adminDb)
  if (result.success) {
    console.log('✅ Migración completada exitosamente')
    console.log(`📊 Horarios migrados: ${result.migratedCount}`)
  } else {
    console.error('❌ Error en la migración:', result.error)
    process.exit(1)
  }
} catch (error) {
  console.error('❌ Error inesperado:', error)
  process.exit(1)
}

process.exit(0)