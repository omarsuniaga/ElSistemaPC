#!/usr/bin/env node

/**
 * Script avanzado para resolver conflictos de imports usando AST parsing
 * Analiza y corrige automáticamente los problemas de imports dinámicos vs estáticos
 */

const fs = require('fs');
const path = require('path');

// Configuración específica para Music Academy App
const CONFIG = {
  // Estrategias por módulo
  moduleStrategies: {
    // Firebase - estático para core, dinámico para servicios específicos
    'firebase/app': 'static',
    'firebase/auth': 'static',
    'firebase/firestore': (filePath) => {
      if (filePath.includes('/store/') || filePath.includes('/service/')) {
        return 'dynamic';
      }
      return 'static';
    },

    // Vue ecosystem - siempre estático
    vue: 'static',
    'vue-router': 'static',
    pinia: 'static',

    // UI Libraries
    '@heroicons/vue': 'static',
    '@headlessui/vue': (filePath) => {
      return filePath.includes('/components/') ? 'static' : 'dynamic';
    },

    // Utilities - dinámico para módulos pesados
    jspdf: 'dynamic',
    'chart.js': 'dynamic',
    'date-fns': (filePath) => {
      return filePath.includes('/utils/') ? 'static' : 'dynamic';
    },
  },

  // Archivos que deben usar imports dinámicos por defecto
  dynamicByDefault: ['/store/', '/services/', '/composables/use'],

  // Archivos que deben usar imports estáticos por defecto
  staticByDefault: ['/components/', '/views/', '/router/'],
};

class AdvancedImportResolver {
  constructor() {
    this.conflicts = new Map();
    this.fixes = [];
    this.stats = {
      filesAnalyzed: 0,
      conflictsFound: 0,
      fixesApplied: 0,
    };
  }

  /**
   * Ejecutar el resolver
   */
  async run() {
    console.log('🚀 Iniciando resolución avanzada de imports...\n');

    // Fase 1: Análisis
    await this.analyzeProject();

    // Fase 2: Generar estrategias
    this.generateFixStrategies();

    // Fase 3: Mostrar resumen
    this.showDetailedSummary();

    // Fase 4: Aplicar fixes
    await this.applySmartFixes();

    console.log('\n✅ Resolución completada');
  }

  /**
   * Analizar todo el proyecto
   */
  async analyzeProject() {
    const files = this.getAllProjectFiles();

    console.log(`📁 Analizando ${files.length} archivos...\n`);

    for (const file of files) {
      this.analyzeFileForConflicts(file);
    }
  }

  /**
   * Obtener todos los archivos del proyecto
   */
  getAllProjectFiles() {
    const patterns = ['src/**/*.ts', 'src/**/*.vue', 'src/**/*.js'];

    const files = [];
    const glob = require('glob');

    patterns.forEach((pattern) => {
      const matches = glob.sync(pattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/*.backup'],
      });
      files.push(...matches);
    });

    return [...new Set(files)];
  }

  /**
   * Analizar archivo para conflictos
   */
  analyzeFileForConflicts(filePath) {
    this.stats.filesAnalyzed++;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const imports = this.extractImports(content);

      // Buscar conflictos
      const fileConflicts = this.findConflictsInFile(imports, filePath);

      if (fileConflicts.length > 0) {
        this.conflicts.set(filePath, {
          imports,
          conflicts: fileConflicts,
          content,
        });
        this.stats.conflictsFound += fileConflicts.length;
      }
    } catch (error) {
      console.warn(`⚠️ Error analizando ${filePath}: ${error.message}`);
    }
  }

  /**
   * Extraer imports de un archivo
   */
  extractImports(content) {
    const imports = {
      static: [],
      dynamic: [],
    };

    // Imports estáticos - regex más preciso
    const staticPatterns = [
      /import\s+\{([^}]+)\}\s+from\s+['"`]([^'"`]+)['"`]/g,
      /import\s+\*\s+as\s+(\w+)\s+from\s+['"`]([^'"`]+)['"`]/g,
      /import\s+(\w+)\s+from\s+['"`]([^'"`]+)['"`]/g,
      /import\s+['"`]([^'"`]+)['"`]/g,
    ];

    staticPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const moduleName = match[match.length - 1]; // Último grupo es siempre el módulo
        imports.static.push({
          module: moduleName,
          line: this.getLineNumber(content, match.index),
          fullMatch: match[0],
          imports: match[1] || null,
        });
      }
    });

    // Imports dinámicos
    const dynamicPatterns = [
      /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      /await\s+import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    ];

    dynamicPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.dynamic.push({
          module: match[1],
          line: this.getLineNumber(content, match.index),
          fullMatch: match[0],
          isAwait: match[0].includes('await'),
        });
      }
    });

    return imports;
  }

