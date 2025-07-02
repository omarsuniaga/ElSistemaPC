#!/usr/bin/env node

/**
 * Script de configuración para integración WhatsApp
 * Netlify ↔ Firebase Functions
 */

const fs = require("fs")
const path = require("path")

console.log("🚀 Configurando integración WhatsApp Netlify ↔ Firebase Functions")
console.log("=".repeat(60))

// Configuración por defecto
const config = {
  firebaseProject: "orquestapuntacana",
  firebaseRegion: "us-central1",
  netlifyUrl: process.env.NETLIFY_URL || "https://your-app.netlify.app",
  environment: process.env.NODE_ENV || "development",
}

console.log("📋 Configuración detectada:")
console.log(`   • Proyecto Firebase: ${config.firebaseProject}`)
console.log(`   • Región: ${config.firebaseRegion}`)
console.log(`   • URL Netlify: ${config.netlifyUrl}`)
console.log(`   • Entorno: ${config.environment}`)
console.log("")

// 1. Verificar archivos de Firebase Functions
console.log("🔍 Verificando Firebase Functions...")
const functionsPath = path.join(__dirname, "functions")
const requiredFiles = ["package.json", "src/index.ts", "tsconfig.json"]

let functionsOk = true
for (const file of requiredFiles) {
  const filePath = path.join(functionsPath, file)
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`)
  } else {
    console.log(`   ❌ ${file} - FALTANTE`)
    functionsOk = false
  }
}

if (!functionsOk) {
  console.log("")
  console.log("⚠️  Algunos archivos de Firebase Functions faltan.")
  console.log("   Ejecuta: firebase init functions")
  process.exit(1)
}

// 2. Verificar dependencias de Functions
console.log("")
console.log("📦 Verificando dependencias de Functions...")
const functionsPackage = require(path.join(functionsPath, "package.json"))
const requiredDeps = [
  "@whiskeysockets/baileys",
  "firebase-functions",
  "firebase-admin",
  "qrcode",
  "cors",
]

let depsOk = true
for (const dep of requiredDeps) {
  if (functionsPackage.dependencies && functionsPackage.dependencies[dep]) {
    console.log(`   ✅ ${dep}`)
  } else {
    console.log(`   ❌ ${dep} - FALTANTE`)
    depsOk = false
  }
}

if (!depsOk) {
  console.log("")
  console.log("📥 Instalando dependencias faltantes...")
  const {execSync} = require("child_process")
  try {
    execSync("cd functions && npm install @whiskeysockets/baileys qrcode qr-image cors", {
      stdio: "inherit",
    })
    console.log("   ✅ Dependencias instaladas")
  } catch (error) {
    console.log("   ❌ Error instalando dependencias")
    console.log("   Manual: cd functions && npm install @whiskeysockets/baileys qrcode cors")
  }
}

// 3. Verificar variables de entorno
console.log("")
console.log("🔧 Verificando variables de entorno...")

// Crear archivo .env.example si no existe
const envExamplePath = path.join(__dirname, ".env.example")
const envContent = `# Variables de entorno para integración WhatsApp
VITE_FIREBASE_FUNCTIONS_URL=https://${config.firebaseRegion}-${config.firebaseProject}.cloudfunctions.net
VITE_WHATSAPP_API_URL=https://${config.firebaseRegion}-${config.firebaseProject}.cloudfunctions.net/whatsappApi
VITE_ENVIRONMENT=${config.environment}
VITE_DEBUG_MODE=true

# Firebase Config (opcional para desarrollo local)
FIREBASE_PROJECT_ID=${config.firebaseProject}
FIREBASE_REGION=${config.firebaseRegion}
`

if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, envContent)
  console.log("   ✅ Creado .env.example")
} else {
  console.log("   ✅ .env.example existe")
}

// 4. Verificar netlify.toml
console.log("")
console.log("🌐 Verificando configuración Netlify...")
const netlifyTomlPath = path.join(__dirname, "netlify.toml")

if (fs.existsSync(netlifyTomlPath)) {
  const tomlContent = fs.readFileSync(netlifyTomlPath, "utf8")

  if (tomlContent.includes("VITE_WHATSAPP_API_URL")) {
    console.log("   ✅ Variables de entorno configuradas en netlify.toml")
  } else {
    console.log("   ⚠️  Variables de entorno faltantes en netlify.toml")
    console.log("      Agregar manualmente las variables VITE_*")
  }

  if (tomlContent.includes('NODE_VERSION = "20"')) {
    console.log("   ✅ Node.js 20 configurado")
  } else {
    console.log("   ⚠️  Node.js 20 no configurado")
    console.log('      Cambiar NODE_VERSION a "20"')
  }
} else {
  console.log("   ❌ netlify.toml no encontrado")
}

// 5. Verificar archivos del frontend
console.log("")
console.log("💻 Verificando archivos frontend...")
const frontendFiles = [
  "src/services/whatsappServiceCentralized.ts",
  "src/composables/useWhatsAppIntegration.ts",
  "src/components/WhatsAppPanelIntegrated.vue",
]

let frontendOk = true
for (const file of frontendFiles) {
  const filePath = path.join(__dirname, file)
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`)
  } else {
    console.log(`   ❌ ${file} - FALTANTE`)
    frontendOk = false
  }
}

