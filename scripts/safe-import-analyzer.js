#!/usr/bin/env node

/**
 * Script SEGURO para analizar conflictos de imports sin modificar código
 * Solo genera reportes y sugerencias
 */

const fs = require("fs")
const path = require("path")

const ANALYSIS_CONFIG = {
  // Estrategias recomendadas por módulo
  moduleStrategies: {
    "firebase/firestore": "smart", // estático en componentes, dinámico en stores/services
    "firebase/app": "static",
    "firebase/auth": "static",
    vue: "static",
    "vue-router": "static",
    pinia: "static",
    "@heroicons/vue": "static",
    jspdf: "dynamic",
    "chart.js": "dynamic",
    "date-fns": "smart",
  },

  // Patrones de archivos
  staticFiles: ["/components/", "/views/", "/router/"],
  dynamicFiles: ["/store/", "/service/", "/composables/"],
}

class SafeImportAnalyzer {
  constructor() {
    this.conflicts = []
    this.suggestions = []
    this.stats = {
      filesAnalyzed: 0,
      conflictsFound: 0,
    }
  }

  async run() {
    console.log("🔍 Analizando conflictos de imports (MODO SEGURO)...\n")

    const files = this.getFiles()

    for (const file of files) {
      this.analyzeFile(file)
    }

    this.generateReport()
    this.generateSuggestions()
  }

