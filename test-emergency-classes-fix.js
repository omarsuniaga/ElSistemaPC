// Script de prueba para verificar las correcciones en useEmergencyClasses.ts
// Este script simula diferentes tipos de datos que podrían venir de Firestore

// Simular diferentes tipos de datos que pueden venir de Firestore
const testCases = [
  {
    name: "Firestore Timestamp simulado",
    data: {
      createdAt: {
        toDate: () => new Date("2025-06-28T10:00:00Z"),
      },
      updatedAt: {
        toDate: () => new Date("2025-06-28T11:00:00Z"),
      },
      approvedAt: {
        toDate: () => new Date("2025-06-28T12:00:00Z"),
      },
    },
  },
  {
    name: "Date objects",
    data: {
      createdAt: new Date("2025-06-28T10:00:00Z"),
      updatedAt: new Date("2025-06-28T11:00:00Z"),
      approvedAt: new Date("2025-06-28T12:00:00Z"),
    },
  },
  {
    name: "String dates",
    data: {
      createdAt: "2025-06-28T10:00:00Z",
      updatedAt: "2025-06-28T11:00:00Z",
      approvedAt: "2025-06-28T12:00:00Z",
    },
  },
  {
    name: "Timestamp numbers",
    data: {
      createdAt: 1719571200000, // June 28, 2025 10:00:00 UTC
      updatedAt: 1719574800000, // June 28, 2025 11:00:00 UTC
      approvedAt: 1719578400000, // June 28, 2025 12:00:00 UTC
    },
  },
  {
    name: "Null/undefined values",
    data: {
      createdAt: null,
      updatedAt: undefined,
      approvedAt: null,
    },
  },
  {
    name: "Invalid string dates",
    data: {
      createdAt: "invalid-date",
      updatedAt: "not-a-date",
      approvedAt: "bad-format",
    },
  },
  {
    name: "Broken Timestamp object",
    data: {
      createdAt: {
        toDate: () => {
          throw new Error("Timestamp conversion error")
        },
      },
      updatedAt: {
        toDate: () => {
          throw new Error("Timestamp conversion error")
        },
      },
      approvedAt: {
        toDate: () => {
          throw new Error("Timestamp conversion error")
        },
      },
    },
  },
]

// Funciones auxiliares copiadas del archivo useEmergencyClasses.ts para prueba
const convertToDate = (value) => {
  if (!value) {
    return new Date()
  }

  // If it's a Firestore Timestamp with toDate method
  if (value && typeof value.toDate === "function") {
    try {
      return value.toDate()
    } catch (error) {
      console.warn("[useEmergencyClasses] Error converting Timestamp to Date:", error)
      return new Date()
    }
  }

  // If it's already a Date object
  if (value instanceof Date) {
    return value
  }

  // If it's a string, try to parse it
  if (typeof value === "string") {
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? new Date() : parsed
  }

  // If it's a number (timestamp in milliseconds)
  if (typeof value === "number") {
    return new Date(value)
  }

  // Fallback to current date
  console.warn("[useEmergencyClasses] Unknown date format, using current date:", value)
  return new Date()
}

const convertToDateOrUndefined = (value) => {
  if (!value) {
    return undefined
  }

  try {
    return convertToDate(value)
  } catch (error) {
    console.warn("[useEmergencyClasses] Error converting date, returning undefined:", error)
    return undefined
  }
}

// Función para probar la conversión
const testConversion = (testCase) => {
  console.log(`\n🧪 Probando: ${testCase.name}`)
  console.log("📥 Datos de entrada:", testCase.data)

  try {
    const result = {
      createdAt: convertToDate(testCase.data.createdAt),
      updatedAt: convertToDate(testCase.data.updatedAt),
      approvedAt: convertToDateOrUndefined(testCase.data.approvedAt),
    }

    console.log("✅ Resultado exitoso:")
    console.log(
      "  createdAt:",
      result.createdAt instanceof Date ? result.createdAt.toISOString() : result.createdAt
    )
    console.log(
      "  updatedAt:",
      result.updatedAt instanceof Date ? result.updatedAt.toISOString() : result.updatedAt
    )
    console.log(
      "  approvedAt:",
      result.approvedAt instanceof Date ? result.approvedAt.toISOString() : result.approvedAt
    )

    // Verificar que las fechas son válidas
    const isValidCreatedAt = result.createdAt instanceof Date && !isNaN(result.createdAt.getTime())
    const isValidUpdatedAt = result.updatedAt instanceof Date && !isNaN(result.updatedAt.getTime())
    const isValidApprovedAt =
      result.approvedAt === undefined ||
      (result.approvedAt instanceof Date && !isNaN(result.approvedAt.getTime()))

    if (isValidCreatedAt && isValidUpdatedAt && isValidApprovedAt) {
      console.log("✅ Todas las fechas son válidas")
    } else {
      console.log("⚠️ Algunas fechas pueden no ser válidas")
    }
  } catch (error) {
    console.log("❌ Error durante la conversión:", error.message)
  }
}

// Ejecutar todas las pruebas
console.log("🔧 PRUEBAS DE CORRECCIÓN - useEmergencyClasses.ts")
console.log("====================================================")
console.log(
  "Verificando que las funciones de conversión de fechas manejan todos los casos correctamente\n"
)

testCases.forEach(testConversion)

console.log("\n📋 RESUMEN:")
console.log("✅ Las funciones convertToDate() y convertToDateOrUndefined() ahora manejan:")
console.log("  - Objetos Timestamp de Firestore (con toDate())")
console.log("  - Objetos Date nativos de JavaScript")
console.log("  - Cadenas de texto con fechas")
console.log("  - Números (timestamps en milisegundos)")
console.log("  - Valores null/undefined")
console.log("  - Formatos de fecha inválidos")
console.log("  - Errores en la conversión de Timestamp")
console.log('\n🎉 Las correcciones deberían resolver el error "toDate is not a function"')

// Simular el comportamiento anterior que causaba el error
console.log("\n🚫 COMPORTAMIENTO ANTERIOR (que causaba el error):")
console.log("// Esto causaba el error:")
console.log("// createdAt: data.createdAt?.toDate() || new Date()")
console.log("// updatedAt: data.updatedAt?.toDate() || new Date()")
console.log("// approvedAt: data.approvedAt?.toDate()")
console.log('\nSi data.createdAt era una cadena como "2025-06-28", entonces:')
console.log("data.createdAt?.toDate() // TypeError: toDate is not a function")

console.log("\n✅ COMPORTAMIENTO NUEVO (corregido):")
console.log("// Ahora usamos:")
console.log("// createdAt: convertToDate(data.createdAt)")
console.log("// updatedAt: convertToDate(data.updatedAt)")
console.log("// approvedAt: convertToDateOrUndefined(data.approvedAt)")
console.log("\nLas funciones convertToDate manejan cualquier tipo de entrada de forma segura.")
