#!/usr/bin/env node

// Ejecutar con: node firebase-observation-migrator.js
// Script de migración completa de observaciones

import {initializeApp} from "firebase/app"
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
  connectFirestoreEmulator,
} from "firebase/firestore"
import dotenv from "dotenv"

// Cargar variables de entorno
dotenv.config()

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_APP_API_KEY,
  authDomain: process.env.VITE_APP_AUTH_DOMAIN,
  projectId: process.env.VITE_APP_PROJECT_ID,
  storageBucket: process.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_APP_ID,
}

console.log("🚀 Firebase Observation Migrator")
console.log("=================================")
console.log(`📡 Conectando a proyecto: ${firebaseConfig.projectId}`)

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Por defecto usar producción, cambiar a true para usar emuladores
const useEmulator = false

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

class ObservationMigrator {
  constructor() {
    this.allObservations = []
    this.stats = {
      asistencias: 0,
      observaciones: 0,
      observacionesClase: 0,
      duplicates: 0,
      migrated: 0,
      errors: 0,
    }
  }

  normalizeDate(dateInput) {
    if (!dateInput) {
      const now = new Date()
      return {
        date: now.toISOString().split("T")[0],
        fecha: now.toISOString().split("T")[0].replace(/-/g, ""),
      }
    }

    let dateStr = ""
    if (typeof dateInput === "string") {
      if (/^\d{8}$/.test(dateInput)) {
        // YYYYMMDD -> YYYY-MM-DD
        dateStr = `${dateInput.substring(0, 4)}-${dateInput.substring(4, 6)}-${dateInput.substring(6, 8)}`
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        dateStr = dateInput
      } else {
        dateStr = new Date(dateInput).toISOString().split("T")[0]
      }
    } else if (dateInput.toDate) {
      // Firebase Timestamp
      dateStr = dateInput.toDate().toISOString().split("T")[0]
    } else {
      dateStr = new Date(dateInput).toISOString().split("T")[0]
    }

    return {
      date: dateStr,
      fecha: dateStr.replace(/-/g, ""),
    }
  }

  generateId(prefix = "obs") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async processAsistencias() {
    console.log("\n📥 Procesando ASISTENCIAS...")

    try {
      const snapshot = await getDocs(collection(db, "ASISTENCIAS"))
      console.log(`   Encontrados ${snapshot.size} documentos de asistencia`)

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data()
        const observaciones = data.data?.observación || data.data?.observations || []

        if (Array.isArray(observaciones) && observaciones.length > 0) {
          observaciones.forEach((obs, index) => {
            try {
              const normalizedDates = this.normalizeDate(obs.fecha || obs.date || data.fecha)

              const unifiedObs = {
                id: obs.id || this.generateId("asist"),
                source: "ASISTENCIAS",
                originalDocId: docSnapshot.id,

                classId: obs.classId || data.classId || "",
                text: obs.text || obs.observacion || obs.content?.text || "",
                author: obs.author || obs.authorName || "Sistema",
                authorId: obs.authorId || data.teacherId || data.uid || "",
                ...normalizedDates,

                type: obs.type || "general",
                priority: obs.priority || "media",
                requiresFollowUp: obs.requiresFollowUp || false,

                taggedStudents: obs.taggedStudents || [],
                studentId: obs.studentId,
                studentName: obs.studentName,

                content: {
                  text: obs.text || obs.observacion || "",
                  images: obs.images || [],
                  attachments: obs.attachments || [],
                },

                createdAt: obs.createdAt || new Date(),
                updatedAt: obs.updatedAt || new Date(),
                migratedAt: new Date(),
              }

              this.allObservations.push(unifiedObs)
              this.stats.asistencias++
            } catch (error) {
              console.error(
                `   ❌ Error procesando observación ${index} de ${docSnapshot.id}:`,
                error.message
              )
              this.stats.errors++
            }
          })
        }
      })

