// Script de depuración para probar el sistema de notificaciones
import {initializeApp} from "firebase/app"
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
} from "firebase/firestore"

// Configuración de Firebase (usar la misma del proyecto)
const firebaseConfig = {
  // Agregar configuración aquí si es necesario
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Función para crear una notificación de prueba
async function createTestNotification(teacherId) {
  try {
    const notification = {
      type: "class-invitation",
      title: "Invitación de Prueba",
      message: "Esta es una invitación de prueba para verificar el sistema",
      teacherId,
      fromUserId: "test-user",
      fromUserName: "Usuario de Prueba",
      classId: "test-class",
      className: "Clase de Prueba",
      permissions: {
        canTakeAttendance: true,
        canAddObservations: true,
        canViewAttendanceHistory: true,
      },
      status: "pending",
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    }

    const docRef = await addDoc(collection(db, "TEACHER_NOTIFICATIONS"), notification)
    console.log("Notificación de prueba creada:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error creando notificación de prueba:", error)
    throw error
  }
}

// Función para escuchar notificaciones
function listenToNotifications(teacherId) {
  const q = query(collection(db, "TEACHER_NOTIFICATIONS"), where("teacherId", "==", teacherId))

  console.log("Escuchando notificaciones para maestro:", teacherId)

  return onSnapshot(q, (querySnapshot) => {
    console.log("=== NOTIFICACIONES RECIBIDAS ===")
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log("ID:", doc.id)
      console.log("Tipo:", data.type)
      console.log("Título:", data.title)
      console.log("Estado:", data.status)
      console.log("Fecha:", data.createdAt?.toDate?.() || data.createdAt)
      console.log("---")
    })
    console.log("=== FIN NOTIFICACIONES ===")
  })
}

// Función para obtener todas las notificaciones
async function getAllNotifications(teacherId) {
  try {
    const q = query(collection(db, "TEACHER_NOTIFICATIONS"), where("teacherId", "==", teacherId))

    const querySnapshot = await getDocs(q)
    console.log("=== TODAS LAS NOTIFICACIONES ===")
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log("ID:", doc.id)
      console.log("Tipo:", data.type)
      console.log("Título:", data.title)
      console.log("Estado:", data.status)
      console.log("Fecha:", data.createdAt?.toDate?.() || data.createdAt)
      console.log("---")
    })
    console.log("=== FIN TODAS LAS NOTIFICACIONES ===")
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error)
  }
}

// Exportar funciones para uso desde la consola del navegador
window.debugNotifications = {
  createTestNotification,
  listenToNotifications,
  getAllNotifications,
}

console.log("Sistema de depuración de notificaciones cargado.")
console.log("Uso:")
console.log('- debugNotifications.createTestNotification("TEACHER_ID")')
console.log('- debugNotifications.listenToNotifications("TEACHER_ID")')
console.log('- debugNotifications.getAllNotifications("TEACHER_ID")')
