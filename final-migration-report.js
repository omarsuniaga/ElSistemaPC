const admin = require("firebase-admin")
const fs = require("fs")
const csv = require("csv-parser")

// Configurar Firebase Admin usando variables de entorno
const serviceAccount = {
  type: "service_account",
  project_id: process.env.VITE_APP_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
}

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.VITE_APP_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
  })
}

const db = admin.firestore()

async function generarReporteFinal() {
  try {
    console.log("📊 REPORTE FINAL DE MIGRACIÓN")
    console.log("================================\n")

    // 1. Estadísticas básicas de Firestore
    console.log("1️⃣ ESTADÍSTICAS DE FIRESTORE:")
    const snapshot = await db.collection("ALUMNOS").get()
    console.log(`   Total estudiantes en DB: ${snapshot.size}`)

    // Contar por instrumento
    const instrumentos = {}
    const estudiantesConTelefono = []
    const estudiantesConEdad = []
    const estudiantesRecientes = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      const instrumento = data.instrumento || "Sin instrumento"
      instrumentos[instrumento] = (instrumentos[instrumento] || 0) + 1

      if (data.telefono) estudiantesConTelefono.push(data)
      if (data.edad) estudiantesConEdad.push(data)

      // Verificar modificaciones recientes (últimas 24 horas)
      if (data.updatedAt) {
        const updateTime = new Date(data.updatedAt.seconds * 1000)
        const now = new Date()
        const hoursDiff = (now - updateTime) / (1000 * 60 * 60)

        if (hoursDiff < 24) {
          estudiantesRecientes.push({
            ...data,
            id: doc.id,
            updateTime: updateTime.toLocaleString(),
          })
        }
      }
    })

    console.log(`   Estudiantes con teléfono: ${estudiantesConTelefono.length}`)
    console.log(`   Estudiantes con edad: ${estudiantesConEdad.length}`)
    console.log(`   Modificaciones recientes (24h): ${estudiantesRecientes.length}`)

    console.log("\n   📈 Distribución por instrumentos:")
    Object.entries(instrumentos)
      .sort(([, a], [, b]) => b - a)
      .forEach(([instrumento, count]) => {
        console.log(`      ${instrumento}: ${count}`)
      })

    // 2. Análisis del CSV
    console.log("\n2️⃣ ANÁLISIS DEL CSV:")
    const csvStudents = []
    const stream = fs.createReadStream("INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv").pipe(csv())

    for await (const row of stream) {
      csvStudents.push({
        nombre: row.Nombre?.trim(),
        instrumento: row.instrumento?.trim(),
        edad: parseInt(row.edad) || 0,
        telefono: row.tlf?.trim(),
      })
    }

    console.log(`   Total estudiantes en CSV: ${csvStudents.length}`)

    const csvInstrumentos = {}
    const csvConTelefono = csvStudents.filter((s) => s.telefono && s.telefono !== "")
    const csvConEdad = csvStudents.filter((s) => s.edad > 0)

    csvStudents.forEach((student) => {
      if (student.instrumento) {
        csvInstrumentos[student.instrumento] = (csvInstrumentos[student.instrumento] || 0) + 1
      }
    })

    console.log(`   Estudiantes CSV con teléfono: ${csvConTelefono.length}`)
    console.log(`   Estudiantes CSV con edad: ${csvConEdad.length}`)

    console.log("\n   📈 Distribución CSV por instrumentos:")
    Object.entries(csvInstrumentos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([instrumento, count]) => {
        console.log(`      ${instrumento}: ${count}`)
      })

    // 3. Modificaciones recientes
    if (estudiantesRecientes.length > 0) {
      console.log("\n3️⃣ MODIFICACIONES RECIENTES (últimas 24h):")
      estudiantesRecientes.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.nombre || "Sin nombre"} ${student.apellido || ""}`)
        console.log(`      Modificado: ${student.updateTime}`)
        console.log(`      Instrumento: ${student.instrumento || "No definido"}`)
        console.log(`      Edad: ${student.edad || "No definida"}`)
        console.log(`      Teléfono: ${student.telefono || "No definido"}`)
        console.log("")
      })
    } else {
      console.log("\n3️⃣ MODIFICACIONES RECIENTES: ❌ Ninguna en las últimas 24 horas")
    }

    // 4. Recomendaciones
    console.log("\n4️⃣ RECOMENDACIONES:")

    if (estudiantesRecientes.length === 0) {
      console.log("   ❌ NO se detectaron modificaciones recientes")
      console.log("   🔧 ACCIÓN REQUERIDA: Re-ejecutar migración")
      console.log("   📝 Posibles problemas:")
      console.log("      - Variables de entorno incorrectas")
      console.log("      - Problemas de conectividad")
      console.log("      - Errores en el script de migración")
    } else if (estudiantesRecientes.length < 5) {
      console.log("   🔶 Migración PARCIAL detectada")
      console.log("   📊 Se modificaron algunos estudiantes pero no todos")
      console.log("   🔧 ACCIÓN REQUERIDA: Investigar y completar migración")
    } else {
      console.log("   ✅ Migración parece EXITOSA")
      console.log("   📊 Se detectaron múltiples modificaciones recientes")
      console.log("   🔧 ACCIÓN SUGERIDA: Verificar datos específicos")
    }

    console.log("\n✅ Reporte completado")
    console.log("================================")
  } catch (error) {
    console.error("❌ Error generando reporte:", error)
  } finally {
    process.exit(0)
  }
}

generarReporteFinal()
