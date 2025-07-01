/**
 * Script para migrar datos de estudiantes desde CSV a Firestore
 * Actualiza la colección ALUMNOS con datos del archivo CSV
 */

import {config} from "dotenv"
import {initializeApp} from "firebase/app"
import {getFirestore, collection, getDocs, doc, updateDoc, query, where} from "firebase/firestore"
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
 * Parsea una línea CSV teniendo en cuenta comillas y comas dentro de campos
 */
function parseCSVLine(line) {
  const result = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

/**
 * Convierte fecha de formato DD-MM-YYYY a objeto Date
 */
function parseDate(dateString) {
  if (!dateString || dateString.trim() === "") return null

  try {
    const [day, month, year] = dateString.split("-")
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  } catch (error) {
    console.warn(`Error parseando fecha: ${dateString}`)
    return null
  }
}

/**
 * Determina los grupos del estudiante basado en las columnas booleanas
 */
function determineGroups(preparatoria, teoriaMusical, coro, orquesta) {
  const grupos = []

  if (preparatoria === "TRUE") grupos.push("Preparatoria")
  if (teoriaMusical === "TRUE") grupos.push("Teoria Musical")
  if (coro === "TRUE") grupos.push("Coro")
  if (orquesta === "TRUE") grupos.push("Orquesta")

  return grupos
}

/**
 * Busca un estudiante en Firestore por nombre completo o InstrumentoID
 */
async function findStudentInFirestore(nombre, instrumentoId) {
  try {
    // Primero intentar buscar por nombre
    const alumnosRef = collection(db, "alumnos")

    // Buscar por nombre completo
    let querySnapshot = await getDocs(query(alumnosRef, where("nombre", "==", nombre)))

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0]
    }

    // Si no se encuentra por nombre, intentar por instrumentoId si existe
    if (instrumentoId && instrumentoId !== "") {
      querySnapshot = await getDocs(query(alumnosRef, where("instrumentoId", "==", instrumentoId)))

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0]
      }
    }

    // Buscar por similitud de nombre (dividir en palabras)
    const nombreParts = nombre.toLowerCase().split(" ")
    const allStudents = await getDocs(alumnosRef)

    for (const doc of allStudents.docs) {
      const studentData = doc.data()
      const studentNombre = (studentData.nombre || "").toLowerCase()

      // Verificar si al menos 2 palabras coinciden
      const matches = nombreParts.filter((part) => part.length > 2 && studentNombre.includes(part))

      if (matches.length >= 2) {
        console.log(`🔍 Coincidencia parcial encontrada: "${nombre}" -> "${studentData.nombre}"`)
        return doc
      }
    }

    return null
  } catch (error) {
    console.error(`Error buscando estudiante ${nombre}:`, error)
    return null
  }
}

/**
 * Actualiza un estudiante en Firestore
 */
async function updateStudent(studentDoc, csvData) {
  try {
    const updateData = {
      // Actualizar nombre completo
      nombre: csvData.nombre,

      // Actualizar fecha de inscripción si existe
      ...(csvData.inscripcion && {createdAt: csvData.inscripcion}),

      // Actualizar fecha de nacimiento si existe
      ...(csvData.nac && {nac: csvData.nac}),

      // Actualizar instrumento
      ...(csvData.instrumento && {instrumento: csvData.instrumento}),

      // Actualizar edad
      ...(csvData.edad && {edad: parseInt(csvData.edad)}),

      // Actualizar teléfono
      ...(csvData.tlf && {tlf: csvData.tlf}),

      // Actualizar grupos
      grupos: csvData.grupos,

      // Agregar ID del instrumento si existe
      ...(csvData.instrumentoId && {instrumentoId: csvData.instrumentoId}),

      // Agregar timestamp de última actualización
      lastUpdated: new Date(),
      updatedFromCSV: true,
    }

    await updateDoc(studentDoc.ref, updateData)
    return true
  } catch (error) {
    console.error(`Error actualizando estudiante:`, error)
    return false
  }
}

/**
 * Función principal de migración
 */
async function migrateStudentsFromCSV() {
  console.log("🚀 Iniciando migración de estudiantes desde CSV...")

  try {
    // Leer el archivo CSV
    const csvPath = path.join(process.cwd(), "INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv")

    if (!fs.existsSync(csvPath)) {
      console.error("❌ Archivo CSV no encontrado en:", csvPath)
      console.log("📁 Por favor, copia el archivo CSV a la raíz del proyecto")
      return
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.split("\n").filter((line) => line.trim() !== "")

    console.log(`📄 Archivo CSV leído: ${lines.length} líneas`)

    // Procesar header
    const header = parseCSVLine(lines[0])
    console.log("📋 Columnas detectadas:", header)

    let processedCount = 0
    let updatedCount = 0
    let notFoundCount = 0
    let errorCount = 0

    // Procesar cada línea de datos
    for (let i = 1; i < lines.length; i++) {
      const data = parseCSVLine(lines[i])

      // Mapear datos del CSV
      const csvData = {
        contador: data[0],
        nombre: data[1]?.trim() || "",
        inscripcion: parseDate(data[2]),
        nac: parseDate(data[3]),
        instrumento: data[4]?.trim() || "",
        edad: data[5]?.trim() || "",
        tlf: data[6]?.trim() || "",
        preparatoria: data[7]?.trim() || "",
        teoriaMusical: data[8]?.trim() || "",
        coro: data[9]?.trim() || "",
        orquesta: data[10]?.trim() || "",
        instrumentoId: data[11]?.trim() || "",
      }

      // Determinar grupos
      csvData.grupos = determineGroups(
        csvData.preparatoria,
        csvData.teoriaMusical,
        csvData.coro,
        csvData.orquesta
      )

      if (!csvData.nombre) {
        console.warn(`⚠️ Línea ${i + 1}: Nombre vacío, omitiendo...`)
        continue
      }

      console.log(`\n📝 Procesando: ${csvData.nombre}`)

      // Buscar estudiante en Firestore
      const studentDoc = await findStudentInFirestore(csvData.nombre, csvData.instrumentoId)

      if (studentDoc) {
        console.log(`✅ Estudiante encontrado: ${studentDoc.id}`)

        // Actualizar estudiante
        const success = await updateStudent(studentDoc, csvData)

        if (success) {
          updatedCount++
          console.log(`🔄 Actualizado exitosamente`)
        } else {
          errorCount++
          console.log(`❌ Error al actualizar`)
        }
      } else {
        notFoundCount++
        console.log(`❓ Estudiante no encontrado en Firestore`)
      }

      processedCount++

      // Pequeña pausa para no sobrecargar Firestore
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Resumen final
    console.log("\n" + "=".repeat(50))
    console.log("📊 RESUMEN DE MIGRACIÓN")
    console.log("=".repeat(50))
    console.log(`📄 Total procesados: ${processedCount}`)
    console.log(`✅ Actualizados exitosamente: ${updatedCount}`)
    console.log(`❓ No encontrados: ${notFoundCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    console.log("=".repeat(50))
  } catch (error) {
    console.error("💥 Error en la migración:", error)
  }
}

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateStudentsFromCSV()
}

export {migrateStudentsFromCSV}