  getFiles() {
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

  analyzeFile(filePath) {
    this.stats.filesAnalyzed++

    try {
      const content = fs.readFileSync(filePath, "utf8")
      const conflicts = this.findConflicts(content, filePath)

      if (conflicts.length > 0) {
        this.conflicts.push({
          file: filePath,
          conflicts,
        })
        this.stats.conflictsFound += conflicts.length
      }
    } catch (error) {
      console.warn(`⚠️ Error analizando ${filePath}: ${error.message}`)
    }
  }

  findConflicts(content, filePath) {
    const conflicts = []

    // Buscar todos los imports
    const staticImports = this.findStaticImports(content)
    const dynamicImports = this.findDynamicImports(content)

    // Encontrar conflictos
    const staticModules = new Set(staticImports.map((imp) => imp.module))
    const dynamicModules = new Set(dynamicImports.map((imp) => imp.module))

    const conflictingModules = [...staticModules].filter((module) => dynamicModules.has(module))

    conflictingModules.forEach((module) => {
      const strategy = this.getRecommendedStrategy(module, filePath)

      conflicts.push({
        module,
        staticLines: staticImports.filter((imp) => imp.module === module).map((imp) => imp.line),
        dynamicLines: dynamicImports.filter((imp) => imp.module === module).map((imp) => imp.line),
        recommended: strategy,
        reason: this.getStrategyReason(module, filePath, strategy),
      })
    })

    return conflicts
  }

  findStaticImports(content) {
    const imports = []
    const regex = /import\s+[^;]+from\s+['"`]([^'"`]+)['"`]/g
    let match

    while ((match = regex.exec(content)) !== null) {
      imports.push({
        module: match[1],
        line: this.getLineNumber(content, match.index),
        full: match[0],
      })
    }

    return imports
  }

  findDynamicImports(content) {
    const imports = []
    const regex = /(await\s+)?import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
    let match

    while ((match = regex.exec(content)) !== null) {
      imports.push({
        module: match[2],
        line: this.getLineNumber(content, match.index),
        full: match[0],
        isAwait: !!match[1],
      })
    }

    return imports
  }

  getRecommendedStrategy(module, filePath) {
    const config = ANALYSIS_CONFIG.moduleStrategies[module]

    if (config === "static") return "static"
    if (config === "dynamic") return "dynamic"

    if (config === "smart") {
      if (ANALYSIS_CONFIG.staticFiles.some((pattern) => filePath.includes(pattern))) {
        return "static"
      }
      if (ANALYSIS_CONFIG.dynamicFiles.some((pattern) => filePath.includes(pattern))) {
        return "dynamic"
      }
    }

    // Por defecto estático para mejor rendimiento inicial
    return "static"
  }

  getStrategyReason(module, filePath, strategy) {
    if (strategy === "static") {
      if (module.includes("vue") || module.includes("@heroicons")) {
        return "Framework UI crítico"
      }
      if (filePath.includes("/components/")) {
        return "Componente necesita carga inmediata"
      }
      return "Mejor rendimiento inicial"
    } else {
      if (module.includes("jspdf") || module.includes("chart")) {
        return "Librería pesada - carga bajo demanda"
      }
      if (filePath.includes("/store/")) {
        return "Store - optimizar bundle"
      }
      return "Reducir tamaño inicial del bundle"
    }
  }

  getLineNumber(content, position) {
    return content.substring(0, position).split("\n").length
  }

  generateReport() {
    console.log("📊 REPORTE DE ANÁLISIS")
    console.log("======================")
    console.log(`Archivos analizados: ${this.stats.filesAnalyzed}`)
    console.log(`Conflictos encontrados: ${this.stats.conflictsFound}`)
    console.log(`Archivos afectados: ${this.conflicts.length}`)
    console.log("")

    if (this.conflicts.length === 0) {
      console.log("✅ No se encontraron conflictos de imports")
      return
    }

    console.log("🔍 CONFLICTOS DETECTADOS:")
    console.log("==========================")

    this.conflicts.forEach((fileInfo, index) => {
      console.log(`\n${index + 1}. 📁 ${fileInfo.file}`)

      fileInfo.conflicts.forEach((conflict) => {
        console.log(`   📦 ${conflict.module}`)
        console.log(`   📍 Estático: líneas ${conflict.staticLines.join(", ")}`)
        console.log(`   📍 Dinámico: líneas ${conflict.dynamicLines.join(", ")}`)
        console.log(`   💡 Recomendado: ${conflict.recommended}`)
        console.log(`   📝 Razón: ${conflict.reason}`)
      })
    })
  }

  generateSuggestions() {
    console.log("\n🛠️ SUGERENCIAS DE CORRECCIÓN")
    console.log("=============================")

    // Agrupar por tipo de corrección
    const staticSuggestions = []
    const dynamicSuggestions = []

    this.conflicts.forEach((fileInfo) => {
      fileInfo.conflicts.forEach((conflict) => {
        const suggestion = {
          file: fileInfo.file,
          module: conflict.module,
          action: conflict.recommended,
          lines: conflict.recommended === "static" ? conflict.dynamicLines : conflict.staticLines,
          reason: conflict.reason,
        }

        if (conflict.recommended === "static") {
          staticSuggestions.push(suggestion)
        } else {
          dynamicSuggestions.push(suggestion)
        }
      })
    })

    if (staticSuggestions.length > 0) {
      console.log("\n📌 Convertir a ESTÁTICO:")
      staticSuggestions.forEach((sugg) => {
        console.log(`   📄 ${sugg.file}`)
        console.log(`      📦 ${sugg.module} (líneas ${sugg.lines.join(", ")})`)
        console.log(`      💭 ${sugg.reason}`)
      })
    }

    if (dynamicSuggestions.length > 0) {
      console.log("\n🔄 Convertir a DINÁMICO:")
      dynamicSuggestions.forEach((sugg) => {
        console.log(`   📄 ${sugg.file}`)
        console.log(`      📦 ${sugg.module} (líneas ${sugg.lines.join(", ")})`)
        console.log(`      💭 ${sugg.reason}`)
      })
    }

    console.log("\n📋 PRÓXIMOS PASOS:")
    console.log("==================")
    console.log("1. Revisar las sugerencias anteriores")
    console.log("2. Aplicar correcciones manualmente en cada archivo")
    console.log('3. Ejecutar "npm run build" para verificar mejoras')
    console.log("4. Revisar que no hay errores de sintaxis")

    // Generar script de comandos
    this.generateFixScript()
  }

  generateFixScript() {
    const scriptPath = "manual-import-fixes.md"
    let script = "# Manual de Correcciones de Imports\n\n"
    script += "Este archivo contiene las correcciones manuales recomendadas.\n\n"

    this.conflicts.forEach((fileInfo, index) => {
      script += `## ${index + 1}. ${fileInfo.file}\n\n`

      fileInfo.conflicts.forEach((conflict) => {
        script += `### ${conflict.module}\n`
        script += `**Estrategia recomendada:** ${conflict.recommended}\n`
        script += `**Razón:** ${conflict.reason}\n\n`

        if (conflict.recommended === "static") {
          script += `**Acción:** Eliminar o comentar imports dinámicos en líneas ${conflict.dynamicLines.join(", ")}\n`
          script += "```typescript\n"
          script += `// Cambiar: const module = await import('${conflict.module}')\n`
          script += `// Por: import { ... } from '${conflict.module}'\n`
          script += "```\n\n"
        } else {
          script += `**Acción:** Eliminar o comentar imports estáticos en líneas ${conflict.staticLines.join(", ")}\n`
          script += "```typescript\n"
          script += `// Cambiar: import { ... } from '${conflict.module}'\n`
          script += `// Por: const { ... } = await import('${conflict.module}')\n`
          script += "```\n\n"
        }
      })
    })

    fs.writeFileSync(scriptPath, script)
    console.log(`\n📝 Guía de correcciones guardada en: ${scriptPath}`)
  }
}

// Ejecutar
if (require.main === module) {
  const analyzer = new SafeImportAnalyzer()
  analyzer.run().catch(console.error)
}

module.exports = SafeImportAnalyzer
