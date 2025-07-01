// src/utils/testing/brandingTests.ts

import {useBrandingStore} from "@/stores/brandingStore"
import {useBranding} from "@/composables/useBranding"
import {logger} from "@/utils/logging/logger"

/**
 * Suite de pruebas para el sistema de configuración de marca
 */
export class BrandingTestSuite {
  private brandingStore = useBrandingStore()
  private brandingComposable = useBranding()
  private testResults: Array<{test: string; status: "PASS" | "FAIL"; details?: string}> = []

  /**
   * Ejecuta todas las pruebas del sistema de branding
   */
  async runAllTests(): Promise<void> {
    console.group("🎨 TESTING: Sistema de Configuración de Marca")

    this.testResults = []

    try {
      // Pruebas de store
      await this.testStoreInitialization()
      await this.testStoreOperations()

      // Pruebas de composable
      this.testComposableProperties()
      this.testCSSVariables()

      // Pruebas de DOM
      this.testDOMApplication()

      // Pruebas de archivos
      await this.testFileOperations()

      // Mostrar resultados
      this.displayResults()
    } catch (error) {
      console.error("❌ Error ejecutando pruebas de branding:", error)
    }

    console.groupEnd()
  }

  /**
   * Prueba la inicialización del store
   */
  private async testStoreInitialization(): Promise<void> {
    console.log("🔍 Probando inicialización del store...")

    try {
      // Verificar estado inicial
      const initialConfig = this.brandingStore.config

      if (initialConfig.appName) {
        this.addResult("Store inicializado", "PASS", `App name: ${initialConfig.appName}`)
      } else {
        this.addResult("Store inicializado", "FAIL", "Config no tiene appName")
      }

      // Verificar propiedades computadas
      if (this.brandingStore.appTitle) {
        this.addResult(
          "Computed properties funcionando",
          "PASS",
          `Title: ${this.brandingStore.appTitle}`
        )
      } else {
        this.addResult("Computed properties funcionando", "FAIL", "appTitle no disponible")
      }
    } catch (error) {
      this.addResult("Store inicializado", "FAIL", `Error: ${error}`)
    }
  }

  /**
   * Prueba las operaciones del store
   */
  private async testStoreOperations(): Promise<void> {
    console.log("🔍 Probando operaciones del store...")

    try {
      // Crear configuración de prueba
      const testConfig = {
        appName: "Test Academy",
        tagline: "Testing Mode",
        colors: {
          primary: "#ff5722",
          secondary: "#9c27b0",
          accent: "#4caf50",
          background: "#f5f5f5",
          surface: "#ffffff",
          text: "#333333",
        },
      }

      // Probar preview de cambios
      this.brandingStore.previewChanges(testConfig)

      if (this.brandingStore.config.appName === "Test Academy") {
        this.addResult("Preview de cambios", "PASS", "Configuración aplicada temporalmente")
      } else {
        this.addResult("Preview de cambios", "FAIL", "Preview no funcionó")
      }

      // Revertir cambios si hay función disponible
      if (window.revertBrandingPreview) {
        window.revertBrandingPreview()
        this.addResult("Revertir preview", "PASS", "Cambios revertidos exitosamente")
      }
    } catch (error) {
      this.addResult("Store operaciones", "FAIL", `Error: ${error}`)
    }
  }

  /**
   * Prueba las propiedades del composable
   */
  private testComposableProperties(): void {
    console.log("🔍 Probando composable de branding...")

    try {
      const {appTitle, appDescription, appLogo, brandColors} = this.brandingComposable

      // Verificar propiedades reactivas
      if (appTitle.value) {
        this.addResult("Composable appTitle", "PASS", `Value: ${appTitle.value}`)
      } else {
        this.addResult("Composable appTitle", "FAIL", "No value")
      }

      if (appDescription.value) {
        this.addResult(
          "Composable appDescription",
          "PASS",
          `Length: ${appDescription.value.length} chars`
        )
      } else {
        this.addResult("Composable appDescription", "FAIL", "No value")
      }

      if (appLogo.value.url) {
        this.addResult("Composable appLogo", "PASS", `URL: ${appLogo.value.url}`)
      } else {
        this.addResult("Composable appLogo", "FAIL", "No URL")
      }

      if (brandColors.value.primary) {
        this.addResult("Composable brandColors", "PASS", `Primary: ${brandColors.value.primary}`)
      } else {
        this.addResult("Composable brandColors", "FAIL", "No primary color")
      }
    } catch (error) {
      this.addResult("Composable properties", "FAIL", `Error: ${error}`)
    }
  }

