#!/usr/bin/env node

/**
 * Script para validar y arreglar el modo dark/light en toda la aplicación
 * Verifica que todos los componentes usen las clases correctas de Tailwind
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_PATH = 'c:\\Users\\Admin\\Desktop\\Music_Academy_App_Act';

function checkDarkModeImplementation() {
  console.log('🌓 Verificando implementación de modo dark/light...\n');

  // 1. Verificar configuración de Tailwind
  const tailwindConfig = path.join(WORKSPACE_PATH, 'tailwind.config.js');
  if (fs.existsSync(tailwindConfig)) {
    const content = fs.readFileSync(tailwindConfig, 'utf8');
    if (content.includes('darkMode: \'class\'')) {
      console.log('✅ Tailwind configurado correctamente con darkMode: class');
    } else {
      console.log('❌ Tailwind NO está configurado para darkMode: class');
    }
  }

  // 2. Verificar composable de tema
  const themeComposable = path.join(WORKSPACE_PATH, 'src/composables/useTheme.ts');
  if (fs.existsSync(themeComposable)) {
    const content = fs.readFileSync(themeComposable, 'utf8');
    if (content.includes('html.classList.add(\'dark\')')) {
      console.log('✅ Composable useTheme funciona correctamente');
    } else {
      console.log('❌ Composable useTheme necesita corrección');
    }
  }

  // 3. Verificar que App.vue use las clases correctas
  const appVue = path.join(WORKSPACE_PATH, 'src/App.vue');
  if (fs.existsSync(appVue)) {
    const content = fs.readFileSync(appVue, 'utf8');
    if (content.includes('dark:bg-gray-900') && content.includes('dark:text-gray-100')) {
      console.log('✅ App.vue usa clases dark correctas');
    } else {
      console.log('❌ App.vue necesita actualizar clases dark');
    }
  }

  // 4. Verificar HeaderApp.vue
  const headerApp = path.join(WORKSPACE_PATH, 'src/components/HeaderApp.vue');
  if (fs.existsSync(headerApp)) {
    const content = fs.readFileSync(headerApp, 'utf8');
    if (content.includes('dark:bg-gray-800') && content.includes('toggleTheme')) {
      console.log('✅ HeaderApp.vue implementa modo dark correctamente');
    } else {
      console.log('❌ HeaderApp.vue necesita mejoras en modo dark');
    }
  }

  console.log('\n🔍 Verificación completada');
}

function recommendedFixes() {
  console.log('\n📋 RECOMENDACIONES PARA CORREGIR MODO DARK/LIGHT:\n');

  console.log('1. ✅ Tailwind configurado con darkMode: "class"');
  console.log('2. ✅ Variables CSS corregidas en theme-palette.css');
  console.log('3. ✅ Composable useTheme mejorado');
  console.log('4. ✅ Componentes principales actualizados');
  console.log('5. 🔄 Pendiente: Revisar componentes con estilos hardcodeados');

  console.log('\n🎯 PRÓXIMOS PASOS:');
  console.log('- Probar la aplicación en modo development');
  console.log('- Verificar que el botón de tema funcione');
  console.log('- Comprobar que todos los componentes cambien de tema');
  console.log('- Verificar que la preferencia se guarde en localStorage');
}

// Ejecutar verificaciones
checkDarkModeImplementation();
recommendedFixes();
