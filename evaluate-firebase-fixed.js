// Script de evaluación con nombres correctos de variables de entorno
import {config} from "dotenv"
import {initializeApp} from "firebase/app"
import {getFirestore, collection, getDocs} from "firebase/firestore"
import fs from "fs"

// Cargar .env.production específicamente
config({path: ".env.production"})

console.log("🔧 CONFIGURACIÓN DE FIREBASE")
console.log("============================")
console.log("Project ID:", process.env.VITE_APP_PROJECT_ID)
console.log("Auth Domain:", process.env.VITE_APP_AUTH_DOMAIN)
console.log("Usando emuladores:", process.env.VITE_USE_EMULATORS)

const firebaseConfig = {
  apiKey: process.env.VITE_APP_API_KEY,
  authDomain: process.env.VITE_APP_AUTH_DOMAIN,
  projectId: process.env.VITE_APP_PROJECT_ID,
  storageBucket: process.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_APP_ID,
}

console.log("\n🚀 Inicializando Firebase...")
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function evaluarModificacionesFirebase() {
  console.log("\n🔍 EVALUANDO MODIFICACIONES EN FIREBASE")
  console.log("=======================================")

  try {
    // 1. Conectar y contar documentos
    console.log("📡 Conectando a Firestore...")
    const alumnosRef = collection(db, "ALUMNOS")
    const snapshot = await getDocs(alumnosRef)

    console.log(`✅ CONEXIÓN EXITOSA`)
    console.log(`📊 Total de documentos: ${snapshot.size}`)

    // 2. Leer datos del CSV
    console.log("\n📄 Leyendo CSV...")
    const csvContent = fs.readFileSync("INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv", "utf8")
    const csvLines = csvContent.split("\n").filter((line) => line.trim())
    console.log(`📋 Estudiantes en CSV: ${csvLines.length - 1}`)

    // 3. Buscar estudiantes específicos del CSV
    const estudiantesCSV = [
      "Geily Yosairy Diviche",
      "Rousse Angelina Martinez",
      "Ana Giselle Taveras Fulgencia",
      "Jose Angel Lopez Matos",
      "Rebecca Jeanpierre",
      "Yangel Jair Medina Ramirez",
      "Jazlin Gomez Burgos",
    ]

    console.log("\n🔍 Buscando estudiantes del CSV en Firebase:")

    const estudiantesEncontrados = []
    let totalTelefonos = 0
    let totalInstrumentos = 0
    let totalGrupos = 0

    snapshot.forEach((doc) => {
      const data = doc.data()
      const nombre = data.nombre || ""

      // Buscar coincidencias
      const coincidencia = estudiantesCSV.find(
        (csvNombre) =>
          nombre.toLowerCase().includes(csvNombre.toLowerCase()) ||
          csvNombre.toLowerCase().includes(nombre.toLowerCase())
      )

      if (coincidencia) {
        estudiantesEncontrados.push({
          id: doc.id,
          nombre,
          csvNombre: coincidencia,
          telefono: data.telefono,
          edad: data.edad,
          instrumento: data.instrumento,
          grupos: data.grupos,
          fechaCreacion: data.fechaCreacion,
        })
      }

      // Contar campos actualizados
      if (data.telefono) totalTelefonos++
      if (data.instrumento) totalInstrumentos++
      if (data.grupos) totalGrupos++
    })

    // 4. Mostrar resultados
    console.log(`\n📈 RESULTADOS DE LA EVALUACIÓN:`)
    console.log(`  🎯 Estudiantes CSV buscados: ${estudiantesCSV.length}`)
    console.log(`  ✅ Estudiantes encontrados: ${estudiantesEncontrados.length}`)
    console.log(
      `  📊 Porcentaje de coincidencia: ${((estudiantesEncontrados.length / estudiantesCSV.length) * 100).toFixed(1)}%`
    )

    console.log(`\n📊 ESTADÍSTICAS GENERALES:`)
    console.log(`  📞 Documentos con teléfono: ${totalTelefonos}`)
    console.log(`  🎵 Documentos con instrumento: ${totalInstrumentos}`)
    console.log(`  👥 Documentos con grupos: ${totalGrupos}`)

    console.log(`\n📄 ESTUDIANTES ENCONTRADOS:`)
    estudiantesEncontrados.forEach((estudiante, index) => {
      console.log(`\n${index + 1}. ${estudiante.nombre}`)
      console.log(`   🎯 Coincide con CSV: ${estudiante.csvNombre}`)
      console.log(`   📞 Teléfono: ${estudiante.telefono || "No especificado"}`)
      console.log(`   🎂 Edad: ${estudiante.edad || "No especificado"}`)
      console.log(`   🎵 Instrumento: ${estudiante.instrumento || "No especificado"}`)
      console.log(`   👥 Grupos: ${JSON.stringify(estudiante.grupos || {})}`)
      console.log(`   🆔 ID: ${estudiante.id}`)
    })

    // 5. Conclusión
    console.log(`\n🎯 CONCLUSIÓN:`)
    if (estudiantesEncontrados.length >= 5) {
      console.log("🎉 ¡MIGRACIÓN EXITOSA! Se encontraron múltiples estudiantes del CSV")
    } else if (estudiantesEncontrados.length >= 2) {
      console.log("🔶 MIGRACIÓN PARCIAL: Se encontraron algunos estudiantes")
    } else if (estudiantesEncontrados.length >= 1) {
      console.log("⚠️ MIGRACIÓN MÍNIMA: Se encontró al menos un estudiante")
    } else {
      console.log("❌ NO SE DETECTÓ MIGRACIÓN: No se encontraron estudiantes del CSV")
    }

    console.log(`\n⏰ Evaluación completada: ${new Date().toLocaleString()}`)
  } catch (error) {
    console.error("❌ Error durante la evaluación:", error)
    console.error("📍 Detalles:", error.message)
  }
}

evaluarModificacionesFirebase()
