#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { cyan, red, green, yellow } = require('chalk');
const { validators } = require('../src/standards/development.standards');

// Configuración
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const ALLOWED_EXTENSIONS = ['.ts', '.vue', '.js'];
const MAX_FILE_SIZE_KB = 500; // Tamaño máximo de archivo en KB

// Estadísticas
const stats = {
  totalFiles: 0,
  oversizedFiles: [],
  invalidStructure: [],
  totalLines: 0,
  startTime: Date.now(),
};

/**
 * Verifica si un archivo debe ser procesado
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Obtiene estadísticas de un archivo
 */
function getFileStats(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').length;
  const sizeKB = (fs.statSync(filePath).size / 1024).toFixed(2);
  
  return { content, lines, sizeKB };
}

/**
 * Verifica el tamaño del archivo
 */
function checkFileSize(filePath, sizeKB) {
  if (parseFloat(sizeKB) > MAX_FILE_SIZE_KB) {
    stats.oversizedFiles.push({
      file: path.relative(PROJECT_ROOT, filePath),
      size: `${sizeKB} KB`,
    });
    return false;
  }
  return true;
}

/**
 * Verifica la estructura del componente Vue
 */
function checkVueStructure(filePath, content) {
  if (filePath.endsWith('.vue')) {
    const isValid = validators.validateComponentStructure(content);
    if (!isValid) {
      stats.invalidStructure.push(path.relative(PROJECT_ROOT, filePath));
      return false;
    }
  }
  return true;
}

/**
 * Procesa un directorio recursivamente
 */
function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (shouldProcessFile(fullPath)) {
      stats.totalFiles++;
      const { content, lines, sizeKB } = getFileStats(fullPath);
      stats.totalLines += lines;
      
      checkFileSize(fullPath, sizeKB);
      checkVueStructure(fullPath, content);
    }
  }
}

/**
 * Muestra el resumen del análisis
 */
function showSummary() {
  console.log('\n' + '='.repeat(60));
  console.log(cyan('  ANÁLISIS DE ESTÁNDARES DE DESARROLLO'));
  console.log('='.repeat(60));
  
  // Resumen general
  console.log(`\n📊 ${cyan('Resumen General:')}`);
  console.log(`   • Archivos analizados: ${stats.totalFiles}`);
  console.log(`   • Líneas de código totales: ${stats.totalLines}`);
  console.log(`   • Tiempo de ejecución: ${((Date.now() - stats.startTime) / 1000).toFixed(2)}s`);
  
  // Archivos que exceden el tamaño
  if (stats.oversizedFiles.length > 0) {
    console.log(`\n⚠️  ${yellow('Archivos que exceden el tamaño recomendado:')}`);
    stats.oversizedFiles.forEach(file => {
      console.log(`   • ${file.file} (${file.size})`);
    });
  }
  
  // Estructura inválida
  if (stats.invalidStructure.length > 0) {
    console.log(`\n❌ ${red('Archivos con estructura inválida:')}`);
    stats.invalidStructure.forEach(file => {
      console.log(`   • ${file}`);
    });
  }
  
  // Resultado final
  if (stats.oversizedFiles.length === 0 && stats.invalidStructure.length === 0) {
    console.log(`\n🎉 ${green('¡Todos los archivos cumplen con los estándares!')}`);
    process.exit(0);
  } else {
    console.log(`\n🔧 ${yellow('Se encontraron problemas que requieren atención.')}`);
    process.exit(1);
  }
}

// Ejecutar el análisis
console.log(cyan('🔍 Analizando estándares de desarrollo...'));
processDirectory(SRC_DIR);
showSummary();
