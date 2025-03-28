import 'dotenv/config'
import { getFirestore } from 'firebase-admin/firestore'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let admin;
try {
  // Try to load from file first
  admin = require('firebase-admin');
  admin.initializeApp({
    credential: admin.credential.cert('./service-account.json')
  });
} catch (error) {
  // If file doesn't exist, try to use environment variables
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin = require('firebase-admin');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (e) {
      console.warn('⚠️ Could not initialize Firebase Admin from environment variables. Skipping migration.');
      process.exit(0);
    }
  } else {
    console.warn('⚠️ No Firebase service account available. Skipping migration.');
    process.exit(0);
  }
}

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