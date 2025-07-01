const admin = require("firebase-admin")

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

async function determinarProximosPasos() {
  try {
    console.log("🎯 DETERMINANDO PRÓXIMOS PASOS")
    console.log("==============================\n")

    // 1. Verificar conectividad básica
    console.log("1️⃣ Verificando conectividad...")
    const snapshot = await db.collection("ALUMNOS").limit(1).get()
    console.log(`   ✅ Conexión establecida (${snapshot.size} documento(s) accesible(s))\n`)

    // 2. Contar total de estudiantes
    console.log("2️⃣ Contando estudiantes...")
    const allSnapshot = await db.collection("ALUMNOS").get()
    console.log(`   📊 Total estudiantes en Firestore: ${allSnapshot.size}\n`)

    // 3. Verificar modificaciones recientes
    console.log("3️⃣ Verificando modificaciones recientes...")
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    let recentChanges = 0
    const recentStudents = []

    allSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.updatedAt) {
        const updateTime = new Date(data.updatedAt.seconds * 1000)
        if (updateTime > oneDayAgo) {
          recentChanges++
          recentStudents.push({
            nombre: `${data.nombre || ""} ${data.apellido || ""}`.trim(),
            updateTime: updateTime.toLocaleString(),
            instrumento: data.instrumento || "No definido",
          })
        }
      }
    })

    console.log(`   📅 Modificaciones en últimas 24h: ${recentChanges}`)

    if (recentStudents.length > 0) {
      console.log("\n   📝 Estudiantes modificados recientemente:")
      recentStudents.slice(0, 5).forEach((student, index) => {
        console.log(
          `      ${index + 1}. ${student.nombre} (${student.instrumento}) - ${student.updateTime}`
        )
      })
      if (recentStudents.length > 5) {
        console.log(`      ... y ${recentStudents.length - 5} más`)
      }
    }

    // 4. Determinar estado y próximos pasos
    console.log("\n4️⃣ DETERMINANDO ESTADO:\n")

    let estado = ""
    let proximosPasos = []

    if (recentChanges === 0) {
      estado = "❌ MIGRACIÓN NO DETECTADA"
      proximosPasos = [
        "🔧 Ejecutar: node migrate-direct-test.js",
        "🔍 Verificar: node check-recent-changes.js",
        "⚙️ Si falla: Revisar variables de entorno",
        "📞 Contactar soporte si persiste el problema",
      ]
    } else if (recentChanges < 5) {
      estado = "🔶 MIGRACIÓN PARCIAL"
      proximosPasos = [
        "🔍 Analizar: node verify-specific-students.js",
        "🔧 Re-ejecutar: node migrate-direct-test.js",
        "📊 Verificar: node final-migration-report.js",
        "✅ Si funciona: Migrar todos los estudiantes",
      ]
    } else if (recentChanges >= 5 && recentChanges < 50) {
      estado = "✅ MIGRACIÓN EXITOSA (PRUEBA)"
      proximosPasos = [
        "📊 Generar reporte: node final-migration-report.js",
        "🚀 Migrar todos: node scripts/migrate-students-from-csv.js",
        "✅ Verificar completitud: node verify-specific-students.js",
        "📝 Documentar resultados finales",
      ]
    } else {
      estado = "🎉 MIGRACIÓN COMPLETA"
      proximosPasos = [
        "✅ Verificar datos: node verify-specific-students.js",
        "📊 Generar estadísticas: node final-migration-report.js",
        "📋 Crear reporte final",
        "🎯 ¡Migración completada exitosamente!",
      ]
    }

    console.log(`📊 ESTADO ACTUAL: ${estado}\n`)
    console.log("🚀 PRÓXIMOS PASOS RECOMENDADOS:")
    proximosPasos.forEach((paso, index) => {
      console.log(`   ${index + 1}. ${paso}`)
    })

    console.log("\n💡 COMANDOS ÚTILES:")
    console.log("   📊 Estado general: node final-migration-report.js")
    console.log("   🔍 Verificar específicos: node verify-specific-students.js")
    console.log("   ⏰ Cambios recientes: node check-recent-changes.js")
    console.log("   🧪 Prueba migración: node migrate-direct-test.js")
    console.log("   🚀 Migración completa: node scripts/migrate-students-from-csv.js")

    console.log("\n✅ Análisis completado")
  } catch (error) {
    console.error("❌ Error determinando próximos pasos:", error)
    console.log("\n🔧 ACCIÓN REQUERIDA: Verificar configuración")
    console.log("   1. node verify-config.js")
    console.log("   2. Revisar variables de entorno")
    console.log("   3. Verificar permisos Firebase")
  } finally {
    process.exit(0)
  }
}

determinarProximosPasos()
