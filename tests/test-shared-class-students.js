// Script para probar la carga de estudiantes en clases compartidas
// Este script debe ejecutarse en la consola del navegador

async function testSharedClassStudents(classId) {
  console.log(`🧪 [TEST] Iniciando prueba para clase compartida: ${classId}`)

  try {
    // 1. Verificar si la clase existe
    console.log(`1️⃣ Verificando existencia de clase...`)
    const classesStore = window.$pinia.state.value.classes
    const classData = classesStore?.classes?.find((c) => c.id === classId)

    if (!classData) {
      console.log(`❌ Clase ${classId} no encontrada en el store`)

      // Intentar cargar la clase directamente desde Firestore
      const {getClassByIdFirestore} = await import("/src/modulos/Classes/service/classes.ts")
      const firestoreClass = await getClassByIdFirestore(classId)

      if (firestoreClass) {
        console.log(`✅ Clase encontrada en Firestore:`, firestoreClass)
      } else {
        console.log(`❌ Clase no encontrada en Firestore`)
        return
      }
    } else {
      console.log(`✅ Clase encontrada en store:`, classData)
      console.log(`📊 Estudiantes en la clase: ${classData.studentIds?.length || 0}`)
    }

    // 2. Probar la carga de estudiantes
    console.log(`2️⃣ Probando carga de estudiantes...`)
    const studentsStore = window.$pinia.state.value.students

    // Método actual
    const currentStudents = studentsStore?.getStudentsByClass?.(classId) || []
    console.log(`📝 Método actual - Estudiantes encontrados: ${currentStudents.length}`)

    // Método nuevo (directo desde Firestore)
    const {getStudentsByClassFirebase} = await import("/src/modulos/Students/service/students.ts")
    const firestoreStudents = await getStudentsByClassFirebase(classId)
    console.log(`🔥 Método Firestore - Estudiantes encontrados: ${firestoreStudents.length}`)

    // 3. Comparar resultados
    console.log(`3️⃣ Comparando resultados...`)
    if (currentStudents.length !== firestoreStudents.length) {
      console.log(`⚠️ DISCREPANCIA ENCONTRADA:`)
      console.log(`   Store actual: ${currentStudents.length} estudiantes`)
      console.log(`   Firestore directo: ${firestoreStudents.length} estudiantes`)
      console.log(
        `   Diferencia: ${firestoreStudents.length - currentStudents.length} estudiantes perdidos`
      )
    } else {
      console.log(`✅ Ambos métodos devuelven la misma cantidad de estudiantes`)
    }

    // 4. Mostrar detalles de estudiantes
    console.log(
      `4️⃣ Detalles de estudiantes (Firestore):`,
      firestoreStudents.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        apellido: s.apellido,
      }))
    )

    return {
      classFound: !!classData,
      currentCount: currentStudents.length,
      firestoreCount: firestoreStudents.length,
      discrepancy: firestoreStudents.length - currentStudents.length,
      students: firestoreStudents,
    }
  } catch (error) {
    console.error(`❌ Error en la prueba:`, error)
    return null
  }
}

// Función para probar el acceso de maestros asistentes
async function testAssistantTeacherAccess(teacherId, classId) {
  console.log(`👥 [TEST] Probando acceso de maestro asistente: ${teacherId} a clase: ${classId}`)

  try {
    // 1. Verificar si el maestro tiene acceso a la clase
    const {getClassByIdFirestore} = await import("/src/modulos/Classes/service/classes.ts")
    const classData = await getClassByIdFirestore(classId)

    if (!classData) {
      console.log(`❌ Clase ${classId} no encontrada`)
      return false
    }

    console.log(`✅ Clase encontrada:`, classData)

    // 2. Verificar permisos
    const isTitular = classData.teacherId === teacherId
    const isAssistant = classData.teachers?.some(
      (t) => t.teacherId === teacherId && (t.role === "assistant" || t.role === "asistente")
    )

    console.log(`🎓 Es maestro titular: ${isTitular}`)
    console.log(`🤝 Es maestro asistente: ${isAssistant}`)
    console.log(`✅ Tiene acceso: ${isTitular || isAssistant}`)

    if (isAssistant) {
      console.log(`👥 Maestros de la clase:`, classData.teachers)
    }

    return isTitular || isAssistant
  } catch (error) {
    console.error(`❌ Error verificando acceso:`, error)
    return false
  }
}

// Exportar funciones para uso en consola
window.testSharedClassStudents = testSharedClassStudents
window.testAssistantTeacherAccess = testAssistantTeacherAccess

console.log(`🧪 Funciones de prueba cargadas:`)
console.log(`   - testSharedClassStudents(classId)`)
console.log(`   - testAssistantTeacherAccess(teacherId, classId)`)
console.log(`📖 Ejemplo de uso:`)
console.log(`   testSharedClassStudents('6URLsR4hz1U3OkphzG2o')`)
console.log(`   testAssistantTeacherAccess('pzoktB8EIdYNKq8wc23YQbE3jWF3', '6URLsR4hz1U3OkphzG2o')`)