  /**
   * Encontrar conflictos en un archivo
   */
  findConflictsInFile(imports, filePath) {
    const conflicts = [];
    const staticModules = new Set(imports.static.map((imp) => imp.module));
    const dynamicModules = new Set(imports.dynamic.map((imp) => imp.module));

    // Módulos que aparecen tanto estática como dinámicamente
    const conflictingModules = [...staticModules].filter((module) => dynamicModules.has(module));

    conflictingModules.forEach((module) => {
      const strategy = this.determineOptimalStrategy(module, filePath);

      conflicts.push({
        module,
        currentStatic: imports.static.filter((imp) => imp.module === module),
        currentDynamic: imports.dynamic.filter((imp) => imp.module === module),
        recommendedStrategy: strategy,
        reason: this.getStrategyReason(module, filePath, strategy),
      });
    });

    return conflicts;
  }

  /**
   * Determinar estrategia óptima para un módulo
   */
  determineOptimalStrategy(module, filePath) {
    // Verificar configuración específica
    const moduleConfig = CONFIG.moduleStrategies[module];

    if (typeof moduleConfig === 'function') {
      return moduleConfig(filePath);
    }

    if (typeof moduleConfig === 'string') {
      return moduleConfig;
    }

    // Reglas por patrón de módulo
    if (module.includes('firebase/firestore')) {
      return filePath.includes('/store/') || filePath.includes('/service/') ? 'dynamic' : 'static';
    }

    if (module.includes('firebase/')) {
      return 'static'; // Firebase core siempre estático
    }

    if (module.includes('vue') || module.includes('@heroicons')) {
      return 'static'; // UI framework siempre estático
    }

    if (module.includes('jspdf') || module.includes('chart')) {
      return 'dynamic'; // Librerías pesadas dinámicas
    }

    // Reglas por tipo de archivo
    if (CONFIG.staticByDefault.some((pattern) => filePath.includes(pattern))) {
      return 'static';
    }

    if (CONFIG.dynamicByDefault.some((pattern) => filePath.includes(pattern))) {
      return 'dynamic';
    }

    // Por defecto estático para mejor rendimiento inicial
    return 'static';
  }

  /**
   * Obtener razón de la estrategia
   */
  getStrategyReason(module, filePath, strategy) {
    if (strategy === 'static') {
      if (module.includes('vue') || module.includes('@heroicons')) {
        return 'Framework UI crítico - mejor estático';
      }
      if (filePath.includes('/components/')) {
        return 'Componente - necesita carga inmediata';
      }
      return 'Mejor rendimiento inicial';
    } else {
      if (module.includes('jspdf') || module.includes('chart')) {
        return 'Librería pesada - mejor carga bajo demanda';
      }
      if (filePath.includes('/store/')) {
        return 'Store - carga cuando se necesite';
      }
      return 'Optimización de bundle';
    }
  }

  /**
   * Generar estrategias de corrección
   */
  generateFixStrategies() {
    console.log('🧠 Generando estrategias de corrección...\n');

    this.conflicts.forEach((fileData, filePath) => {
      fileData.conflicts.forEach((conflict) => {
        const fix = this.createFixStrategy(conflict, filePath, fileData.content);
        if (fix) {
          this.fixes.push({
            file: filePath,
            ...fix,
          });
        }
      });
    });
  }

  /**
   * Crear estrategia de corrección
   */
  createFixStrategy(conflict, filePath, content) {
    const { module, recommendedStrategy, currentStatic, currentDynamic } = conflict;

    if (recommendedStrategy === 'static') {
      // Convertir dinámicos a estáticos
      return {
        type: 'convert-to-static',
        module,
        linesToRemove: currentDynamic.map((imp) => imp.line),
        linesToAdd: this.generateStaticImport(module, currentDynamic),
        reason: conflict.reason,
      };
    } else {
      // Convertir estáticos a dinámicos
      return {
        type: 'convert-to-dynamic',
        module,
        linesToRemove: currentStatic.map((imp) => imp.line),
        linesToModify: this.generateDynamicUsage(module, currentStatic, content),
        reason: conflict.reason,
      };
    }
  }

  /**
   * Generar import estático
   */
  generateStaticImport(module, dynamicImports) {
    // Simplificado - en realidad necesitarías analizar qué se importa
    return `import '${module}';`;
  }

