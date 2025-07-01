// Script simple para ejecutar desde el navegador y corregir datos RBAC
// Ejecutar este código en la consola del navegador cuando estés logueado

async function fixRBACStructure() {
  // Importar Firebase si no está disponible
  const {initializeApp} = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js")
  const {getFirestore, collection, doc, getDocs, setDoc, writeBatch} = await import(
    "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js"
  )

  // Tu configuración de Firebase (usa la de tu proyecto)
  const firebaseConfig = {
    // Agregar tu configuración aquí
  }

  // Inicializar Firebase (o usar la instancia existente)
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)

  console.log("🔧 Corrigiendo estructura de datos RBAC...")

  // Módulos con estructura corregida
  const correctedModules = [
    {
      moduleName: "Dashboard",
      isEnabled: true,
      allowedRoles: ["Director", "Admin", "Superusuario"],
      components: [],
      routes: [
        {
          routePath: "/dashboard",
          routeName: "AdminHomeView",
          isAccessible: true,
          allowedRoles: ["Director", "Admin", "Superusuario"],
          permissions: ["dashboard_view"],
        },
      ],
    },
    {
      moduleName: "Teachers",
      isEnabled: true,
      allowedRoles: ["Director", "Admin", "Superusuario"],
      components: [],
      routes: [
        {
          routePath: "/teachers",
          routeName: "Teachers",
          isAccessible: true,
          allowedRoles: ["Director", "Admin", "Superusuario"],
          permissions: ["teachers_view_all"],
        },
      ],
    },
  ]

  // Actualizar módulos existentes
  const moduleAccessSnapshot = await getDocs(collection(db, "rbac_module_access"))
  const batch = writeBatch(db)

  for (const moduleDoc of moduleAccessSnapshot.docs) {
    const moduleData = moduleDoc.data()
    const correctedModule = correctedModules.find((m) => m.moduleName === moduleData.moduleName)

    if (correctedModule) {
      const updatedModule = {
        ...moduleData,
        ...correctedModule,
        moduleId: moduleDoc.id,
      }
      batch.set(doc(db, "rbac_module_access", moduleDoc.id), updatedModule)
      console.log(`✅ Actualizando módulo: ${moduleData.moduleName}`)
    }
  }

  await batch.commit()
  console.log("🎉 Estructura RBAC corregida exitosamente")
}

// Llamar a la función
fixRBACStructure().catch(console.error)
