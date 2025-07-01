// Script simple para ejecutar en consola del navegador o en Node.js
// Migración de observaciones de múltiples colecciones a estructura unificada

console.log("🚀 Iniciando migración de observaciones...")

// Función para ejecutar en la consola del navegador Firebase
async function migrateObservationsInBrowser() {
  // Asegúrate de que Firebase esté disponible globalmente
  if (typeof firebase === "undefined") {
    console.error("❌ Firebase no está disponible. Asegúrate de estar en la consola de Firebase.")
    return
  }

  const db = firebase.firestore()
  const stats = {
    asistencias: 0,
    observaciones: 0,
    observacionesClase: 0,
    unificadas: 0,
    errores: 0,
  }

  console.log("📊 Analizando colecciones...")

  try {
    // 1. Analizar ASISTENCIAS
    console.log("🔍 Analizando ASISTENCIAS...")
    const asistenciasSnapshot = await db.collection("ASISTENCIAS").get()

    asistenciasSnapshot.forEach((doc) => {
      const data = doc.data()
      const observaciones = data.data?.observación || data.data?.observations || []
      if (Array.isArray(observaciones)) {
        stats.asistencias += observaciones.length
      }
    })

    // 2. Analizar OBSERVACIONES
    console.log("🔍 Analizando OBSERVACIONES...")
    const observacionesSnapshot = await db.collection("OBSERVACIONES").get()
    stats.observaciones = observacionesSnapshot.size

    // 3. Analizar OBSERVACIONES_CLASE
    console.log("🔍 Analizando OBSERVACIONES_CLASE...")
    const observacionesClaseSnapshot = await db.collection("OBSERVACIONES_CLASE").get()
    stats.observacionesClase = observacionesClaseSnapshot.size

    // 4. Verificar si ya existe colección unificada
    const unificadasSnapshot = await db.collection("OBSERVACIONES_UNIFICADAS").get()
    stats.unificadas = unificadasSnapshot.size

    // Mostrar estadísticas
    console.log("\n📊 ESTADÍSTICAS ACTUALES:")
    console.log("==========================")
    console.log(`🗃️  ASISTENCIAS.data.observación: ${stats.asistencias} observaciones`)
    console.log(`📝 OBSERVACIONES:                  ${stats.observaciones} documentos`)
    console.log(`🏫 OBSERVACIONES_CLASE:            ${stats.observacionesClase} documentos`)
    console.log(`✅ OBSERVACIONES_UNIFICADAS:       ${stats.unificadas} documentos`)
    console.log(
      `📊 TOTAL OBSERVACIONES:            ${stats.asistencias + stats.observaciones + stats.observacionesClase}`
    )

    if (stats.unificadas === 0) {
      console.log("\n💡 RECOMENDACIÓN: Ejecutar migración completa")
      console.log("Ejecuta: migrateAllObservations() para unificar todas las observaciones")
    } else {
      console.log("\n✅ Ya existe colección unificada con observaciones")
    }
  } catch (error) {
    console.error("❌ Error durante el análisis:", error)
  }
}

