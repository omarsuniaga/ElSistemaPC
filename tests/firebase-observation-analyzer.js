#!/usr/bin/env node

// Ejecutar con: node firebase-observation-analyzer.js
// Este script usa tu configuración de Firebase existente

import {initializeApp} from "firebase/app"
import {getFirestore, collection, getDocs, connectFirestoreEmulator} from "firebase/firestore"
import dotenv from "dotenv"

// Cargar variables de entorno
dotenv.config()

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: process.env.VITE_APP_API_KEY,
  authDomain: process.env.VITE_APP_AUTH_DOMAIN,
  projectId: process.env.VITE_APP_PROJECT_ID,
  storageBucket: process.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_APP_ID,
}

console.log("🔥 Firebase Observation Analyzer")
console.log("================================")
console.log(`📡 Conectando a proyecto: ${firebaseConfig.projectId}`)

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Por defecto usar producción, comentar para usar emuladores
const useEmulator = false // Cambiar a true para usar emuladores

if (useEmulator) {
  try {
    connectFirestoreEmulator(db, "localhost", 8080)
    console.log("🔌 Conectado a Firestore Emulator en localhost:8080")
  } catch (error) {
    console.log("⚠️  No se pudo conectar al emulador, usando Firebase en producción")
  }
} else {
  console.log("🌐 Usando Firebase en producción")
}

class FirebaseObservationAnalyzer {
  constructor() {
    this.stats = {
      asistencias: {total: 0, withObs: 0, totalObs: 0},
      observaciones: {total: 0},
      observacionesClase: {total: 0},
      unificadas: {total: 0},
    }
  }

  async analyzeAsistencias() {
    console.log("📊 Analizando colección ASISTENCIAS...")

    try {
      const snapshot = await getDocs(collection(db, "ASISTENCIAS"))
      this.stats.asistencias.total = snapshot.size

      snapshot.forEach((doc) => {
        const data = doc.data()
        const observaciones = data.data?.observación || data.data?.observations || []

        if (Array.isArray(observaciones) && observaciones.length > 0) {
          this.stats.asistencias.withObs++
          this.stats.asistencias.totalObs += observaciones.length

          // Mostrar ejemplo
          if (this.stats.asistencias.withObs === 1) {
            console.log("\n📋 Ejemplo de observación en ASISTENCIAS:")
            console.log(`   Doc ID: ${doc.id}`)
            console.log(`   Fecha: ${data.fecha}`)
            console.log(`   Clase: ${data.classId}`)
            console.log(`   Observaciones encontradas: ${observaciones.length}`)
            console.log(`   Primera observación:`, observaciones[0])
          }
        }
      })

      console.log(
        `✅ ASISTENCIAS: ${this.stats.asistencias.total} docs, ${this.stats.asistencias.withObs} con observaciones, ${this.stats.asistencias.totalObs} observaciones totales`
      )
    } catch (error) {
      console.error("❌ Error analizando ASISTENCIAS:", error.message)
    }
  }

  async analyzeObservaciones() {
    console.log("\n📊 Analizando colección OBSERVACIONES...")

    try {
      const snapshot = await getDocs(collection(db, "OBSERVACIONES"))
      this.stats.observaciones.total = snapshot.size

      if (snapshot.size > 0) {
        const firstDoc = snapshot.docs[0]
        console.log("\n📋 Ejemplo de OBSERVACIONES:")
        console.log(`   Doc ID: ${firstDoc.id}`)
        console.log("   Datos:", firstDoc.data())
      }

      console.log(`✅ OBSERVACIONES: ${this.stats.observaciones.total} documentos`)
    } catch (error) {
      console.error("❌ Error analizando OBSERVACIONES:", error.message)
    }
  }

  async analyzeObservacionesClase() {
    console.log("\n📊 Analizando colección OBSERVACIONES_CLASE...")

    try {
      const snapshot = await getDocs(collection(db, "OBSERVACIONES_CLASE"))
      this.stats.observacionesClase.total = snapshot.size

      if (snapshot.size > 0) {
        const firstDoc = snapshot.docs[0]
        console.log("\n📋 Ejemplo de OBSERVACIONES_CLASE:")
        console.log(`   Doc ID: ${firstDoc.id}`)
        console.log("   Datos:", firstDoc.data())
      }

      console.log(`✅ OBSERVACIONES_CLASE: ${this.stats.observacionesClase.total} documentos`)
    } catch (error) {
      console.error("❌ Error analizando OBSERVACIONES_CLASE:", error.message)
    }
  }

  async checkUnified() {
    console.log("\n📊 Verificando colección OBSERVACIONES_UNIFICADAS...")

    try {
      const snapshot = await getDocs(collection(db, "OBSERVACIONES_UNIFICADAS"))
      this.stats.unificadas.total = snapshot.size

      if (snapshot.size > 0) {
        console.log(
          `✅ OBSERVACIONES_UNIFICADAS: ${this.stats.unificadas.total} documentos ya migrados`
        )

        const firstDoc = snapshot.docs[0]
        console.log("\n📋 Ejemplo de observación unificada:")
        console.log(`   Doc ID: ${firstDoc.id}`)
        console.log("   Datos:", firstDoc.data())
      } else {
        console.log("📭 OBSERVACIONES_UNIFICADAS: Colección vacía o no existe")
      }
    } catch (error) {
      console.log("📭 OBSERVACIONES_UNIFICADAS: No existe aún")
    }
  }

  generateReport() {
    const totalObservations =
      this.stats.asistencias.totalObs +
      this.stats.observaciones.total +
      this.stats.observacionesClase.total

    console.log("\n📊 REPORTE FINAL")
    console.log("================")
    console.log(`🗃️  ASISTENCIAS:          ${this.stats.asistencias.totalObs} observaciones`)
    console.log(`📝 OBSERVACIONES:         ${this.stats.observaciones.total} documentos`)
    console.log(`🏫 OBSERVACIONES_CLASE:   ${this.stats.observacionesClase.total} documentos`)
    console.log(`✅ OBSERVACIONES_UNIFICADAS: ${this.stats.unificadas.total} documentos`)
    console.log(`📊 TOTAL ENCONTRADO:      ${totalObservations} observaciones`)

    console.log("\n💡 RECOMENDACIONES:")
    if (this.stats.unificadas.total > 0) {
      console.log("✅ Ya tienes observaciones migradas en OBSERVACIONES_UNIFICADAS")
      console.log("🔄 Puedes actualizar tu código para usar esta colección")
    } else if (totalObservations > 0) {
      console.log("🚀 Se recomienda ejecutar la migración")
      console.log("📝 Ejecuta: node firebase-observation-migrator.js")
    } else {
      console.log("ℹ️  No se encontraron observaciones para migrar")
    }
  }

  async run() {
    try {
      await this.analyzeAsistencias()
      await this.analyzeObservaciones()
      await this.analyzeObservacionesClase()
      await this.checkUnified()

      this.generateReport()

      console.log("\n🎉 Análisis completado exitosamente!")
    } catch (error) {
      console.error("\n❌ Error durante el análisis:", error)
    }
  }
}

// Función principal
async function main() {
  const analyzer = new FirebaseObservationAnalyzer()
  await analyzer.run()
  process.exit(0)
}

// Ejecutar
main().catch((error) => {
  console.error("❌ Error fatal:", error)
  process.exit(1)
})
