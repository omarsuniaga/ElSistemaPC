#!/usr/bin/env node

/**
 * Script para verificar que todos los componentes Vue usen los colores correctos
 * para modo dark/light con Tailwind CSS
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clases CSS variables problemáticas que no deberían existir
const PROBLEMATIC_CLASSES = [
  'text-foreground',
  'text-secondary',
  'text-muted',
  'text-destructive',
  'bg-card',
  'bg-muted',
  'bg-accent',
  'border-border',
  'border-muted',
  'hover:bg-muted',
  'text-primary(?![- ])', // text-primary sin guión o espacio después
];

// Patrones recomendados para reemplazar
const RECOMMENDED_REPLACEMENTS = {
  'text-foreground': 'text-gray-900 dark:text-white',
  'text-secondary': 'text-gray-600 dark:text-gray-400',
  'text-muted': 'text-gray-400 dark:text-gray-500',
  'text-destructive': 'text-red-600 dark:text-red-400',
  'bg-card': 'bg-white dark:bg-gray-800',
  'bg-muted': 'bg-gray-100 dark:bg-gray-700',
  'bg-accent': 'bg-blue-600',
  'border-border': 'border-gray-200 dark:border-gray-700',
  'border-muted': 'border-gray-300 dark:border-gray-600',
  'hover:bg-muted': 'hover:bg-gray-100 dark:hover:bg-gray-700',
};

async function findVueFiles(dir = 'src') {
  const vueFiles = [];

  function walkDir(dirPath) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.vue')) {
        vueFiles.push(filePath);
      }
    });
  }

  try {
    const srcPath = path.join(path.dirname(__dirname), dir);
    walkDir(srcPath);
    return vueFiles;
  } catch (error) {
    console.error('Error finding Vue files:', error);
    return [];
  }
}

function checkFileForProblematicClasses(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    PROBLEMATIC_CLASSES.forEach((pattern) => {
      const regex = new RegExp(pattern, 'g');
      let match;

      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const line = content.split('\n')[lineNumber - 1].trim();

        issues.push({
          pattern: match[0],
          lineNumber,
          line,
          recommendation:
            RECOMMENDED_REPLACEMENTS[match[0]] || 'Use appropriate Tailwind dark mode classes',
        });
      }
    });

    return issues;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

function checkForMissingDarkModeClasses(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Buscar clases de color que no tengan variante dark
    const colorClasses = [
      'text-gray-\\d+',
      'bg-gray-\\d+',
      'border-gray-\\d+',
      'text-blue-\\d+',
      'bg-blue-\\d+',
      'text-red-\\d+',
      'bg-red-\\d+',
      'text-green-\\d+',
      'bg-green-\\d+',
    ];

    colorClasses.forEach((pattern) => {
      const regex = new RegExp(`class="[^"]*\\b(${pattern})\\b(?![^"]*dark:)`, 'g');
      let match;

      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const line = content.split('\n')[lineNumber - 1].trim();

        // Skip if it's already inside a dark: variant or if it's a neutral class that might not need dark variant
        if (
          !line.includes('dark:') &&
          !match[1].includes('white') &&
          !match[1].includes('transparent')
        ) {
          issues.push({
            class: match[1],
            lineNumber,
            line,
            type: 'missing-dark-variant',
            recommendation: `Consider adding dark: variant for ${match[1]}`,
          });
        }
      }
    });

    return issues;
  } catch (error) {
    console.error(`Error checking dark mode classes in ${filePath}:`, error);
    return [];
  }
}

async function main() {
  console.log('🔍 Verificando colores de modo dark/light en componentes Vue...\n');

  const vueFiles = await findVueFiles();

  if (vueFiles.length === 0) {
    console.log('❌ No se encontraron archivos Vue');
    return;
  }

  console.log(`📁 Encontrados ${vueFiles.length} archivos Vue\n`);

  let totalIssues = 0;
  const fileIssues = {};

  vueFiles.forEach((filePath) => {
    const relativePath = path.relative(process.cwd(), filePath);
    const problematicIssues = checkFileForProblematicClasses(filePath);
    const darkModeIssues = checkForMissingDarkModeClasses(filePath);

    const allIssues = [...problematicIssues, ...darkModeIssues];

    if (allIssues.length > 0) {
      fileIssues[relativePath] = allIssues;
      totalIssues += allIssues.length;
    }
  });

  if (totalIssues === 0) {
    console.log(
      '✅ ¡Perfecto! Todos los archivos usan clases de color correctas para modo dark/light',
    );
    return;
  }

  console.log(`⚠️  Encontrados ${totalIssues} problemas potenciales:\n`);

  Object.entries(fileIssues).forEach(([filePath, issues]) => {
    console.log(`📄 ${filePath}:`);

    issues.forEach((issue) => {
      if (issue.type === 'missing-dark-variant') {
        console.log(
          `  ⚡ Línea ${issue.lineNumber}: Posible falta de variante dark para "${issue.class}"`,
        );
        console.log(`     💡 ${issue.recommendation}`);
      } else {
        console.log(`  ❌ Línea ${issue.lineNumber}: Clase problemática "${issue.pattern}"`);
        console.log(`     💡 Recomendación: ${issue.recommendation}`);
      }
      console.log(`     📍 ${issue.line}`);
      console.log('');
    });

    console.log('');
  });

  console.log('🔧 Para corregir estos problemas:');
  console.log('1. Reemplaza las clases CSS variables por clases Tailwind apropiadas');
  console.log(
    '2. Asegúrate de que todas las clases de color tengan variantes dark: cuando sea necesario',
  );
  console.log('3. Usa text-gray-900 dark:text-white para texto principal');
  console.log('4. Usa text-gray-600 dark:text-gray-400 para texto secundario');
  console.log('5. Usa bg-white dark:bg-gray-800 para fondos de tarjetas');
}

main().catch(console.error);

export { findVueFiles, checkFileForProblematicClasses, checkForMissingDarkModeClasses };
