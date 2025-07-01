// Script para limpiar notificaciones inválidas existentes en la base de datos
// Ejecutar en la consola del navegador cuando esté logueado como administrador

async function cleanupInvalidNotifications() {
  console.log("🧹 Iniciando limpieza de notificaciones inválidas...")

  try {
    // Importar Firebase
    const {collection, query, where, getDocs, doc, updateDoc, deleteDoc} = await import(
      "firebase/firestore"
    )
    const {db} = await import("./src/firebase.js")

    console.log("📋 Buscando notificaciones inválidas...")

    // Buscar notificaciones de maestros inválidas
    const teacherNotificationsQuery = query(
      collection(db, "TEACHER_NOTIFICATIONS"),
      where("status", "==", "invalid")
    )

    const teacherNotificationsSnapshot = await getDocs(teacherNotificationsQuery)
    console.log(
      `📊 Encontradas ${teacherNotificationsSnapshot.size} notificaciones de maestros inválidas`
    )

    // Buscar notificaciones generales inválidas
    const generalNotificationsQuery = query(
      collection(db, "GENERAL_NOTIFICATIONS"),
      where("status", "==", "invalid")
    )

    const generalNotificationsSnapshot = await getDocs(generalNotificationsQuery)
    console.log(
      `📊 Encontradas ${generalNotificationsSnapshot.size} notificaciones generales inválidas`
    )

    // Opción 1: Eliminar completamente las notificaciones inválidas
    const deleteInvalid = confirm(
      "¿Deseas ELIMINAR completamente las notificaciones inválidas? (Recomendado)"
    )

    if (deleteInvalid) {
      console.log("🗑️ Eliminando notificaciones inválidas...")

      // Eliminar notificaciones de maestros inválidas
      for (const docSnapshot of teacherNotificationsSnapshot.docs) {
        await deleteDoc(doc(db, "TEACHER_NOTIFICATIONS", docSnapshot.id))
        console.log(`✅ Eliminada notificación de maestro: ${docSnapshot.id}`)
      }

      // Eliminar notificaciones generales inválidas
      for (const docSnapshot of generalNotificationsSnapshot.docs) {
        await deleteDoc(doc(db, "GENERAL_NOTIFICATIONS", docSnapshot.id))
        console.log(`✅ Eliminada notificación general: ${docSnapshot.id}`)
      }

      console.log("🎉 Limpieza completada. Todas las notificaciones inválidas han sido eliminadas.")
    } else {
      // Opción 2: Solo marcar como limpiadas (mantener para auditoría)
      console.log("🏷️ Marcando notificaciones inválidas como limpiadas...")

      for (const docSnapshot of teacherNotificationsSnapshot.docs) {
        await updateDoc(doc(db, "TEACHER_NOTIFICATIONS", docSnapshot.id), {
          status: "cleaned",
          cleanedAt: new Date(),
          cleanedBy: "admin-script",
        })
        console.log(`🏷️ Marcada como limpiada: ${docSnapshot.id}`)
      }

      for (const docSnapshot of generalNotificationsSnapshot.docs) {
        await updateDoc(doc(db, "GENERAL_NOTIFICATIONS", docSnapshot.id), {
          status: "cleaned",
          cleanedAt: new Date(),
          cleanedBy: "admin-script",
        })
        console.log(`🏷️ Marcada como limpiada: ${docSnapshot.id}`)
      }

      console.log(
        "🎉 Marcado completado. Las notificaciones inválidas han sido marcadas como limpiadas."
      )
    }

    console.log("✅ Proceso de limpieza terminado exitosamente.")
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error)
  }
}

async function listInvalidNotifications() {
  console.log("📋 Listando notificaciones inválidas...")

  try {
    const {collection, query, where, getDocs} = await import("firebase/firestore")
    const {db} = await import("./src/firebase.js")

    // Buscar notificaciones de maestros inválidas
    const teacherNotificationsQuery = query(
      collection(db, "TEACHER_NOTIFICATIONS"),
      where("status", "==", "invalid")
    )

    const teacherNotificationsSnapshot = await getDocs(teacherNotificationsQuery)

    console.log("🧑‍🏫 Notificaciones de maestros inválidas:")
    teacherNotificationsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      console.log(`  📄 ID: ${doc.id}`)
      console.log(`     Tipo: ${data.type}`)
      console.log(`     Título: ${data.title}`)
      console.log(`     Clase ID: ${data.classId || "N/A"}`)
      console.log(`     Maestro ID: ${data.teacherId}`)
      console.log(`     Fecha: ${data.createdAt?.toDate?.() || data.createdAt}`)
      console.log(`     Razón inválida: ${data.invalidReason || "No especificada"}`)
      console.log("")
    })

    // Buscar notificaciones generales inválidas
    const generalNotificationsQuery = query(
      collection(db, "GENERAL_NOTIFICATIONS"),
      where("status", "==", "invalid")
    )

    const generalNotificationsSnapshot = await getDocs(generalNotificationsQuery)

    console.log("📢 Notificaciones generales inválidas:")
    generalNotificationsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      console.log(`  📄 ID: ${doc.id}`)
      console.log(`     Tipo: ${data.type}`)
      console.log(`     Título: ${data.title}`)
      console.log(`     Maestro ID: ${data.teacherId}`)
      console.log(`     Fecha: ${data.createdAt?.toDate?.() || data.createdAt}`)
      console.log("")
    })

    console.log(
      `📊 Total: ${teacherNotificationsSnapshot.size + generalNotificationsSnapshot.size} notificaciones inválidas`
    )
  } catch (error) {
    console.error("❌ Error listando notificaciones:", error)
  }
}

// Exportar funciones
window.cleanupInvalidNotifications = cleanupInvalidNotifications
window.listInvalidNotifications = listInvalidNotifications

console.log("🔧 Scripts de limpieza de notificaciones cargados.")
console.log("📝 Uso:")
console.log("  - listInvalidNotifications(): Lista todas las notificaciones inválidas")
console.log("  - cleanupInvalidNotifications(): Limpia las notificaciones inválidas")
console.log("")
console.log("⚠️  Ejecutar solo cuando estés logueado como administrador")
