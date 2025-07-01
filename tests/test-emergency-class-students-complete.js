/**
 * Test script FINAL para verificar la carga completa de estudiantes en clases emergentes
 * Run this in browser console when on AttendanceView with emergency class
 */

console.log("🎯 Testing COMPLETE Emergency Class Student Loading...")

// Test emergency class ID
const emergencyClassId = "3sf0mBLxcam45CbTgmvK"

async function testEmergencyClassStudentLoading() {
  console.log("📚 Testing emergency class student loading integration...")

  try {
    // Test 1: Verificar que estamos en la página correcta
    console.log("1. Checking current page context...")
    const currentUrl = window.location.href
    console.log("📍 Current URL:", currentUrl)

    if (!currentUrl.includes(emergencyClassId)) {
      console.log("⚠️ Not on emergency class page. Navigate to:")
      console.log(`${window.location.origin}/attendance/20250627/${emergencyClassId}`)
      return
    }

    // Test 2: Buscar elementos de estudiantes en la página
    console.log("2. Checking for student elements in the page...")

    const studentElements = document.querySelectorAll(
      '[class*="student"], [data-student], .attendance-row, tr[data-student-id]'
    )
    console.log(`👥 Found ${studentElements.length} potential student elements`)

    // Test 3: Buscar elementos de tabla de asistencia
    console.log("3. Checking attendance table structure...")

    const attendanceTable = document.querySelector("table, .attendance-table, .students-list")
    if (attendanceTable) {
      console.log("📊 Attendance table/list found")
      const rows = attendanceTable.querySelectorAll("tr, .list-item, .student-row")
      console.log(`📋 Table rows/items found: ${rows.length}`)

      // Analizar contenido de las filas
      rows.forEach((row, index) => {
        const text = row.textContent || row.innerText
        if (text && text.trim() && !text.includes("Estudiante") && !text.includes("Estado")) {
          console.log(`  Row ${index + 1}: ${text.trim().substring(0, 50)}...`)
        }
      })
    } else {
      console.log("❌ No attendance table found")
    }

    // Test 4: Verificar mensajes de estado
    console.log("4. Checking status messages...")

    const errorElements = document.querySelectorAll('[class*="error"], .bg-red')
    errorElements.forEach((element, index) => {
      const text = element.textContent || element.innerText
      if (text && text.trim()) {
        console.log(`❌ Error message ${index + 1}: ${text.trim()}`)
      }
    })

    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]')
    console.log(`⏳ Loading elements: ${loadingElements.length}`)

    // Test 5: Verificar información de la clase
    console.log("5. Checking class information display...")

    const classNameElements = document.querySelectorAll(
      'h1, h2, h3, .class-name, [class*="titulo"]'
    )
    classNameElements.forEach((element, index) => {
      const text = element.textContent || element.innerText
      if (text && text.trim() && !text.includes("Sistema") && !text.includes("Dashboard")) {
        console.log(`📋 Class info ${index + 1}: ${text.trim()}`)
      }
    })

    // Test 6: Verificar contadores de estudiantes
    console.log("6. Checking student counters...")

    const counterElements = document.querySelectorAll(
      '[class*="counter"], [class*="count"], .badge'
    )
    counterElements.forEach((element, index) => {
      const text = element.textContent || element.innerText
      if (text && text.match(/\d+.*estudiante/i)) {
        console.log(`🔢 Student counter ${index + 1}: ${text.trim()}`)
      }
    })

    // Test 7: Buscar botones de acción de asistencia
    console.log("7. Checking attendance action buttons...")

    const actionButtons = document.querySelectorAll(
      'button[class*="presente"], button[class*="ausente"], button[class*="tardanza"]'
    )
    console.log(`🎯 Attendance action buttons found: ${actionButtons.length}`)

    // Test 8: Verificar datos en almacenamiento local
    console.log("8. Checking local storage data...")

    try {
      const debugMode = window.localStorage.getItem("attendance-debug")
      console.log(`🔧 Debug mode: ${debugMode}`)

      if (debugMode !== "true") {
        console.log("💡 To enable debug mode, run:")
        console.log('window.localStorage.setItem("attendance-debug", "true")')
        console.log("Then refresh the page")
      }
    } catch (storageError) {
      console.log("⚠️ Local storage not accessible")
    }

    // Test 9: Intentar acceso directo a Firebase si está disponible
    console.log("9. Testing direct Firebase access for student data...")

    if (window.firebase && window.firebase.firestore) {
      try {
        const db = window.firebase.firestore()
        const emergencyRef = db.collection("EMERGENCY_CLASSES").doc(emergencyClassId)
        const doc = await emergencyRef.get()

        if (doc.exists) {
          const data = doc.data()
          console.log("✅ Emergency class data from Firebase:")
          console.log({
            className: data.className,
            students: data.selectedStudents?.length || 0,
            studentIds: data.selectedStudents,
          })

          if (data.selectedStudents && data.selectedStudents.length > 0) {
            console.log("👥 Student IDs in emergency class:", data.selectedStudents)

            // Verificar si estos estudiantes existen en la colección STUDENTS
            console.log("🔍 Checking if students exist in STUDENTS collection...")
            const studentsRef = db.collection("ALUMNOS")
            const studentsSnapshot = await studentsRef
              .where(
                window.firebase.firestore.FieldPath.documentId(),
                "in",
                data.selectedStudents.slice(0, 10)
              )
              .get()

            console.log(`📋 Found ${studentsSnapshot.size} student documents in ALUMNOS collection`)
            studentsSnapshot.forEach((studentDoc) => {
              const studentData = studentDoc.data()
              console.log(
                `  - ${studentDoc.id}: ${studentData.nombre || "No name"} ${studentData.apellido || ""}`
              )
            })
          }
        }
      } catch (firebaseError) {
        console.error("❌ Firebase access error:", firebaseError)
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Test específico para verificar console logs de debugging
async function testDebuggingLogs() {
  console.log("🔍 Testing debugging logs...")

  // Activar modo debug
  window.localStorage.setItem("attendance-debug", "true")
  console.log("✅ Debug mode activated")

  console.log("💡 Now refresh the page and check console for debug messages like:")
  console.log("  - [AttendanceDebug] onMounted: Cargando estudiantes de CLASE EMERGENTE...")
  console.log("  - [AttendanceDebug] ✅ Estudiantes de clase emergente obtenidos: X")
  console.log("  - [AttendanceDebug] 📋 onMounted: Total estudiantes filtrados para la clase: X")
}

// Test de navegación forzada a la clase emergente
async function testForceNavigation() {
  console.log("🧭 Testing forced navigation to emergency class...")

  const targetUrl = `/attendance/20250627/${emergencyClassId}`
  console.log(`🔗 Navigating to: ${window.location.origin}${targetUrl}`)

  window.location.href = targetUrl
}

// Función principal
async function runCompleteStudentTest() {
  console.log("🚀 Starting COMPLETE student loading test...")
  console.log("=".repeat(70))

  await testEmergencyClassStudentLoading()
  console.log("-".repeat(50))

  console.log("🏁 Complete student loading test finished")
  console.log("=".repeat(70))

  console.log("📋 VERIFICATION CHECKLIST:")
  console.log("  ✓ Emergency class name should appear (not ID)")
  console.log("  ✓ Student list should be populated with actual students")
  console.log("  ✓ Student count should be > 0")
  console.log("  ✓ Attendance buttons should be available for each student")
  console.log('  ✓ No "No se encontró la clase" errors')
  console.log("  ✓ Console should show successful student loading messages")
}

// Export functions for manual testing
window.emergencyClassStudentTests = {
  runComplete: runCompleteStudentTest,
  testStudents: testEmergencyClassStudentLoading,
  testDebug: testDebuggingLogs,
  forceNavigate: testForceNavigation,
  emergencyClassId,
}

console.log("🔧 Emergency class STUDENT test functions loaded:")
console.log("- emergencyClassStudentTests.runComplete()")
console.log("- emergencyClassStudentTests.testStudents()")
console.log("- emergencyClassStudentTests.testDebug()")
console.log("- emergencyClassStudentTests.forceNavigate()")

// Auto-run test if we're on an emergency class page
if (window.location.pathname.includes(emergencyClassId)) {
  console.log("🎯 Emergency class detected in URL, running complete student tests...")
  runCompleteStudentTest()
} else {
  console.log("ℹ️  To test student loading, navigate to:")
  console.log(`${window.location.origin}/attendance/20250627/${emergencyClassId}`)
  console.log("Or run: emergencyClassStudentTests.forceNavigate()")
}
