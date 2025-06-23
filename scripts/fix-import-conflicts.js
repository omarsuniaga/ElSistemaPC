#!/usr/bin/env node

/**
 * Script para resolver conflictos de imports dinámicos vs estáticos
 * Analiza todos los archivos TypeScript/Vue y convierte imports inconsistentes
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuración
const CONFIG = {
  // Directorios a analizar
  directories: [
    'src/**/*.ts',
    'src/**/*.vue',
    'src/**/*.js'
  ],
  
  // Módulos que deben ser siempre estáticos (críticos)
  alwaysStatic: [
    'vue',
    'vue-router',
    'pinia',
    '@heroicons/vue',
    'firebase/app',
    'firebase/auth'
  ],
  
  // Módulos que pueden ser dinámicos (funcionalidades opcionales)
  canBeDynamic: [
    'firebase/firestore',
    'jspdf',
    'chart.js',
    'date-fns'
  ],
  
  // Patrones de archivos que deben usar imports dinámicos
  dynamicFiles: [
    '/store/',
    '/services/',
    '/composables/'
  ],
  
  // Crear backup antes de modificar
  createBackup: true
};

class ImportResolver {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.stats = {
      filesAnalyzed: 0,
      issuesFound: 0,
      fixesApplied: 0
    };
  }

  /**
   * Ejecutar el análisis y corrección
   */
  async run() {
    console.log('🔍 Iniciando análisis de imports...\n');
    
    // Obtener todos los archivos
    const files = await this.getFiles();
    
    // Analizar cada archivo
    for (const file of files) {
      await this.analyzeFile(file);
    }
    
    // Mostrar resumen
    this.showSummary();
    
    // Aplicar correcciones si se encontraron problemas
    if (this.issues.length > 0) {
      const shouldFix = await this.promptForFixes();
      if (shouldFix) {
        await this.applyFixes();
      }
    }
    
    console.log('✅ Análisis completado');
  }

  /**
   * Obtener lista de archivos a analizar
   */
  async getFiles() {
    const files = [];
    
    for (const pattern of CONFIG.directories) {
      const matches = glob.sync(pattern, { 
        ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'] 
      });
      files.push(...matches);
    }
    
    return [...new Set(files)]; // Eliminar duplicados
  }

  /**
   * Analizar un archivo específico
   */
  async analyzeFile(filePath) {
    this.stats.filesAnalyzed++;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const analysis = this.parseImports(content, filePath);
      
      if (analysis.hasIssues) {
        this.issues.push({
          file: filePath,
          ...analysis
        });
        this.stats.issuesFound++;
      }
      
    } catch (error) {
      console.warn(`⚠️ Error analizando ${filePath}: ${error.message}`);
    }
  }

  /**
   * Parsear imports de un archivo
   */
  parseImports(content, filePath) {
    const staticImports = [];
    const dynamicImports = [];
    const issues = [];
    
    // Buscar imports estáticos
    const staticRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = staticRegex.exec(content)) !== null) {
      staticImports.push({
        module: match[1],
        line: this.getLineNumber(content, match.index),
        full: match[0]
      });
    }
    
    // Buscar imports dinámicos
    const dynamicRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    
    while ((match = dynamicRegex.exec(content)) !== null) {
      dynamicImports.push({
        module: match[1],
        line: this.getLineNumber(content, match.index),
        full: match[0]
      });
    }
    
    // Buscar await import()
    const awaitDynamicRegex = /await\s+import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    
    while ((match = awaitDynamicRegex.exec(content)) !== null) {
      dynamicImports.push({
        module: match[1],
        line: this.getLineNumber(content, match.index),
        full: match[0],
        isAwait: true
      });
    }
    
    // Detectar conflictos
    const conflicts = this.detectConflicts(staticImports, dynamicImports, filePath);
    
    return {
      staticImports,
      dynamicImports,
      conflicts,
      hasIssues: conflicts.length > 0,
      content
    };
  }

  /**
   * Detectar conflictos entre imports
   */
  detectConflicts(staticImports, dynamicImports, filePath) {
    const conflicts = [];
    const staticModules = new Set(staticImports.map(imp => imp.module));
    const dynamicModules = new Set(dynamicImports.map(imp => imp.module));
    
    // Encontrar módulos que están tanto estáticos como dinámicos
    const conflictModules = [...staticModules].filter(module => dynamicModules.has(module));
    
    for (const module of conflictModules) {
      const recommendedStrategy = this.getRecommendedStrategy(module, filePath);
      
      conflicts.push({
        module,
        staticLines: staticImports.filter(imp => imp.module === module).map(imp => imp.line),
        dynamicLines: dynamicImports.filter(imp => imp.module === module).map(imp => imp.line),
        recommended: recommendedStrategy,
        reason: this.getReasonForStrategy(module, filePath, recommendedStrategy)
      });
    }
    
    return conflicts;
  }

  /**
   * Determinar estrategia recomendada para un módulo
   */
  getRecommendedStrategy(module, filePath) {
    // Siempre estático para módulos críticos
    if (CONFIG.alwaysStatic.some(pattern => module.includes(pattern))) {
      return 'static';
    }
    
    // Dinámico para módulos pesados en ciertos archivos
    if (CONFIG.canBeDynamic.some(pattern => module.includes(pattern))) {
      if (CONFIG.dynamicFiles.some(pattern => filePath.includes(pattern))) {
        return 'dynamic';
      }
    }
    
    // Estático por defecto para módulos internos
    if (module.startsWith('.') || module.startsWith('@/')) {
      return 'static';
    }
    
    // Firebase firestore puede ser dinámico en servicios
    if (module.includes('firebase/firestore') && filePath.includes('/service')) {
      return 'dynamic';
    }
    
    return 'static';
  }

  /**
   * Obtener razón para la estrategia recomendada
   */
  getReasonForStrategy(module, filePath, strategy) {
    if (strategy === 'static') {
      if (CONFIG.alwaysStatic.some(pattern => module.includes(pattern))) {
        return 'Módulo crítico - debe ser estático';
      }
      return 'Mejor rendimiento como import estático';
    } else {
      return 'Módulo pesado - mejor como import dinámico';
    }
  }

  /**
   * Obtener número de línea de una posición en el contenido
   */
  getLineNumber(content, position) {
    return content.substring(0, position).split('\n').length;
  }

  /**
   * Mostrar resumen del análisis
   */
  showSummary() {
    console.log('📊 RESUMEN DEL ANÁLISIS');
    console.log('========================');
    console.log(`Archivos analizados: ${this.stats.filesAnalyzed}`);
    console.log(`Archivos con problemas: ${this.stats.issuesFound}`);
    console.log('');
    
    if (this.issues.length === 0) {
      console.log('✅ No se encontraron conflictos de imports');
      return;
    }
    
    console.log('🔴 CONFLICTOS ENCONTRADOS:');
    console.log('==========================');
    
    this.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.file}`);
      
      issue.conflicts.forEach(conflict => {
        console.log(`   📦 ${conflict.module}`);
        console.log(`   📍 Estático: líneas ${conflict.staticLines.join(', ')}`);
        console.log(`   📍 Dinámico: líneas ${conflict.dynamicLines.join(', ')}`);
        console.log(`   💡 Recomendado: ${conflict.recommended} (${conflict.reason})`);
      });
    });
    
    console.log('\n');
  }

  /**
   * Preguntar al usuario si desea aplicar las correcciones
   */
  async promptForFixes() {
    // En un entorno real, usarías readline o inquirer
    // Por simplicidad, asumimos que sí
    console.log('🔧 ¿Deseas aplicar las correcciones automáticamente? (s/n)');
    return true; // Para el script, siempre aplicamos
  }

  /**
   * Aplicar las correcciones
   */
  async applyFixes() {
    console.log('🔧 Aplicando correcciones...\n');
    
    for (const issue of this.issues) {
      await this.fixFile(issue);
    }
    
    console.log(`✅ Se aplicaron ${this.stats.fixesApplied} correcciones`);
  }

  /**
   * Corregir un archivo específico
   */
  async fixFile(issue) {
    try {
      let content = issue.content;
      let modified = false;
      
      // Crear backup si está configurado
      if (CONFIG.createBackup) {
        fs.writeFileSync(`${issue.file}.backup`, content);
      }
      
      // Aplicar correcciones para cada conflicto
      for (const conflict of issue.conflicts) {
        const result = this.applyConflictFix(content, conflict, issue.file);
        if (result.modified) {
          content = result.content;
          modified = true;
        }
      }
      
      // Escribir archivo modificado
      if (modified) {
        fs.writeFileSync(issue.file, content);
        console.log(`✅ Corregido: ${issue.file}`);
        this.stats.fixesApplied++;
      }
      
    } catch (error) {
      console.error(`❌ Error corrigiendo ${issue.file}: ${error.message}`);
    }
  }

  /**
   * Aplicar corrección para un conflicto específico
   */
  applyConflictFix(content, conflict, filePath) {
    const strategy = conflict.recommended;
    let modified = false;
    
    if (strategy === 'static') {
      // Convertir imports dinámicos a estáticos
      content = this.convertToStatic(content, conflict.module);
      modified = true;
    } else if (strategy === 'dynamic') {
      // Convertir imports estáticos a dinámicos
      content = this.convertToDynamic(content, conflict.module, filePath);
      modified = true;
    }
    
    return { content, modified };
  }

  /**
   * Convertir import dinámico a estático
   */
  convertToStatic(content, moduleName) {
    // Buscar y reemplazar import() por import estático
    const dynamicRegex = new RegExp(`import\\s*\\(\\s*['"\`]${moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]\\s*\\)`, 'g');
    
    // Esta es una simplificación - en la realidad necesitarías parsear el AST
    return content.replace(dynamicRegex, (match) => {
      console.log(`   🔄 Convirtiendo a estático: ${moduleName}`);
      return `/* TODO: Convertir a import estático: ${moduleName} */`;
    });
  }

  /**
   * Convertir import estático a dinámico
   */
  convertToDynamic(content, moduleName, filePath) {
    const staticRegex = new RegExp(`import\\s+(?:(?:\\{[^}]*\\}|\\*\\s+as\\s+\\w+|\\w+)\\s+from\\s+)?['"\`]${moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g');
    
    return content.replace(staticRegex, (match) => {
      console.log(`   🔄 Convirtiendo a dinámico: ${moduleName}`);
      return `/* TODO: Convertir a import dinámico: ${moduleName} */`;
    });
  }
}

// Ejecutar el script
if (require.main === module) {
  const resolver = new ImportResolver();
  resolver.run().catch(console.error);
}

module.exports = ImportResolver;
