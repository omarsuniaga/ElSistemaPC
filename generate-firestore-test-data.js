// Script para generar datos de prueba basados en la estructura real de Firestore
// Basado en la clase real: 6URLsR4hz1U3OkphzGZo

window.generateFirestoreTestData = () => {
  console.log("🏗️  Generando datos de prueba con estructura de Firestore...")

  const testClasses = [
    // Clase real de Firestore (adaptada)
    {
      id: "6URLsR4hz1U3OkphzGZo",
      name: "Clase de Piano - Nivel Intermedio",
      description:
        "Clase de piano para estudiantes intermedios con enfoque en técnica y repertorio clásico",
      instrument: "Piano",
      level: "intermedio",
      teacherId: "1MsigzUDs3TWgODw.hF3GVDvPOf3",
      teachers: ["1MsigzUDs3TWgODw.hF3GVDvPOf3", "pzoktR8EiJYNKq8wc23YQbE3jWF3"],
      assignedAt: "2025-06-11T20:31:00.000Z",
      assignedBy: "1MsigzUDs3TWgODw.hF3GVDvPOf3",
      permissions: {
        canAddObservations: true,
        canEditClass: false,
        canManageTeachers: false,
        canTakeAttendance: true,
        canViewAttendanceHistory: true,
      },
      role: "assistant",
      status: "active",
      studentIds: ["student1", "student2", "student3"],
      schedules: [
        {
          dayOfWeek: 2, // Martes
          startTime: "14:00",
          endTime: "15:30",
          classroom: "Aula Piano 1",
        },
        {
          dayOfWeek: 4, // Jueves
          startTime: "16:00",
          endTime: "17:30",
          classroom: "Aula Piano 1",
        },
      ],
    },

    // Otra clase compartida
    {
      id: "firestore-guitar-shared",
      name: "Guitarra Clásica Avanzada",
      description: "Clase avanzada de guitarra clásica con repertorio especializado",
      instrument: "Guitarra",
      level: "avanzado",
      teacherId: "main-guitar-teacher",
      teachers: ["main-guitar-teacher", "1MsigzUDs3TWgODw.hF3GVDvPOf3", "assistant-guitar-teacher"],
      assignedAt: "2025-01-15T10:00:00.000Z",
      assignedBy: "main-guitar-teacher",
      permissions: {
        canAddObservations: true,
        canEditClass: true,
        canManageTeachers: false,
        canTakeAttendance: true,
        canViewAttendanceHistory: true,
      },
      role: "lead",
      status: "active",
      studentIds: ["student4", "student5"],
      schedules: [
        {
          dayOfWeek: 1, // Lunes
          startTime: "10:00",
          endTime: "11:30",
          classroom: "Aula Guitarra A",
        },
        {
          dayOfWeek: 3, // Miércoles
          startTime: "15:00",
          endTime: "16:30",
          classroom: "Aula Guitarra A",
        },
      ],
    },

    // Clase de violín compartida
    {
      id: "firestore-violin-shared",
      name: "Ensamble de Violín",
      description: "Clase de ensamble para estudiantes de violín de diferentes niveles",
      instrument: "Violín",
      level: "mixto",
      teacherId: "violin-master",
      teachers: ["violin-master", "pzoktR8EiJYNKq8wc23YQbE3jWF3", "violin-assistant"],
      assignedAt: "2025-01-20T14:00:00.000Z",
      assignedBy: "violin-master",
      permissions: {
        canAddObservations: true,
        canEditClass: false,
        canManageTeachers: false,
        canTakeAttendance: true,
        canViewAttendanceHistory: true,
      },
      role: "assistant",
      status: "active",
      studentIds: ["student6", "student7", "student8", "student9"],
      schedules: [
        {
          dayOfWeek: 5, // Viernes
          startTime: "17:00",
          endTime: "18:30",
          classroom: "Sala de Ensambles",
        },
      ],
    },

    // Clase NO compartida (para contraste)
    {
      id: "firestore-piano-solo",
      name: "Piano Básico Individual",
      description: "Clases individuales de piano para principiantes",
      instrument: "Piano",
      level: "básico",
      teacherId: "solo-piano-teacher",
      teachers: [], // Array vacío = no compartida
      assignedAt: "2025-01-10T09:00:00.000Z",
      assignedBy: "solo-piano-teacher",
      status: "active",
      studentIds: ["student10"],
      schedules: [
        {
          dayOfWeek: 2, // Martes
          startTime: "09:00",
          endTime: "10:00",
          classroom: "Aula Piano 2",
        },
      ],
    },

    // Clase con teachers undefined (para probar robustez)
    {
      id: "firestore-drums-legacy",
      name: "Batería Intermedio",
      description: "Clase de batería sin estructura de compartición definida",
      instrument: "Batería",
      level: "intermedio",
      teacherId: "drums-teacher",
      // Sin propiedad teachers - simula datos legacy
      status: "active",
      studentIds: ["student11", "student12"],
      schedules: [
        {
          dayOfWeek: 6, // Sábado
          startTime: "11:00",
          endTime: "12:30",
          classroom: "Sala de Batería",
        },
      ],
    },
  ]

  // Datos de maestros correspondientes
  const testTeachers = [
    {
      id: "1MsigzUDs3TWgODw.hF3GVDvPOf3",
      name: "Ana María Rodríguez",
      email: "ana.rodriguez@musicacademy.com",
      instrument: "Piano",
      specialization: "Clásico",
    },
    {
      id: "pzoktR8EiJYNKq8wc23YQbE3jWF3",
      name: "Carlos Eduardo López",
      email: "carlos.lopez@musicacademy.com",
      instrument: "Múltiples",
      specialization: "Asistente General",
    },
    {
      id: "main-guitar-teacher",
      name: "María José García",
      email: "maria.garcia@musicacademy.com",
      instrument: "Guitarra",
      specialization: "Clásica",
    },
    {
      id: "assistant-guitar-teacher",
      name: "Pedro Martínez",
      email: "pedro.martinez@musicacademy.com",
      instrument: "Guitarra",
      specialization: "Técnica",
    },
    {
      id: "violin-master",
      name: "Sofia Isabella Ruiz",
      email: "sofia.ruiz@musicacademy.com",
      instrument: "Violín",
      specialization: "Ensambles",
    },
    {
      id: "violin-assistant",
      name: "Diego Alejandro Torres",
      email: "diego.torres@musicacademy.com",
      instrument: "Violín",
      specialization: "Principiantes",
    },
    {
      id: "solo-piano-teacher",
      name: "Elena Morales",
      email: "elena.morales@musicacademy.com",
      instrument: "Piano",
      specialization: "Iniciación",
    },
    {
      id: "drums-teacher",
      name: "Roberto Silva",
      email: "roberto.silva@musicacademy.com",
      instrument: "Batería",
      specialization: "Rock y Jazz",
    },
  ]

  // Guardar en localStorage
  localStorage.setItem("firestore-test-classes", JSON.stringify(testClasses))
  localStorage.setItem("firestore-test-teachers", JSON.stringify(testTeachers))

  console.log("✅ Datos de prueba generados y guardados:")
  console.log(`   📚 ${testClasses.length} clases creadas`)
  console.log(`   👨‍🏫 ${testTeachers.length} maestros creados`)

  // Análisis de clases compartidas
  const sharedClasses = testClasses.filter(
    (cls) => cls.teachers && Array.isArray(cls.teachers) && cls.teachers.length > 0
  )

  console.log(`\n🔗 Clases compartidas: ${sharedClasses.length}`)
  sharedClasses.forEach((cls) => {
    console.log(`   ✅ ${cls.name} → ${cls.teachers.length} maestros`)
  })

  console.log("\n🔄 Para aplicar estos datos:")
  console.log("1. Recarga la página")
  console.log("2. O ejecuta: loadFirestoreTestData()")

  return {classes: testClasses, teachers: testTeachers}
}

