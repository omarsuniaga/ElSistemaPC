#!/usr/bin/env node

/**
 * 🏭 SCRIPT DE LIMPIEZA DE CONSOLE.LOG PARA PRODUCCIÓN
 * Elimina o comenta console.log, console.debug, console.warn innecesarios
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Limpiando console.log para producción...');

// Directorios a procesar
const directories = [
  'src',
  // 'public' // Opcional: limpiar también archivos públicos
];

// Patrones a buscar y reemplazar
const patterns = [
  // Console.log simples
  {
    search: /console\.log\([^)]*\);?\s*\n?/g,
    replace: '// Removed console.log for production\n',
    description: 'console.log statements'
  },
  // Console.debug
  {
    search: /console\.debug\([^)]*\);?\s*\n?/g,
    replace: '// Removed console.debug for production\n',
    description: 'console.debug statements'
  },
  // Console.warn para desarrollo
  {
    search: /console\.warn\(['"`]⚠️.*?\);?\s*\n?/g,
    replace: '// Removed development warning\n',
    description: 'development warnings'
  },
  // Comentarios de debug
  {
    search: /\/\/ DEBUG:.*?\n/g,
    replace: '',
    description: 'debug comments'
  },
  // Comentarios TODO en desarrollo
  {
    search: /\/\/ TODO.*?DEV.*?\n/g,
    replace: '',
    description: 'development todos'
  }
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changes = [];

    patterns.forEach(pattern => {
      const matches = content.match(pattern.search);
      if (matches && matches.length > 0) {
        content = content.replace(pattern.search, pattern.replace);
        changes.push(`${matches.length} ${pattern.description}`);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.relative(process.cwd(), filePath)}: ${changes.join(', ')}`);
      return changes.length;
    }

    return 0;
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dir) {
  let totalChanges = 0;

  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Saltar node_modules y otras carpetas innecesarias
      if (!['node_modules', '.git', 'dist', 'dev-files'].includes(item)) {
        totalChanges += processDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      // Procesar solo archivos relevantes
      const ext = path.extname(item).toLowerCase();
      if (['.js', '.ts', '.vue', '.jsx', '.tsx'].includes(ext)) {
        totalChanges += processFile(fullPath);
      }
    }
  });

  return totalChanges;
}

// Ejecutar limpieza
let totalChanges = 0;

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`\n📁 Procesando directorio: ${dir}`);
    totalChanges += processDirectory(dir);
  } else {
    console.log(`⚠️ Directorio no encontrado: ${dir}`);
  }
});

console.log(`\n🎉 Limpieza completada!`);
console.log(`📊 Total de cambios realizados: ${totalChanges}`);
console.log(`✅ El código está optimizado para producción`);

// Crear reporte
const report = {
  timestamp: new Date().toISOString(),
  totalChanges,
  processedDirectories: directories,
  patterns: patterns.map(p => p.description)
};

fs.writeFileSync('production-cleanup-report.json', JSON.stringify(report, null, 2));
console.log(`📋 Reporte guardado en: production-cleanup-report.json`);