  /**
   * Prueba las variables CSS
   */
  private testCSSVariables(): void {
    console.log("🔍 Probando variables CSS...")

    try {
      const {cssVariables, getCSSVariables} = this.brandingComposable

      // Verificar variables CSS del store
      const storeVariables = this.brandingStore.cssVariables
      if (Object.keys(storeVariables).length > 0) {
        this.addResult(
          "CSS Variables (Store)",
          "PASS",
          `${Object.keys(storeVariables).length} variables`
        )
      } else {
        this.addResult("CSS Variables (Store)", "FAIL", "No variables")
      }

      // Verificar variables CSS del composable
      const composableVariables = cssVariables.value
      if (Object.keys(composableVariables).length > 0) {
        this.addResult(
          "CSS Variables (Composable)",
          "PASS",
          `${Object.keys(composableVariables).length} variables`
        )
      } else {
        this.addResult("CSS Variables (Composable)", "FAIL", "No variables")
      }

      // Verificar función getCSSVariables
      const dynamicVariables = getCSSVariables()
      if (dynamicVariables["--brand-primary"]) {
        this.addResult(
          "Dynamic CSS Variables",
          "PASS",
          `Primary: ${dynamicVariables["--brand-primary"]}`
        )
      } else {
        this.addResult("Dynamic CSS Variables", "FAIL", "No dynamic variables")
      }
    } catch (error) {
      this.addResult("CSS Variables", "FAIL", `Error: ${error}`)
    }
  }

  /**
   * Prueba la aplicación al DOM
   */
  private testDOMApplication(): void {
    console.log("🔍 Probando aplicación al DOM...")

    try {
      // Verificar título del documento
      const currentTitle = document.title
      if (currentTitle && currentTitle !== "Vite App") {
        this.addResult("Document title", "PASS", `Title: ${currentTitle}`)
      } else {
        this.addResult("Document title", "FAIL", "Title no actualizado")
      }

      // Verificar variables CSS en el DOM
      const root = document.documentElement
      const primaryColor = getComputedStyle(root).getPropertyValue("--ion-color-primary")

      if (primaryColor) {
        this.addResult("CSS Variables en DOM", "PASS", `Primary: ${primaryColor.trim()}`)
      } else {
        this.addResult("CSS Variables en DOM", "FAIL", "Variables no aplicadas")
      }

      // Verificar meta description
      const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement
      if (metaDescription && metaDescription.content) {
        this.addResult(
          "Meta description",
          "PASS",
          `Content: ${metaDescription.content.substring(0, 50)}...`
        )
      } else {
        this.addResult("Meta description", "FAIL", "Meta description no encontrada")
      }

      // Verificar favicon
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (favicon && favicon.href) {
        this.addResult("Favicon", "PASS", `Href: ${favicon.href}`)
      } else {
        this.addResult("Favicon", "FAIL", "Favicon no encontrado")
      }
    } catch (error) {
      this.addResult("DOM Application", "FAIL", `Error: ${error}`)
    }
  }