// Función para migrar todas las observaciones
async function migrateAllObservations() {
  if (typeof firebase === "undefined") {
    console.error("❌ Firebase no está disponible.")
    return
  }

  const db = firebase.firestore()
  const batch = db.batch()
  let processedCount = 0
  const allObservations = []

  console.log("🚀 Iniciando migración completa...")

  try {
    // 1. Migrar desde ASISTENCIAS
    console.log("📥 Procesando ASISTENCIAS...")
    const asistenciasSnapshot = await db.collection("ASISTENCIAS").get()

    asistenciasSnapshot.forEach((doc) => {
      const data = doc.data()
      const observaciones = data.data?.observación || data.data?.observations || []

      if (Array.isArray(observaciones) && observaciones.length > 0) {
        observaciones.forEach((obs, index) => {
          const obsId = obs.id || `asist_${doc.id}_${index}_${Date.now()}`

          const unifiedObs = {
            id: obsId,
            source: "ASISTENCIAS",
            originalDocId: doc.id,
            classId: obs.classId || data.classId || "",
            text: obs.text || obs.observacion || obs.content?.text || "",
            author: obs.author || obs.authorName || "Sistema",
            authorId: obs.authorId || data.teacherId || data.uid || "",
            date: formatDate(obs.fecha || obs.date || data.fecha),
            fecha: formatFecha(obs.fecha || obs.date || data.fecha),
            type: obs.type || "general",
            priority: obs.priority || "media",
            requiresFollowUp: obs.requiresFollowUp || false,
            taggedStudents: obs.taggedStudents || [],
            studentId: obs.studentId,
            studentName: obs.studentName,
            content: {
              text: obs.text || obs.observacion || "",
              images: obs.images || [],
            },
            createdAt: obs.createdAt || firebase.firestore.Timestamp.now(),
            updatedAt: firebase.firestore.Timestamp.now(),
            migratedAt: firebase.firestore.Timestamp.now(),
          }

          allObservations.push(unifiedObs)

          const docRef = db.collection("OBSERVACIONES_UNIFICADAS").doc(obsId)
          batch.set(docRef, unifiedObs)
          processedCount++
        })
      }
    })

    // 2. Migrar desde OBSERVACIONES
    console.log("📥 Procesando OBSERVACIONES...")
    const observacionesSnapshot = await db.collection("OBSERVACIONES").get()

    observacionesSnapshot.forEach((doc) => {
      const data = doc.data()

      const unifiedObs = {
        id: doc.id,
        source: "OBSERVACIONES",
        originalDocId: doc.id,
        classId: data.classId || "",
        text: data.text || "",
        author: data.author || "Sistema",
        authorId: data.authorId || "",
        date: formatDate(data.fecha || data.date),
        fecha: formatFecha(data.fecha || data.date),
        type: data.type || "general",
        priority: data.priority || "media",
        requiresFollowUp: data.requiresFollowUp || false,
        taggedStudents: data.taggedStudents || [],
        content: {
          text: data.text || "",
          images: data.content?.images || [],
        },
        createdAt: data.createdAt || firebase.firestore.Timestamp.now(),
        updatedAt: data.updatedAt || firebase.firestore.Timestamp.now(),
        migratedAt: firebase.firestore.Timestamp.now(),
      }

      allObservations.push(unifiedObs)

      const docRef = db.collection("OBSERVACIONES_UNIFICADAS").doc(doc.id)
      batch.set(docRef, unifiedObs)
      processedCount++
    })

    // 3. Migrar desde OBSERVACIONES_CLASE
    console.log("📥 Procesando OBSERVACIONES_CLASE...")
    const observacionesClaseSnapshot = await db.collection("OBSERVACIONES_CLASE").get()

    observacionesClaseSnapshot.forEach((doc) => {
      const data = doc.data()
      const obsId = data.id || doc.id

      const unifiedObs = {
        id: obsId,
        source: "OBSERVACIONES_CLASE",
        originalDocId: doc.id,
        classId: data.classId || "",
        text: data.text || "",
        author: data.author || "Sistema",
        authorId: data.authorId || "",
        date: formatDate(data.date),
        fecha: formatFecha(data.date),
        type: "general",
        priority: "media",
        requiresFollowUp: false,
        content: {
          text: data.text || "",
        },
        createdAt: data.createdAt || firebase.firestore.Timestamp.now(),
        updatedAt: firebase.firestore.Timestamp.now(),
        timestamp: data.timestamp,
        migratedAt: firebase.firestore.Timestamp.now(),
      }

      allObservations.push(unifiedObs)

      const docRef = db.collection("OBSERVACIONES_UNIFICADAS").doc(obsId)
      batch.set(docRef, unifiedObs)
      processedCount++
    })

    // Ejecutar batch
    console.log(`💾 Guardando ${processedCount} observaciones...`)
    await batch.commit()

    console.log("\n🎉 ¡MIGRACIÓN COMPLETADA!")
    console.log("==========================")
    console.log(`✅ ${processedCount} observaciones migradas`)
    console.log(`📂 Nueva colección: OBSERVACIONES_UNIFICADAS`)

    // Mostrar ejemplos
    console.log("\n📋 EJEMPLOS DE OBSERVACIONES UNIFICADAS:")
    allObservations.slice(0, 3).forEach((obs, index) => {
      console.log(`\n${index + 1}. ${obs.id}`)
      console.log(`   📁 Fuente: ${obs.source}`)
      console.log(`   🏫 Clase: ${obs.classId}`)
      console.log(`   📝 Texto: ${obs.text.substring(0, 80)}...`)
      console.log(`   👤 Autor: ${obs.author}`)
      console.log(`   📅 Fecha: ${obs.date}`)
    })
  } catch (error) {
    console.error("❌ Error durante la migración:", error)
  }
}

// Funciones auxiliares
function formatDate(dateInput) {
  if (!dateInput) return new Date().toISOString().split("T")[0]

  if (typeof dateInput === "string") {
    if (/^\d{8}$/.test(dateInput)) {
      // YYYYMMDD -> YYYY-MM-DD
      return `${dateInput.substring(0, 4)}-${dateInput.substring(4, 6)}-${dateInput.substring(6, 8)}`
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput
    }
  }

  const date = new Date(dateInput)
  return date.toISOString().split("T")[0]
}

function formatFecha(dateInput) {
  const date = formatDate(dateInput)
  return date.replace(/-/g, "")
}

// Exponer funciones globalmente
window.migrateObservationsInBrowser = migrateObservationsInBrowser
window.migrateAllObservations = migrateAllObservations

console.log("✅ Script cargado. Funciones disponibles:")
console.log("📊 migrateObservationsInBrowser() - Analizar colecciones")
console.log("🚀 migrateAllObservations() - Migrar todas las observaciones")
console.log("\n💡 Ejecuta primero: migrateObservationsInBrowser()")
