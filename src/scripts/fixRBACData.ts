// src/scripts/fixRBACData.ts
import {RBACInitializer} from "./initializeRBAC"

async function fixRBACData() {
  console.log("🔧 Iniciando corrección de datos RBAC...")

  try {
    const initializer = new RBACInitializer()

    console.log("📦 Reinicializando estructura RBAC con datos corregidos...")
    await initializer.initializeRBACSystem()

    console.log("� Verificando estado final...")
    await initializer.checkRBACStatus()

    console.log("✅ Datos RBAC corregidos exitosamente")
  } catch (error) {
    console.error("❌ Error al corregir datos RBAC:", error)
    throw error
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  fixRBACData()
    .then(() => {
      console.log("🎉 Proceso de corrección completado")
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Fallo en la corrección:", error)
      process.exit(1)
    })
}

export {fixRBACData}
