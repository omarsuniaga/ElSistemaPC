/**
 * Script para crear respaldo de la colección ALUMNOS de Firestore
 * Exporta todos los documentos a un archivo JSON con timestamp
 */

import {config} from "dotenv"
import {initializeApp} from "firebase/app"
import {getFirestore, collection, getDocs} from "firebase/firestore"
import fs from "fs"
import path from "path"
import {fileURLToPath} from "url"

// Cargar variables de entorno
config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración de Firebase (usar variables de entorno)
const firebaseConfig = {
  apiKey: process.env.VITE_APP_API_KEY,
  authDomain: process.env.VITE_APP_AUTH_DOMAIN,
  projectId: process.env.VITE_APP_PROJECT_ID,
  storageBucket: process.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_APP_ID,
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

/**
 * Convierte un objeto Date a string ISO para serialización JSON
 */
function serializeFirestoreData(obj) {
  if (obj === null || obj === undefined) return obj

  if (obj.constructor.name === "Timestamp") {
    return {
      _firestore_timestamp: true,
      seconds: obj.seconds,
      nanoseconds: obj.nanoseconds,
    }
  }

  if (obj instanceof Date) {
    return {
      _firestore_date: true,
      value: obj.toISOString(),
    }
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeFirestoreData(item))
  }

  if (typeof obj === "object") {
    const serialized = {}
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeFirestoreData(value)
    }
    return serialized
  }

  return obj
}

/**
 * Crea un backup completo de la colección ALUMNOS
 */
async function backupAlumnosCollection() {
  console.log("🔄 Iniciando backup de la colección ALUMNOS...")

  try {
    // Obtener referencia a la colección
    const alumnosRef = collection(db, "alumnos")

    console.log("📡 Conectando a Firestore...")

    // Obtener todos los documentos
    const snapshot = await getDocs(alumnosRef)

    console.log(`📊 Documentos encontrados: ${snapshot.size}`)

    if (snapshot.empty) {
      console.warn("⚠️ La colección ALUMNOS está vacía o no existe")
      return
    }

    // Preparar datos para backup
    const backupData = {
      collection: "alumnos",
      timestamp: new Date().toISOString(),
      totalDocuments: snapshot.size,
      exportedBy: "backup-alumnos-script",
      version: "1.0.0",
      documents: [],
    }

    // Procesar cada documento
    let processedCount = 0
    snapshot.forEach((doc) => {
      const docData = doc.data()

      // Serializar datos de Firestore (incluye Timestamps)
      const serializedData = serializeFirestoreData(docData)

      backupData.documents.push({
        id: doc.id,
        data: serializedData,
        path: `alumnos/${doc.id}`,
      })

      processedCount++

      if (processedCount % 10 === 0) {
        console.log(`📝 Procesados: ${processedCount}/${snapshot.size}`)
      }
    })

    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const backupFileName = `backup-alumnos-${timestamp}.json`
    const backupPath = path.join(process.cwd(), "backups", backupFileName)

    // Crear directorio de backups si no existe
    const backupsDir = path.join(process.cwd(), "backups")
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, {recursive: true})
      console.log("📁 Directorio de backups creado")
    }

    // Guardar backup
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf-8")

    // Calcular tamaño del archivo
    const stats = fs.statSync(backupPath)
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)

    // Crear también un backup comprimido (opcional)
    const backupSummaryPath = path.join(
      process.cwd(),
      "backups",
      `backup-alumnos-summary-${timestamp}.json`
    )
    const summaryData = {
      collection: "alumnos",
      timestamp: new Date().toISOString(),
      totalDocuments: snapshot.size,
      backupFile: backupFileName,
      fileSizeMB: fileSizeInMB,
      sampleDocuments: backupData.documents.slice(0, 3).map((doc) => ({
        id: doc.id,
        sampleFields: Object.keys(doc.data || {}).slice(0, 5),
      })),
    }

    fs.writeFileSync(backupSummaryPath, JSON.stringify(summaryData, null, 2), "utf-8")

    // Resumen final
    console.log("\n" + "=".repeat(60))
    console.log("✅ BACKUP COMPLETADO EXITOSAMENTE")
    console.log("=".repeat(60))
    console.log(`📄 Documentos respaldados: ${snapshot.size}`)
    console.log(`📁 Archivo de backup: ${backupFileName}`)
    console.log(`📊 Tamaño del archivo: ${fileSizeInMB} MB`)
    console.log(`📍 Ubicación: ${backupPath}`)
    console.log(`📋 Resumen: ${backupSummaryPath}`)
    console.log("=".repeat(60))

    // Mostrar algunos campos de ejemplo
    if (backupData.documents.length > 0) {
      const sampleDoc = backupData.documents[0]
      console.log("\n📋 Campos encontrados en los documentos:")
      const allFields = new Set()
      backupData.documents.forEach((doc) => {
        Object.keys(doc.data || {}).forEach((field) => allFields.add(field))
      })

      console.log(`🔑 Total de campos únicos: ${allFields.size}`)
      console.log(`📝 Campos comunes: ${Array.from(allFields).slice(0, 10).join(", ")}`)

      if (allFields.size > 10) {
        console.log(`   ... y ${allFields.size - 10} más`)
      }
    }

    return {
      success: true,
      filePath: backupPath,
      documentCount: snapshot.size,
      fileSizeMB: fileSizeInMB,
    }
  } catch (error) {
    console.error("💥 Error creando backup:", error)

    // Información de debug
    console.error("\n🔍 Información de debug:")
    console.error("📍 Project ID:", process.env.VITE_APP_PROJECT_ID)
    console.error("🔑 API Key presente:", !!process.env.VITE_APP_API_KEY)
    console.error("🌐 Auth Domain:", process.env.VITE_APP_AUTH_DOMAIN)

    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Función para restaurar desde backup (para casos de emergencia)
 */
async function listAvailableBackups() {
  const backupsDir = path.join(process.cwd(), "backups")

  if (!fs.existsSync(backupsDir)) {
    console.log("📁 No hay directorio de backups")
    return []
  }

  const files = fs
    .readdirSync(backupsDir)
    .filter((file) => file.startsWith("backup-alumnos-") && file.endsWith(".json"))
    .map((file) => {
      const stats = fs.statSync(path.join(backupsDir, file))
      return {
        filename: file,
        created: stats.birthtime,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      }
    })
    .sort((a, b) => b.created.getTime() - a.created.getTime())

  console.log("\n📋 Backups disponibles:")
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.filename}`)
    console.log(`   📅 Creado: ${file.created.toLocaleString()}`)
    console.log(`   📊 Tamaño: ${file.sizeMB} MB\n`)
  })

  return files
}

// Ejecutar backup si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  backupAlumnosCollection().then((result) => {
    if (result.success) {
      console.log("\n🎉 Backup completado. Ahora puedes ejecutar con seguridad:")
      console.log("📊 npm run migrate:analyze-csv")
      console.log("🔄 npm run migrate:students-csv")
    } else {
      console.error("\n❌ Error en el backup. Revisa la configuración antes de continuar.")
      process.exit(1)
    }
  })
}

export {backupAlumnosCollection, listAvailableBackups}
