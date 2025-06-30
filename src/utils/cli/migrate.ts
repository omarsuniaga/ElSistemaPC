import 'dotenv/config'
import { getFirestore } from 'firebase-admin/firestore'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let admin;
try {
  // SEGURIDAD: Usar solo variables de entorno para credenciales
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('⚠️ FALTAN VARIABLES DE ENTORNO DE FIREBASE. Configura FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, y FIREBASE_CLIENT_EMAIL en tu archivo .env');
  }

  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: "googleapis.com"
  };

  admin = require('firebase-admin');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.warn('⚠️ Could not initialize Firebase Admin. Skipping migration.');
  process.exit(0);
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