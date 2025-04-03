import 'dotenv/config'
import { getFirestore } from 'firebase-admin/firestore'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let admin;
try {
  // Usar credenciales directamente para el script de migración
  const serviceAccount = {
    "type": "service_account",
    "project_id": "elsistemapc-e1bfd",
    "private_key_id": "2f362d26fe0c2edfb36f66dd2b3feccaa9c41160",
    "private_key": process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC5hf+52lqeEkDX\nUFJ/uBdCE/cTkB8QLJZYkP+Jl01ZPyHoXIja+7phgkKtgPHr0QNsR+kFgEb4jWHJ\nhGgcXgGQN8LJ0Qp76L7YAQIym/qxB+PTmSXOoEyD5Z2yl2QoIdY4KeHfT4SKmFKL\nfzwdLvP1KuvTBSO9s56SpP7fZt4ZhU8t3LHnnlunEVaynq2I4joUZ50kHIbqrLKj\nQrYLTD5vX0h7hPh4f15rjh+NE9HXNzqzjWRtZGE7nkQ7mJudZb8fTJ+5w+H/0dHA\nOxOhhmQOY1QCS3TBUWXCCVoJ1fNJ2Hg7LV2rQw6k7F19jcTOSTsOhQaR8Rg9GzZd\nEK6izr7pAgMBAAECggEAAKOCeRKpKrSgMF4emAz77qPvlZhN3A/7ONhUUmeXOZCZ\nTjNvQQxAW0pxkcb0SbO2XPEOsNjNHUEz7pVz/uBxnx0/aV31hJZB/vIRSxOO01aM\n0P6bkQrvA1ODNE2sDfYe1C7KXUcToSMU2D0D8kQHm5T+A9Op3P7M2G80wQolhOLX\n7/DLbsaGb+Fh1lDMRw3TOmHxVxE7fMFZSil3uWvAW5WsyDgneCfM7o1arxcekAEf\nWaCGm6+5C1cE6GUwU0lXuPnh2MXlYcHJTwoozNAowlv4Q2AFnGZfV9oEBBkuRoOd\n9P/pFHxCHGnj0lxXJlQu0klZe2Ro1vpiSRN6MLSFoQKBgQDaa5J3B+u3VlodmC09\nYvQ70yCuWoWDZRqxN+0AcMkTYvgR8oHAfUZu2A65ggddcG0Z/e8E1BV40I55GZbI\nRcF42xH71ZyotBD/shrtYNG2O6tuiUDjQLGjWMnUzoT//0zkJkrO8JpLKbS0AgEH\nzNRUT5qODuUbBE6Rmv6+yFydoQKBgQDZamOAFdBMC3tL4Z9lZbQoVC0i170IoOOI\nTRjbHF9bQnMRALMUFnWgBs5PLYxbR0tZS1+Ix3MMVshnKUYQs3QEgUDyHV7FuRMB\n8V1ce4B3MAPBGFEeHCVj4pq7LE0fK5CvOZ77lNq5jHleInM4FO0ROEevC4nRvyA2\nckbHEd6JCQKBgDr5A+98mM6DE46q7wfdOJOTfbzHlGO+yt9yydnKGpsHQJO+RDWX\nXpaHR7OZs88NI9UvyzeJgGLE3QDnKGQiMECPctMSr7s7OCOxEbd+n6nP9eytG1LK\nNYLXZ0nC8KmZzEBAuDXvX4HKSuYqBVKGe9G0qZcD+bOiBJa3z9ExqXNhAoGAT6g7\nn19u5Kn7KAY+xOM3EHWJ3NmZ44hc7BFGj1hkmPnFzjuD6q1UwKlcxvTBtNrS1AHL\nA/32JMeY+SgeOd5y+hhJCK3D/znpHhLaT56FBSTGDpHkC4YlFPqvXWCimL8BrMdw\nAn7ohxz7qosw9uo5DQj8Bd0B8hL67JHDLqyP7QECgYAP69w1EkuGp3jE39v3ZkSS\nc32y3diKuTvuibrdseTln+2fTdEznnUEy1Eq9n6fAy9OTs6tYSUQUtqZ25h2DBQg\nJoVZX116RTxPRHSQyLEEyxXR8g9U0unSCurX3YvulBGceDG4eEeH9fKqbg83BXxM\nu+3vlIMpVZnHe7etayLpNg==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-dg2y8@elsistemapc-e1bfd.iam.gserviceaccount.com",
    "client_id": "103420708454096533628",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-dg2y8%40elsistemapc-e1bfd.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
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