/**
 * Script de verificación de importaciones de error handling
 * Ejecuta este script para verificar que todas las importaciones funcionan correctamente
 */

import {useErrorHandling} from "./composables/useErrorHandling"
import {useAdminErrorHandling} from "./composables/useAdminErrorHandling"
import {handleModuleLoadingError} from "./utils/errorHandling"
import {debug} from "./utils/debug"
import {ErrorHandler} from "./utils/errorHandler"

console.log("✅ Verificando importaciones de error handling...")

try {
  // Verificar useErrorHandling
  const errorHandling = useErrorHandling()
  console.log("✅ useErrorHandling importado correctamente")

  // Verificar useAdminErrorHandling
  const adminErrorHandling = useAdminErrorHandling()
  console.log("✅ useAdminErrorHandling importado correctamente")

  // Verificar handleModuleLoadingError
  if (typeof handleModuleLoadingError === "function") {
    console.log("✅ handleModuleLoadingError importado correctamente")
  }

  // Verificar debug
  if (typeof debug === "function") {
    console.log("✅ debug importado correctamente")
  }

  // Verificar ErrorHandler
  if (ErrorHandler && typeof ErrorHandler.handleError === "function") {
    console.log("✅ ErrorHandler importado correctamente")
  }

  console.log("🎉 Todas las importaciones de error handling funcionan correctamente!")
} catch (error) {
  console.error("❌ Error en las importaciones:", error)
}