// Función para cargar los datos de prueba en la aplicación
window.loadFirestoreTestData = () => {
  console.log("📥 Cargando datos de prueba en la aplicación...")

  try {
    const classes = JSON.parse(localStorage.getItem("firestore-test-classes") || "[]")
    const teachers = JSON.parse(localStorage.getItem("firestore-test-teachers") || "[]")

    if (classes.length === 0) {
      console.log("⚠️  No hay datos de prueba. Ejecuta generateFirestoreTestData() primero")
      return
    }

    // Intentar inyectar en el store de Vue
    const vueApp = document.querySelector("#app")?.__vue_app__
    if (vueApp && vueApp.config.globalProperties.$pinia) {
      const stores = Object.values(vueApp.config.globalProperties.$pinia._s)

      // Buscar store de clases
      const classesStore = stores.find(
        (store) => store.$id === "classes" || store.classes !== undefined
      )

      if (classesStore) {
        console.log("📦 Store de clases encontrado, inyectando datos...")

        // Inyectar datos directamente
        if (classesStore.$patch) {
          classesStore.$patch({classes})
        } else if (classesStore.classes !== undefined) {
          classesStore.classes = classes
        }

        console.log("✅ Datos de clases inyectados")
      }

      // Buscar store de maestros
      const teachersStore = stores.find(
        (store) => store.$id === "teachers" || store.teachers !== undefined
      )

      if (teachersStore) {
        console.log("👨‍🏫 Store de maestros encontrado, inyectando datos...")

        if (teachersStore.$patch) {
          teachersStore.$patch({teachers})
        } else if (teachersStore.teachers !== undefined) {
          teachersStore.teachers = teachers
        }

        console.log("✅ Datos de maestros inyectados")
      }

      // Forzar reactividad
      setTimeout(() => {
        console.log("🔄 Forzando actualización de la UI...")

        // Disparar evento personalizado para que la app se actualice
        window.dispatchEvent(
          new CustomEvent("test-data-loaded", {
            detail: {classes, teachers},
          })
        )
      }, 100)
    } else {
      console.log("⚠️  No se pudo acceder al store, usando localStorage como fallback")
      localStorage.setItem("classes-data", JSON.stringify(classes))
      localStorage.setItem("teachers-data", JSON.stringify(teachers))
    }

    console.log(`✅ ${classes.length} clases y ${teachers.length} maestros cargados`)

    return {classes, teachers}
  } catch (error) {
    console.error("❌ Error cargando datos de prueba:", error)
  }
}

console.log("🏗️  Scripts de datos de prueba Firestore cargados:")
console.log("- generateFirestoreTestData() - Generar datos de prueba")
console.log("- loadFirestoreTestData() - Cargar datos en la aplicación")
