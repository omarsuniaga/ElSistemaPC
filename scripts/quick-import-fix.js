#!/usr/bin/env node

/**
 * Script simple para resolver rápidamente los conflictos más comunes
 * de imports dinámicos vs estáticos en Music Academy App
 */

const fs = require("fs")
const path = require("path")

// Configuración simple pero efectiva
const QUICK_FIXES = {
  // Firebase - hacer consistente
  "firebase/firestore": {
    strategy: "smart", // estático en componentes, dinámico en stores/services
    staticFiles: ["/components/", "/views/", "/router/"],
    dynamicFiles: ["/store/", "/service/", "/composables/"],
  },

  // Vue ecosystem - siempre estático
  vue: {strategy: "static"},
  "vue-router": {strategy: "static"},
  pinia: {strategy: "static"},

  // Stores internos - hacer dinámicos en stores
  "stores/auth": {strategy: "dynamic", onlyIn: ["/store/", "/service/"]},
  "stores/students": {strategy: "dynamic", onlyIn: ["/store/", "/service/"]},
  "stores/classes": {strategy: "dynamic", onlyIn: ["/store/", "/service/"]},

  // Services internos - hacer dinámicos
  "modulos/Students/service/students": {strategy: "dynamic", onlyIn: ["/store/"]},
  "modulos/Classes/service/classes": {strategy: "dynamic", onlyIn: ["/store/"]},
}

class QuickImportFixer {
  constructor() {
    this.fixesApplied = 0
    this.filesModified = 0
  }

  async run() {
    console.log("⚡ Ejecutando corrección rápida de imports...\n")

    const files = this.getRelevantFiles()

    for (const file of files) {
      const modified = await this.quickFixFile(file)
      if (modified) {
        this.filesModified++
      }
    }

    console.log(`\n✅ Proceso completado:`)
    console.log(`   📁 Archivos procesados: ${files.length}`)
    console.log(`   🔧 Archivos modificados: ${this.filesModified}`)
    console.log(`   ✨ Correcciones aplicadas: ${this.fixesApplied}`)
  }

  getRelevantFiles() {
    const glob = require("glob")
    const patterns = ["src/**/*.ts", "src/**/*.vue"]

    const files = []
    patterns.forEach((pattern) => {
      const matches = glob.sync(pattern, {
        ignore: ["**/node_modules/**", "**/dist/**", "**/*.d.ts", "**/*.backup*"],
      })
      files.push(...matches)
    })

    return files
  }

  async quickFixFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf8")
      let modified = false
      let newContent = content

      // Aplicar fixes rápidos
      for (const [module, config] of Object.entries(QUICK_FIXES)) {
        const result = this.applyQuickFix(newContent, module, config, filePath)
        if (result.modified) {
          newContent = result.content
          modified = true
          this.fixesApplied++
        }
      }

      // Escribir si hay cambios
      if (modified) {
        // Crear backup
        fs.writeFileSync(`${filePath}.backup`, content)
        fs.writeFileSync(filePath, newContent)
        console.log(`✅ ${filePath}`)
      }

      return modified
    } catch (error) {
      console.warn(`⚠️ Error procesando ${filePath}: ${error.message}`)
      return false
    }
  }
  applyQuickFix(content, module, config, filePath) {
    let modified = false
    let newContent = content

    // Regex para encontrar imports del módulo
    const moduleEscaped = module.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    // Buscar imports estáticos y dinámicos del módulo
    const staticRegex = new RegExp(`import\\s+[^;]+from\\s+['"\`]${moduleEscaped}['"\`]`, "g")
    const dynamicRegex = new RegExp(`import\\s*\\(\\s*['"\`]${moduleEscaped}['"\`]\\s*\\)`, "g")

    const hasStatic = staticRegex.test(content)
    const hasDynamic = dynamicRegex.test(content)

    // Solo actuar si hay conflicto
    if (!hasStatic || !hasDynamic) {
      return {content, modified: false}
    }

    console.log(`🔍 Conflicto encontrado en ${filePath}: ${module}`)

    // Determinar estrategia
    const strategy = this.determineStrategy(config, filePath)

    if (strategy === "static") {
      // Mantener estático, comentar dinámico de forma más segura
      newContent = newContent.replace(
        new RegExp(`(\\s*)(await\\s+)?import\\s*\\(\\s*['"\`]${moduleEscaped}['"\`]\\s*\\)`, "g"),
        "$1/* TODO: Convertir a import estático - $2import() */undefined"
      )
      modified = true
      console.log(`   📌 Manteniendo estático: ${module}`)
    } else if (strategy === "dynamic") {
      // Mantener dinámico, comentar estático de forma más segura
      newContent = newContent.replace(
        new RegExp(`(import\\s+[^;]+from\\s+['"\`]${moduleEscaped}['"\`])`, "g"),
        "/* TODO: Convertir a import dinámico - $1 */"
      )
      modified = true
      console.log(`   🔄 Manteniendo dinámico: ${module}`)
    }

    return {content: newContent, modified}
  }

  determineStrategy(config, filePath) {
    if (config.strategy === "static") {
      return "static"
    }

    if (config.strategy === "dynamic") {
      return "dynamic"
    }

    if (config.strategy === "smart") {
      // Verificar patrones de archivo
      if (config.staticFiles?.some((pattern) => filePath.includes(pattern))) {
        return "static"
      }
      if (config.dynamicFiles?.some((pattern) => filePath.includes(pattern))) {
        return "dynamic"
      }
      return "static" // Por defecto
    }

    return "static"
  }
}

// Ejecutar
if (require.main === module) {
  const fixer = new QuickImportFixer()
  fixer.run().catch(console.error)
}

module.exports = QuickImportFixer
