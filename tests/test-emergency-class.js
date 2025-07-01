// Script de prueba para verificar que las clases emergentes funcionan correctamente
// Para ejecutar desde la consola del navegador cuando esté logueado

async function testEmergencyClassIntegration() {
  console.log("🔬 Iniciando prueba de integración de clases emergentes...")

  try {
    // Obtener el store de attendance
    const {useAttendanceStore} = await import("./src/modulos/Attendance/store/attendance.ts")
    const attendanceStore = useAttendanceStore()

    // ID de ejemplo de clase emergente (reemplazar con ID real)
    const testEmergencyClassId = "3sf0mBLxcam45CbTgmvK"

    console.log("📋 1. Probando getClassInfo...")
    const classInfo = await attendanceStore.getClassInfo(testEmergencyClassId)
    console.log("Resultado getClassInfo:", classInfo)

    if (classInfo) {
      console.log("📋 2. Probando getEmergencyClassStudents...")
      const students = await attendanceStore.getEmergencyClassStudents(testEmergencyClassId)
      console.log("Estudiantes encontrados:", students)

      console.log("📋 3. Probando isEmergencyClass...")
      const isEmergency = await attendanceStore.isEmergencyClass(testEmergencyClassId)
      console.log("Es clase emergente:", isEmergency)

      console.log("✅ Todas las pruebas completadas exitosamente!")
      return {
        success: true,
        classInfo,
        students,
        isEmergency,
      }
    } else {
      console.warn("⚠️ No se encontró información de la clase. Posibles causas:")
      console.warn("   - El ID no existe en EMERGENCY_CLASSES")
      console.warn("   - El ID no existe en documentos de asistencia")
      console.warn("   - El ID no existe en clases regulares")

      return {
        success: false,
        error: "Clase no encontrada",
      }
    }
  } catch (error) {
    console.error("❌ Error durante la prueba:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Función de ayuda para inspeccionar una clase específica
async function inspectEmergencyClass(classId) {
  console.log(`🔍 Inspeccionando clase ${classId}...`)

  try {
    const {getEmergencyClassByIdFirebase} = await import(
      "./src/modulos/Attendance/service/emergencyClass.ts"
    )

    const emergencyClass = await getEmergencyClassByIdFirebase(classId)

    if (emergencyClass) {
      console.log("📊 Datos encontrados en EMERGENCY_CLASSES:")
      console.log("   - ID:", emergencyClass.id)
      console.log("   - Nombre:", emergencyClass.className)
      console.log("   - Profesor:", emergencyClass.teacherId)
      console.log("   - Fecha:", emergencyClass.date)
      console.log("   - Estado:", emergencyClass.status)
      console.log("   - Estudiantes:", emergencyClass.selectedStudents)

      return emergencyClass
    } else {
      console.warn(`⚠️ No se encontró la clase ${classId} en EMERGENCY_CLASSES`)
      return null
    }
  } catch (error) {
    console.error("❌ Error inspeccionando clase:", error)
    return null
  }
}

// Exportar las funciones para uso en consola
window.testEmergencyClassIntegration = testEmergencyClassIntegration
window.inspectEmergencyClass = inspectEmergencyClass

console.log("🧪 Scripts de prueba cargados. Usa:")
console.log("   - testEmergencyClassIntegration() para prueba completa")
console.log('   - inspectEmergencyClass("ID_AQUI") para inspeccionar clase específica')