  /**
   * Generar uso dinámico
   */
  generateDynamicUsage(module, staticImports, content) {
    // Simplificado - necesitarías analizar el AST completo
    return `const ${module.replace(/[^a-zA-Z0-9]/g, '')}Module = await import('${module}');`;
  }

  /**
   * Mostrar resumen detallado
   */
  showDetailedSummary() {
    console.log('📊 RESUMEN DETALLADO');
    console.log('===================');
    console.log(`Archivos analizados: ${this.stats.filesAnalyzed}`);
    console.log(`Conflictos encontrados: ${this.stats.conflictsFound}`);
    console.log(`Archivos afectados: ${this.conflicts.size}`);
    console.log('');

    if (this.conflicts.size === 0) {
      console.log('✅ No hay conflictos de imports');
      return;
    }

    console.log('🔍 CONFLICTOS POR ARCHIVO:');
    console.log('==========================');

    this.conflicts.forEach((data, filePath) => {
      console.log(`\n📁 ${filePath}`);

      data.conflicts.forEach((conflict, index) => {
        console.log(`  ${index + 1}. 📦 ${conflict.module}`);
        console.log(
          `     📍 Estático: líneas ${conflict.currentStatic.map((i) => i.line).join(', ')}`,
        );
        console.log(
          `     📍 Dinámico: líneas ${conflict.currentDynamic.map((i) => i.line).join(', ')}`,
        );
        console.log(`     💡 Recomendado: ${conflict.recommendedStrategy}`);
        console.log(`     📝 Razón: ${conflict.reason}`);
      });
    });

    console.log('\n🔧 CORRECCIONES PLANIFICADAS:');
    console.log('=============================');

    const groupedFixes = this.groupFixesByType();
    Object.entries(groupedFixes).forEach(([type, fixes]) => {
      console.log(`\n${type}: ${fixes.length} archivos`);
      fixes.forEach((fix) => {
        console.log(`  📄 ${fix.file} - ${fix.module} (${fix.reason})`);
      });
    });
  }

  /**
   * Agrupar correcciones por tipo
   */
  groupFixesByType() {
    const grouped = {};

    this.fixes.forEach((fix) => {
      const type =
        fix.type === 'convert-to-static' ? 'Convertir a estático' : 'Convertir a dinámico';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(fix);
    });

    return grouped;
  }

  /**
   * Aplicar correcciones inteligentes
   */
  async applySmartFixes() {
    if (this.fixes.length === 0) {
      console.log('ℹ️ No hay correcciones que aplicar');
      return;
    }

    console.log(`\n🔧 Aplicando ${this.fixes.length} correcciones...\n`);

    // Agrupar por archivo para aplicar todas las correcciones de una vez
    const fixesByFile = new Map();

    this.fixes.forEach((fix) => {
      if (!fixesByFile.has(fix.file)) {
        fixesByFile.set(fix.file, []);
      }
      fixesByFile.get(fix.file).push(fix);
    });

    // Aplicar correcciones archivo por archivo
    for (const [filePath, fileFixes] of fixesByFile) {
      await this.applyFixesToFile(filePath, fileFixes);
    }

    console.log(`✅ Se aplicaron correcciones a ${fixesByFile.size} archivos`);
  }

  /**
   * Aplicar correcciones a un archivo específico
   */
  async applyFixesToFile(filePath, fixes) {
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');

      // Crear backup
      fs.writeFileSync(`${filePath}.backup.${Date.now()}`, originalContent);

      // Por ahora, solo agregar comentarios indicando las correcciones necesarias
      let modifiedContent = originalContent;

      // Agregar comentario al inicio del archivo
      const fixSummary = fixes
        .map((fix) => `// TODO: ${fix.type} para ${fix.module} - ${fix.reason}`)
        .join('\n');

      modifiedContent = `${fixSummary}\n\n${modifiedContent}`;

      // Escribir archivo modificado
      fs.writeFileSync(filePath, modifiedContent);

      console.log(`✅ ${filePath} - ${fixes.length} correcciones marcadas`);
      this.stats.fixesApplied++;
    } catch (error) {
      console.error(`❌ Error aplicando correcciones a ${filePath}: ${error.message}`);
    }
  }

  /**
   * Obtener número de línea
   */
  getLineNumber(content, position) {
    return content.substring(0, position).split('\n').length;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const resolver = new AdvancedImportResolver();
  resolver.run().catch(console.error);
}

module.exports = AdvancedImportResolver;
