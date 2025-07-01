// Script de evaluación completa de modificaciones en Firebase
import {config} from "dotenv"
import {initializeApp} from "firebase/app"
import {getFirestore, collection, getDocs, query, where, orderBy} from "firebase/firestore"
import fs from "fs"

config()

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function evaluarModificaciones() {
  console.log("\n🔍 EVALUANDO MODIFICACIONES EN FIREBASE")
  console.log("=======================================")
  console.log(`📅 Fecha de evaluación: ${new Date().toLocaleString()}`)

  try {
    // 1. Verificar conectividad
    console.log("\n📡 1. VERIFICANDO CONECTIVIDAD...")
    const alumnosRef = collection(db, "ALUMNOS")
    const snapshot = await getDocs(alumnosRef)
    console.log(`✅ Conectado exitosamente a Firebase`)
    console.log(`📊 Total de documentos en ALUMNOS: ${snapshot.size}`)

    // 2. Leer CSV para comparar
    console.log("\n📄 2. LEYENDO DATOS DEL CSV...")
    const csvContent = fs.readFileSync("INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv", "utf8")
    const csvLines = csvContent.split("\n").filter((line) => line.trim())
    const csvHeader = csvLines[0].split(",")

    const csvStudents = []
    for (let i = 1; i < csvLines.length; i++) {
      const values = csvLines[i].split(",")
      if (values[1]) {
        // Si tiene nombre
        csvStudents.push({
          nombre: values[1].trim(),
          telefono: values[6],
          edad: parseInt(values[5]) || 0,
          instrumento: values[4],
        })
      }
    }
    console.log(`📋 Estudiantes en CSV: ${csvStudents.length}`)

    // 3. Analizar datos de Firebase
    console.log("\n🔍 3. ANALIZANDO DATOS EN FIREBASE...")
    const firebaseStudents = []
    const instrumentos = {}
    const edades = {}
    const telefonos = 0

    snapshot.forEach((doc) => {
      const data = doc.data()
      firebaseStudents.push(data)

      // Contar instrumentos
      const instr = data.instrumento || "Sin instrumento"
      instrumentos[instr] = (instrumentos[instr] || 0) + 1

      // Contar edades
      const edad = data.edad || "Sin edad"
      edades[edad] = (edades[edad] || 0) + 1
    })

    // 4. Buscar coincidencias entre CSV y Firebase
    console.log("\n🔄 4. BUSCANDO COINCIDENCIAS...")
    let coincidenciasExactas = 0
    let estudiantesActualizados = 0
    const estudiantesNuevos = 0

    const coincidencias = []

    for (const csvStudent of csvStudents.slice(0, 10)) {
      // Evaluar primeros 10
      const found = firebaseStudents.find(
        (fb) => fb.nombre && fb.nombre.toLowerCase().includes(csvStudent.nombre.toLowerCase())
      )

      if (found) {
        coincidenciasExactas++
        const actualizado =
          found.telefono === csvStudent.telefono ||
          found.edad === csvStudent.edad ||
          found.instrumento === csvStudent.instrumento

        if (actualizado) estudiantesActualizados++

        coincidencias.push({
          nombre: csvStudent.nombre,
          encontrado: true,
          actualizado,
          firebase: {
            telefono: found.telefono,
            edad: found.edad,
            instrumento: found.instrumento,
          },
          csv: {
            telefono: csvStudent.telefono,
            edad: csvStudent.edad,
            instrumento: csvStudent.instrumento,
          },
        })
      } else {
        coincidencias.push({
          nombre: csvStudent.nombre,
          encontrado: false,
          actualizado: false,
        })
      }
    }

    // 5. REPORTE DE RESULTADOS
    console.log("\n📊 5. REPORTE DE EVALUACIÓN")
    console.log("============================")

    console.log(`\n📈 ESTADÍSTICAS GENERALES:`)
    console.log(`  📋 Total documentos Firebase: ${snapshot.size}`)
    console.log(`  📄 Total estudiantes CSV: ${csvStudents.length}`)
    console.log(`  🎯 Coincidencias encontradas: ${coincidenciasExactas}/10 (muestra)`)
    console.log(`  ✅ Estudiantes actualizados: ${estudiantesActualizados}`)

    console.log(`\n🎵 INSTRUMENTOS EN FIREBASE:`)
    Object.entries(instrumentos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([instr, count]) => {
        console.log(`  🎶 ${instr}: ${count} estudiantes`)
      })

    console.log(`\n👥 DISTRIBUCIÓN DE EDADES:`)
    Object.entries(edades)
      .sort(([a], [b]) => (parseInt(a) || 0) - (parseInt(b) || 0))
      .slice(0, 10)
      .forEach(([edad, count]) => {
        console.log(`  🎂 ${edad} años: ${count} estudiantes`)
      })

    console.log(`\n🔍 EJEMPLOS DE COINCIDENCIAS:`)
    coincidencias.slice(0, 5).forEach((item, index) => {
      console.log(`\n  ${index + 1}. ${item.nombre}`)
      console.log(`     🔍 Encontrado: ${item.encontrado ? "✅" : "❌"}`)
      if (item.encontrado) {
        console.log(`     🔄 Actualizado: ${item.actualizado ? "✅" : "❌"}`)
        console.log(`     📞 Teléfono: FB(${item.firebase.telefono}) vs CSV(${item.csv.telefono})`)
        console.log(`     🎂 Edad: FB(${item.firebase.edad}) vs CSV(${item.csv.edad})`)
        console.log(
          `     🎵 Instrumento: FB(${item.firebase.instrumento}) vs CSV(${item.csv.instrumento})`
        )
      }
    })

    // 6. Verificar estudiantes recientes
    console.log(`\n📅 6. ESTUDIANTES RECIÉN MODIFICADOS:`)
    const estudiantesRecientes = firebaseStudents
      .filter((student) => student.fechaCreacion || student.fechaActualizacion)
      .slice(0, 5)

    estudiantesRecientes.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.nombre}`)
      console.log(`     📅 Creado: ${student.fechaCreacion || "No especificado"}`)
      console.log(`     🔄 Actualizado: ${student.fechaActualizacion || "No especificado"}`)
    })

    // 7. CONCLUSIÓN
    console.log(`\n🎯 7. CONCLUSIÓN DE LA EVALUACIÓN`)
    console.log("==================================")

    if (coincidenciasExactas > 7) {
      console.log("✅ MIGRACIÓN EXITOSA: Se encontraron muchas coincidencias")
    } else if (coincidenciasExactas > 3) {
      console.log("🔶 MIGRACIÓN PARCIAL: Se encontraron algunas coincidencias")
    } else {
      console.log("❌ MIGRACIÓN INCOMPLETA: Pocas coincidencias encontradas")
    }

    if (estudiantesActualizados > 0) {
      console.log(
        `✅ ACTUALIZACIONES DETECTADAS: ${estudiantesActualizados} estudiantes actualizados`
      )
    } else {
      console.log("⚠️ NO SE DETECTARON ACTUALIZACIONES RECIENTES")
    }

    console.log(`\n⏰ Evaluación completada: ${new Date().toLocaleString()}`)
  } catch (error) {
    console.error("❌ Error durante la evaluación:", error)
    console.error("📍 Detalles:", error.message)
  }
}

evaluarModificaciones()
