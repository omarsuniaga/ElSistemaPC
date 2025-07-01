// Script de debug para probar directamente en la consola del navegador
// Ejecutar después de que la aplicación esté cargada

console.log("🔧 Iniciando debug de clase emergente...")

// Función para probar la búsqueda de clase emergente
async function debugEmergencyClass(classId = "3sf0mBLxcam45CbTgmvK") {
  console.log(`🔍 Debuggeando clase emergente: ${classId}`)

  try {
    // 1. Probar acceso directo a Firebase
    console.log("1️⃣ Probando acceso directo a Firebase...")
    const {db} = await import("./src/firebase.js")
    const {doc, getDoc} = await import("firebase/firestore")

    const docRef = doc(db, "EMERGENCY_CLASSES", classId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      console.log("✅ Clase encontrada en Firebase:", data)
      console.log("   - Nombre:", data.className)
      console.log("   - Estudiantes:", data.selectedStudents)
      console.log("   - Fecha:", data.date)
    } else {
      console.error("❌ Clase NO encontrada en Firebase")
      return
    }

    // 2. Probar el servicio
    console.log("2️⃣ Probando el servicio getEmergencyClassByIdFirebase...")
    try {
      const {getEmergencyClassByIdFirebase} = await import(
        "./src/modulos/Attendance/service/emergencyClass.ts"
      )
      const result = await getEmergencyClassByIdFirebase(classId)
      console.log("✅ Servicio funcionando:", result)
    } catch (serviceError) {
      console.error("❌ Error en servicio:", serviceError)
    }

    // 3. Probar el store
    console.log("3️⃣ Probando el store de attendance...")
    try {
      const {useAttendanceStore} = await import("./src/modulos/Attendance/store/attendance.ts")
      const attendanceStore = useAttendanceStore()

      console.log("   3a. Probando getClassInfo...")
      const classInfo = await attendanceStore.getClassInfo(classId)
      console.log("   Resultado getClassInfo:", classInfo)

      console.log("   3b. Probando getEmergencyClassStudents...")
      const students = await attendanceStore.getEmergencyClassStudents(classId)
      console.log("   Estudiantes:", students)

      console.log("   3c. Probando isEmergencyClass...")
      const isEmergency = await attendanceStore.isEmergencyClass(classId)
      console.log("   Es emergencia:", isEmergency)
    } catch (storeError) {
      console.error("❌ Error en store:", storeError)
    }

    console.log("🎉 Debug completado")
  } catch (error) {
    console.error("💥 Error general en debug:", error)
  }
}

// Función para verificar el contexto actual
function checkCurrentContext() {
  console.log("📋 Verificando contexto actual...")
  console.log("   - URL actual:", window.location.href)
  console.log(
    "   - Pinia stores disponibles:",
    window.$pinia?._s ? Object.keys(window.$pinia._s) : "No disponible"
  )

  // Verificar si hay stores de Vue disponibles
  if (window.app?._instance?.appContext?.app?.config?.globalProperties) {
    console.log("   - App Vue disponible")
  }
}

// Exportar funciones al window para uso en consola
window.debugEmergencyClass = debugEmergencyClass
window.checkCurrentContext = checkCurrentContext

console.log("🧪 Funciones de debug cargadas:")
console.log("   - debugEmergencyClass() - prueba completa")
console.log("   - checkCurrentContext() - verifica contexto")
console.log("")
console.log("💡 Ejecuta: debugEmergencyClass()")