      console.log(`   ✅ ${this.stats.asistencias} observaciones procesadas`)
    } catch (error) {
      console.error("   ❌ Error procesando ASISTENCIAS:", error.message)
      this.stats.errors++
    }
  }

  async processObservaciones() {
    console.log("\n📥 Procesando OBSERVACIONES...")

    try {
      const snapshot = await getDocs(collection(db, "OBSERVACIONES"))
      console.log(`   Encontrados ${snapshot.size} documentos`)

      snapshot.forEach((docSnapshot) => {
        try {
          const data = docSnapshot.data()
          const normalizedDates = this.normalizeDate(data.fecha || data.date)

          const unifiedObs = {
            id: docSnapshot.id,
            source: "OBSERVACIONES",
            originalDocId: docSnapshot.id,

            classId: data.classId || "",
            text: data.text || "",
            author: data.author || "Sistema",
            authorId: data.authorId || "",
            ...normalizedDates,

            type: data.type || "general",
            priority: data.priority || "media",
            requiresFollowUp: data.requiresFollowUp || false,

            taggedStudents: data.taggedStudents || [],

            content: {
              text: data.text || "",
              images: data.content?.images || [],
              attachments: data.content?.attachments || [],
            },

            createdAt: data.createdAt || new Date(),
            updatedAt: data.updatedAt || new Date(),
            migratedAt: new Date(),
          }

          this.allObservations.push(unifiedObs)
          this.stats.observaciones++
        } catch (error) {
          console.error(`   ❌ Error procesando ${docSnapshot.id}:`, error.message)
          this.stats.errors++
        }
      })

      console.log(`   ✅ ${this.stats.observaciones} observaciones procesadas`)
    } catch (error) {
      console.error("   ❌ Error procesando OBSERVACIONES:", error.message)
      this.stats.errors++
    }
  }

  async processObservacionesClase() {
    console.log("\n📥 Procesando OBSERVACIONES_CLASE...")

    try {
      const snapshot = await getDocs(collection(db, "OBSERVACIONES_CLASE"))
      console.log(`   Encontrados ${snapshot.size} documentos`)

      snapshot.forEach((docSnapshot) => {
        try {
          const data = docSnapshot.data()
          const normalizedDates = this.normalizeDate(data.date)

          const unifiedObs = {
            id: data.id || docSnapshot.id,
            source: "OBSERVACIONES_CLASE",
            originalDocId: docSnapshot.id,

            classId: data.classId || "",
            text: data.text || "",
            author: data.author || "Sistema",
            authorId: data.authorId || "",
            ...normalizedDates,

            type: "general",
            priority: "media",
            requiresFollowUp: false,

            content: {
              text: data.text || "",
            },

            createdAt: data.createdAt || new Date(),
            updatedAt: new Date(),
            timestamp: data.timestamp,
            migratedAt: new Date(),
          }

          this.allObservations.push(unifiedObs)
          this.stats.observacionesClase++
        } catch (error) {
          console.error(`   ❌ Error procesando ${docSnapshot.id}:`, error.message)
          this.stats.errors++
        }
      })

      console.log(`   ✅ ${this.stats.observacionesClase} observaciones procesadas`)
    } catch (error) {
      console.error("   ❌ Error procesando OBSERVACIONES_CLASE:", error.message)
      this.stats.errors++
    }
  }

  deduplicateObservations() {
    console.log("\n🧹 Eliminando duplicados...")

    const seen = new Set()
    const deduplicated = []

    for (const obs of this.allObservations) {
      const key = `${obs.classId}_${obs.text}_${obs.date}_${obs.authorId}`

      if (seen.has(key)) {
        this.stats.duplicates++
        console.log(`   🔄 Duplicado: ${obs.id} (${obs.source})`)
      } else {
        seen.add(key)
        deduplicated.push(obs)
      }
    }

    this.allObservations = deduplicated
    console.log(`   ✅ ${this.stats.duplicates} duplicados eliminados`)
  }

  async migrateToFirestore() {
    console.log(`\n💾 Migrando ${this.allObservations.length} observaciones...`)

    const batchSize = 500
    let processed = 0

    while (processed < this.allObservations.length) {
      const batch = writeBatch(db)
      const batchItems = this.allObservations.slice(processed, processed + batchSize)

      for (const obs of batchItems) {
        const docRef = doc(db, "OBSERVACIONES_UNIFICADAS", obs.id)
        batch.set(docRef, obs)
      }

      try {
        await batch.commit()
        processed += batchItems.length
        this.stats.migrated += batchItems.length
        console.log(`   📦 ${processed}/${this.allObservations.length} observaciones migradas`)
      } catch (error) {
        console.error(
          `   ❌ Error en batch ${processed}-${processed + batchItems.length}:`,
          error.message
        )
        this.stats.errors++
        break
      }
    }

    console.log("   ✅ Migración completada")
  }

  generateReport() {
    console.log("\n📊 REPORTE FINAL")
    console.log("================")
    console.log(`🗃️  ASISTENCIAS:          ${this.stats.asistencias}`)
    console.log(`📝 OBSERVACIONES:         ${this.stats.observaciones}`)
    console.log(`🏫 OBSERVACIONES_CLASE:   ${this.stats.observacionesClase}`)
    console.log(`🔄 Duplicados eliminados: ${this.stats.duplicates}`)
    console.log(`❌ Errores:               ${this.stats.errors}`)
    console.log(`✅ Migradas exitosamente: ${this.stats.migrated}`)
    console.log(`📂 Colección destino:     OBSERVACIONES_UNIFICADAS`)

    if (this.allObservations.length > 0) {
      console.log("\n📋 EJEMPLOS MIGRADOS:")
      this.allObservations.slice(0, 2).forEach((obs, i) => {
        console.log(`\n${i + 1}. ${obs.id}`)
        console.log(`   📁 Fuente: ${obs.source}`)
        console.log(`   🏫 Clase: ${obs.classId}`)
        console.log(`   📝 Texto: ${obs.text.substring(0, 60)}...`)
        console.log(`   👤 Autor: ${obs.author} (${obs.date})`)
      })
    }
  }

  async run() {
    console.log("\n🚀 INICIANDO MIGRACIÓN...")

    try {
      await this.processAsistencias()
      await this.processObservaciones()
      await this.processObservacionesClase()

      this.deduplicateObservations()
      await this.migrateToFirestore()

      this.generateReport()

      console.log("\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!")
    } catch (error) {
      console.error("\n❌ ERROR DURANTE LA MIGRACIÓN:", error)
    }
  }
}

// Función principal
async function main() {
  console.log("\n⚠️  IMPORTANTE: Esta operación creará la colección OBSERVACIONES_UNIFICADAS")
  console.log("   Los datos originales NO serán modificados.")
  console.log("\n¿Deseas continuar? (Ctrl+C para cancelar)")

  // Esperar 3 segundos antes de continuar
  await new Promise((resolve) => setTimeout(resolve, 3000))

  const migrator = new ObservationMigrator()
  await migrator.run()
  process.exit(0)
}

// Ejecutar
main().catch((error) => {
  console.error("❌ Error fatal:", error)
  process.exit(1)
})