// 6. Generar comandos de despliegue
console.log("")
console.log("🚀 Comandos de despliegue:")
console.log("   📡 Firebase Functions:")
console.log("      cd functions && npm run deploy")
console.log("")
console.log("   🌐 Netlify:")
console.log("      npm run build")
console.log("      (Automático en push a main/master)")
console.log("")

// 7. URLs importantes
console.log("🔗 URLs importantes:")
console.log(
  `   • Firebase Console: https://console.firebase.google.com/project/${config.firebaseProject}`
)
console.log(
  `   • Functions URL: https://${config.firebaseRegion}-${config.firebaseProject}.cloudfunctions.net/whatsappApi`
)
console.log(`   • Netlify Dashboard: https://app.netlify.com`)
console.log("")

// 8. Próximos pasos
console.log("✅ Próximos pasos:")
console.log("   1. Desplegar Firebase Functions: cd functions && npm run deploy")
console.log("   2. Configurar variables en Netlify Dashboard")
console.log("   3. Desplegar a Netlify: git push origin main")
console.log("   4. Probar integración en WhatsApp Panel")
console.log("")

// 9. Script de verificación
const checkScript = `#!/bin/bash
# Script de verificación rápida
echo "🔍 Verificando endpoints..."

echo "📡 Probando Firebase Functions..."
curl -s "https://${config.firebaseRegion}-${config.firebaseProject}.cloudfunctions.net/whatsappApi/status" | jq '.' || echo "❌ Functions no responden"

echo "🌐 Probando Netlify..."
curl -s -o /dev/null -w "%{http_code}" "${config.netlifyUrl}" | grep -q "200" && echo "✅ Netlify OK" || echo "❌ Netlify error"

echo "✅ Verificación completada"
`

fs.writeFileSync(path.join(__dirname, "check-integration.sh"), checkScript)
fs.chmodSync(path.join(__dirname, "check-integration.sh"), "755")
console.log("📝 Creado check-integration.sh para verificaciones rápidas")

console.log("")
console.log("🎉 Configuración completada!")
console.log("📚 Ver documentación completa en: docs/INTEGRACION_NETLIFY_FIREBASE_WHATSAPP.md")

// Crear archivo de estado
const statusFile = {
  configured: true,
  timestamp: new Date().toISOString(),
  config,
  version: "1.0.0",
}

fs.writeFileSync(
  path.join(__dirname, ".whatsapp-integration-status.json"),
  JSON.stringify(statusFile, null, 2)
)

console.log("💾 Estado guardado en .whatsapp-integration-status.json")