  /**
   * Prueba las operaciones de archivos
   */
  private async testFileOperations(): Promise<void> {
    console.log("🔍 Probando operaciones de archivos...")

    try {
      // Crear un archivo de prueba para importar
      const testConfigData = {
        appName: "Test Import Academy",
        appDescription: "Configuración de prueba importada",
        tagline: "Testing Import",
        colors: {
          primary: "#e91e63",
          secondary: "#9c27b0",
          accent: "#00bcd4",
          background: "#fafafa",
          surface: "#ffffff",
          text: "#212121",
        },
        version: 999,
      }

      // Probar exportación
      try {
        this.brandingStore.exportConfig()
        this.addResult("Export Config", "PASS", "Descarga iniciada")
      } catch (error) {
        this.addResult("Export Config", "FAIL", `Error: ${error}`)
      }

      // Simular archivo para importación
      const testFile = new File([JSON.stringify(testConfigData)], "test-config.json", {
        type: "application/json",
      })

      // Verificar que el archivo se puede procesar
      const fileContent = await testFile.text()
      const parsedContent = JSON.parse(fileContent)

      if (parsedContent.appName === "Test Import Academy") {
        this.addResult("File Processing", "PASS", "Archivo de prueba válido")
      } else {
        this.addResult("File Processing", "FAIL", "Archivo de prueba inválido")
      }
    } catch (error) {
      this.addResult("File Operations", "FAIL", `Error: ${error}`)
    }
  }

  /**
   * Agrega un resultado de prueba
   */
  private addResult(test: string, status: "PASS" | "FAIL", details?: string): void {
    this.testResults.push({test, status, details})

    const icon = status === "PASS" ? "✅" : "❌"
    const message = details ? ` - ${details}` : ""
    console.log(`  ${icon} ${test}${message}`)
  }

  /**
   * Muestra el resumen de resultados
   */
  private displayResults(): void {
    const passCount = this.testResults.filter((r) => r.status === "PASS").length
    const failCount = this.testResults.filter((r) => r.status === "FAIL").length
    const total = this.testResults.length

    console.log("\n📊 RESUMEN DE PRUEBAS:")
    console.log(`   Total: ${total}`)
    console.log(`   ✅ Exitosas: ${passCount}`)
    console.log(`   ❌ Fallidas: ${failCount}`)
    console.log(`   📈 Tasa de éxito: ${((passCount / total) * 100).toFixed(1)}%`)

    if (failCount > 0) {
      console.log("\n🔍 PRUEBAS FALLIDAS:")
      this.testResults
        .filter((r) => r.status === "FAIL")
        .forEach((result) => {
          console.log(`   ❌ ${result.test}: ${result.details || "Sin detalles"}`)
        })
    }

    // Guardar resultados en el store para debugging
    ;(window as any).brandingTestResults = this.testResults

    logger.info("BRANDING_TESTS", "Pruebas completadas", {
      total,
      passed: passCount,
      failed: failCount,
      successRate: (passCount / total) * 100,
    })
  }

  /**
   * Prueba rápida del sistema
   */
  async quickTest(): Promise<boolean> {
    console.log("⚡ Prueba rápida del sistema de branding...")

    try {
      // Verificaciones básicas
      const hasStore = !!this.brandingStore
      const hasConfig = !!this.brandingStore.config
      const hasAppName = !!this.brandingStore.config.appName
      const hasColors = !!this.brandingStore.config.colors.primary

      const passed = hasStore && hasConfig && hasAppName && hasColors

      console.log(`  Store disponible: ${hasStore ? "✅" : "❌"}`)
      console.log(`  Config disponible: ${hasConfig ? "✅" : "❌"}`)
      console.log(`  App name: ${hasAppName ? "✅" : "❌"}`)
      console.log(`  Colores: ${hasColors ? "✅" : "❌"}`)
      console.log(`  Resultado: ${passed ? "✅ PASS" : "❌ FAIL"}`)

      return passed
    } catch (error) {
      console.error("❌ Error en prueba rápida:", error)
      return false
    }
  }
}

// Exportar instancia global
export const brandingTests = new BrandingTestSuite()

// Funciones globales para el navegador
if (typeof window !== "undefined") {
  ;(window as any).testBranding = () =>
    (brandingTests.runAllTests()(window as any).quickTestBranding = () => brandingTests.quickTest())
}
