// Script para verificar el funcionamiento completo del módulo de clases compartidas
// Ejecutar después de navegar a la sección de administración de clases

window.verifySharedClassesModule = () => {
  console.log("🧪 === VERIFICACIÓN MÓDULO CLASES COMPARTIDAS ===")

  // 1. Verificar componentes Vue están montados
  const app = document.querySelector("#app")
  if (!app) {
    console.error("❌ App de Vue no encontrada")
    return
  }

  // 2. Buscar tabs y componentes
  const classesTab =
    document.querySelector('[data-testid="classes-tab"]') ||
    document.querySelector('button[contains="Clases"i]')
  const sharedTab =
    document.querySelector('[data-testid="shared-classes-tab"]') ||
    document.querySelector('button[contains="Compartidas"i]')

  console.log("🎛️  ELEMENTOS UI:")
  console.log(`   Tab Clases: ${classesTab ? "✅ Encontrado" : "❌ No encontrado"}`)
  console.log(`   Tab Compartidas: ${sharedTab ? "✅ Encontrado" : "❌ No encontrado"}`)

  // 3. Verificar datos en el componente
  try {
    const vueInstance = app.__vue_app__
    if (vueInstance) {
      console.log("📦 Instancia Vue encontrada")

      // Buscar el store o datos de clases
      const classesData = window.localStorage.getItem("classes-data")
      if (classesData) {
        const classes = JSON.parse(classesData)
        console.log(`📊 Clases en localStorage: ${classes.length}`)

        // Analizar estructura
        classes.forEach((cls, i) => {
          if (i < 3) {
            // Solo mostrar las primeras 3
            console.log(`   Clase ${i + 1}: ${cls.name}`)
            console.log(
              `      teachers: ${cls.teachers ? JSON.stringify(cls.teachers) : "undefined"}`
            )
          }
        })
      }
    }
  } catch (error) {
    console.log("⚠️  No se pudo acceder a datos Vue:", error.message)
  }

  // 4. Simular click en tab de clases compartidas
  if (sharedTab) {
    console.log("🖱️  Intentando hacer click en tab de clases compartidas...")
    try {
      sharedTab.click()
      setTimeout(() => {
        const sharedClassesList =
          document.querySelector('[data-testid="shared-classes-list"]') ||
          document.querySelector(".shared-classes-container")
        console.log(`   Lista compartidas: ${sharedClassesList ? "✅ Visible" : "❌ No visible"}`)

        // Buscar elementos específicos
        const sharedItems = document.querySelectorAll(
          '.shared-class-item, [data-testid="shared-class-item"]'
        )
        console.log(`   Items compartidos: ${sharedItems.length}`)

        if (sharedItems.length === 0) {
          console.log("💡 SUGERENCIAS:")
          console.log(
            '   1. Verifica que las clases tengan la propiedad "teachers" con array de IDs'
          )
          console.log("   2. Ejecuta injectTestSharedClass() para agregar datos de prueba")
          console.log("   3. Recarga la página después de inyectar datos")
        }
      }, 1000)
    } catch (error) {
      console.error("❌ Error haciendo click:", error)
    }
  }

  // 5. Verificar consola por errores
  const errors = []
  const originalError = console.error
  console.error = (...args) => {
    errors.push(args.join(" "))
    originalError.apply(console, args)
  }

  setTimeout(() => {
    console.error = originalError
    if (errors.length > 0) {
      console.log("🚨 ERRORES DETECTADOS:")
      errors.forEach((error) => console.log(`   ${error}`))
    } else {
      console.log("✅ No se detectaron errores en consola")
    }
  }, 2000)
}

// Función para agregar datos de prueba específicos
window.setupTestEnvironment = () => {
  console.log("🏗️  Configurando entorno de prueba...")

  const testClasses = [
    {
      id: "test-shared-1",
      name: "Piano Avanzado - Compartido",
      description: "Clase compartida entre múltiples maestros",
      instrument: "Piano",
      level: "avanzado",
      teacherId: "teacher-main",
      teachers: ["teacher-main", "teacher-assistant-1", "teacher-assistant-2"],
      sharedWith: [], // Para verificar que no usamos esto
      permissions: {
        canAddObservations: true,
        canTakeAttendance: true,
        canViewAttendanceHistory: true,
      },
      role: "assistant",
    },
    {
      id: "test-shared-2",
      name: "Guitarra Clásica - Compartido",
      description: "Otra clase compartida",
      instrument: "Guitarra",
      level: "intermedio",
      teacherId: "teacher-2",
      teachers: ["teacher-2", "teacher-main"],
      permissions: {
        canAddObservations: true,
        canTakeAttendance: false,
        canViewAttendanceHistory: true,
      },
    },
    {
      id: "test-normal-1",
      name: "Violín Individual",
      description: "Clase no compartida",
      instrument: "Violín",
      level: "básico",
      teacherId: "teacher-solo",
      teachers: [], // Array vacío = no compartida
    },
  ]

  localStorage.setItem("test-classes", JSON.stringify(testClasses))
  console.log("✅ Datos de prueba guardados en localStorage")
  console.log("🔄 Recarga la página para aplicar los cambios")
  console.log(`📊 ${testClasses.length} clases creadas (2 compartidas, 1 normal)`)
}

console.log("🧪 Scripts de verificación cargados:")
console.log("- verifySharedClassesModule() - Verificar funcionamiento completo")
console.log("- setupTestEnvironment() - Configurar datos de prueba")
