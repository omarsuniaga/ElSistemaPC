// Script de prueba para validar la corrección del modo lista en dashboard de maestros
// Ejecutar en la consola del navegador en el dashboard del maestro

console.log("🧪 Iniciando prueba de corrección del modo lista...")

// Función para cambiar al modo lista automáticamente
function switchToListView() {
  console.log("📋 Cambiando a vista de lista...")

  // Buscar el botón de vista lista
  const listViewButton = document.querySelector('button[title="Vista de lista"]')
  if (listViewButton) {
    listViewButton.click()
    console.log("✅ Cambiado a vista de lista exitosamente")
    return true
  } else {
    console.log("❌ No se encontró el botón de vista de lista")
    return false
  }
}

// Función para probar los menús de acciones
function testActionMenus() {
  console.log("🔍 Probando menús de acciones...")

  // Buscar todos los botones de menú hamburguesa
  const menuButtons = document.querySelectorAll('button[class*="EllipsisVertical"]')
  console.log(`📊 Encontrados ${menuButtons.length} menús de acciones`)

  if (menuButtons.length === 0) {
    console.log("❌ No se encontraron menús de acciones")
    return false
  }

  // Probar el primer menú
  const firstMenu = menuButtons[0]
  console.log("🖱️ Haciendo clic en el primer menú...")
  firstMenu.click()

  // Verificar que el menú se despliega
  setTimeout(() => {
    const dropdownMenu = document.querySelector('[role="menu"]')
    if (dropdownMenu) {
      console.log("✅ Menú desplegado correctamente")
      console.log("📐 Posición del menú:", {
        top: dropdownMenu.offsetTop,
        left: dropdownMenu.offsetLeft,
        zIndex: getComputedStyle(dropdownMenu).zIndex,
      })

      // Cerrar el menú haciendo clic fuera
      document.body.click()
      console.log("🔒 Menú cerrado")
    } else {
      console.log("❌ El menú no se desplegó correctamente")
    }
  }, 100)

  return true
}

// Función para verificar el layout responsivo
function testResponsiveLayout() {
  console.log("📱 Probando layout responsivo...")

  const classCards = document.querySelectorAll('[class*="flex items-center p-4"]')
  console.log(`📊 Encontradas ${classCards.length} clases en vista lista`)

  classCards.forEach((card, index) => {
    const rect = card.getBoundingClientRect()
    console.log(`📏 Clase ${index + 1}:`, {
      width: rect.width,
      height: rect.height,
      visible: rect.top >= 0 && rect.bottom <= window.innerHeight,
    })
  })
}

// Función para verificar z-index y superposición
function testZIndexLayers() {
  console.log("🎭 Verificando capas z-index...")

  // Abrir primer menú
  const firstMenuButton = document.querySelector('button[class*="EllipsisVertical"]')
  if (firstMenuButton) {
    firstMenuButton.click()

    setTimeout(() => {
      const dropdown = document.querySelector('[role="menu"]')
      if (dropdown) {
        const zIndex = getComputedStyle(dropdown).zIndex
        console.log(`📊 Z-index del menú: ${zIndex}`)

        // Verificar si hay elementos que puedan superponerse
        const allElements = document.querySelectorAll("*")
        let highestZ = 0
        const conflictingElements = []

        allElements.forEach((el) => {
          const elZIndex = parseInt(getComputedStyle(el).zIndex) || 0
          if (elZIndex > highestZ) {
            highestZ = elZIndex
          }
          if (elZIndex > parseInt(zIndex) && elZIndex !== parseInt(zIndex)) {
            conflictingElements.push({
              element: el.tagName,
              zIndex: elZIndex,
              class: el.className,
            })
          }
        })

        console.log(`📊 Z-index más alto en la página: ${highestZ}`)
        if (conflictingElements.length > 0) {
          console.log("⚠️ Elementos que podrían superponerse:", conflictingElements)
        } else {
          console.log("✅ No hay conflictos de z-index")
        }

        // Cerrar menú
        document.body.click()
      }
    }, 100)
  }
}

// Función principal de prueba
function runListViewTest() {
  console.log("🏁 Ejecutando prueba completa del modo lista...")

  // Verificar que estamos en el dashboard correcto
  const currentPath = window.location.pathname
  if (!currentPath.includes("/teacher")) {
    console.log("❌ No estás en el dashboard del maestro. Navega a /teacher primero.")
    return
  }

  console.log("✅ Ubicación correcta verificada")

  // 1. Cambiar a vista lista
  setTimeout(() => {
    if (switchToListView()) {
      // 2. Probar menús después de cambiar vista
      setTimeout(() => {
        testActionMenus()

        // 3. Verificar layout responsivo
        setTimeout(() => {
          testResponsiveLayout()

          // 4. Verificar z-index
          setTimeout(() => {
            testZIndexLayers()

            console.log("🎯 Prueba completada. Revisa los logs anteriores para ver los resultados.")
            console.log("📋 Pruebas manuales adicionales:")
            console.log("   1. Haz clic en diferentes menús hamburguesa")
            console.log("   2. Verifica que no se superponen con otras clases")
            console.log("   3. Prueba en diferentes tamaños de pantalla")
            console.log("   4. Verifica que los botones de acción rápida funcionan")
          }, 500)
        }, 300)
      }, 500)
    }
  }, 100)
}

// Exponer funciones globalmente
window.testListView = runListViewTest
window.switchToListView = switchToListView
window.testActionMenus = testActionMenus
window.testResponsiveLayout = testResponsiveLayout
window.testZIndexLayers = testZIndexLayers

// Ejecutar prueba automáticamente
runListViewTest()

console.log("🎯 Funciones de prueba disponibles:")
console.log("   - window.testListView() - Ejecutar prueba completa")
console.log("   - window.switchToListView() - Cambiar a vista lista")
console.log("   - window.testActionMenus() - Probar menús de acciones")
console.log("   - window.testResponsiveLayout() - Verificar layout")
console.log("   - window.testZIndexLayers() - Verificar z-index")

export {
  runListViewTest as testListView,
  switchToListView,
  testActionMenus,
  testResponsiveLayout,
  testZIndexLayers,
}
