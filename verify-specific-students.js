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

async function verificarEstudiantesEspecificos() {
  try {
    console.log("🔍 Verificando estudiantes específicos del CSV...\n")

    // Leer primeros 5 estudiantes del CSV
    const csvStudents = []
    const stream = fs.createReadStream("INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv").pipe(csv())

    for await (const row of stream) {
      if (csvStudents.length >= 5) break

      csvStudents.push({
        nombre: row.Nombre?.trim(),
        instrumento: row.instrumento?.trim(),
        edad: parseInt(row.edad) || 0,
        telefono: row.tlf?.trim(),
      })
    }

    console.log("📋 Estudiantes del CSV (primeros 5):")
    csvStudents.forEach((student, index) => {
      console.log(
        `${index + 1}. ${student.nombre} - ${student.instrumento} - Edad: ${student.edad} - Tel: ${student.telefono}`
      )
    })

    console.log("\n🔍 Buscando estos estudiantes en Firestore...\n")

    for (const csvStudent of csvStudents) {
      const nameParts = csvStudent.nombre.split(" ")
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(" ")

      console.log(`\n--- Buscando: ${csvStudent.nombre} ---`)

      // Buscar por nombre completo primero
      let querySnapshot = await db
        .collection("ALUMNOS")
        .where("nombre", ">=", firstName)
        .where("nombre", "<=", firstName + "\uf8ff")
        .get()

      let found = false

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const fullName = `${data.nombre || ""} ${data.apellido || ""}`.trim()

        if (
          fullName.toLowerCase().includes(csvStudent.nombre.toLowerCase()) ||
          csvStudent.nombre.toLowerCase().includes(fullName.toLowerCase())
        ) {
          found = true
          console.log(`✅ ENCONTRADO en Firestore:`)
          console.log(`   ID: ${doc.id}`)
          console.log(`   Nombre en DB: ${fullName}`)
          console.log(`   Instrumento en DB: ${data.instrumento || "No definido"}`)
          console.log(`   Edad en DB: ${data.edad || "No definida"}`)
          console.log(`   Teléfono en DB: ${data.telefono || "No definido"}`)
          console.log(
            `   Última modificación: ${data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toLocaleString() : "No definida"}`
          )

          // Comparar con datos del CSV
          console.log(`\n   📊 COMPARACIÓN:`)
          console.log(`   CSV -> DB`)
          console.log(
            `   Instrumento: ${csvStudent.instrumento} -> ${data.instrumento || "No definido"}`
          )
          console.log(`   Edad: ${csvStudent.edad} -> ${data.edad || "No definida"}`)
          console.log(`   Teléfono: ${csvStudent.telefono} -> ${data.telefono || "No definido"}`)

          // Verificar si coinciden los datos
          const instrumentoMatch = csvStudent.instrumento === (data.instrumento || "")
          const edadMatch = csvStudent.edad === (data.edad || 0)
          const telefonoMatch = csvStudent.telefono === (data.telefono || "")

          console.log(`   Coincidencias:`)
          console.log(`   - Instrumento: ${instrumentoMatch ? "✅" : "❌"}`)
          console.log(`   - Edad: ${edadMatch ? "✅" : "❌"}`)
          console.log(`   - Teléfono: ${telefonoMatch ? "✅" : "❌"}`)
        }
      })

      if (!found) {
        console.log(`❌ NO ENCONTRADO: ${csvStudent.nombre}`)

        // Buscar por apellido también
        console.log(`   🔍 Buscando por apellido...`)
        querySnapshot = await db
          .collection("ALUMNOS")
          .where("apellido", ">=", lastName)
          .where("apellido", "<=", lastName + "\uf8ff")
          .get()

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const fullName = `${data.nombre || ""} ${data.apellido || ""}`.trim()
          console.log(`   Posible coincidencia: ${fullName}`)
        })
      }
    }

    console.log("\n✅ Verificación específica completada")
  } catch (error) {
    console.error("❌ Error en la verificación:", error)
  } finally {
    process.exit(0)
  }
}

verificarEstudiantesEspecificos()
