/**
 * Script de verificación rápida de configuración
 */

import {config} from "dotenv"
import fs from "fs"
import path from "path"

// Cargar variables de entorno
config()

console.log("🔍 Verificando configuración...\n")

// Verificar variables de entorno
const requiredVars = [
  "VITE_APP_API_KEY",
  "VITE_APP_AUTH_DOMAIN",
  "VITE_APP_PROJECT_ID",
  "VITE_APP_STORAGE_BUCKET",
  "VITE_APP_MESSAGING_SENDER_ID",
  "VITE_APP_APP_ID",
]

console.log("🔑 Variables de entorno:")
requiredVars.forEach((varName) => {
  const value = process.env[varName]
  const status = value ? "✅" : "❌"
  const display = value ? `${value.substring(0, 20)}...` : "NO DEFINIDA"
  console.log(`${status} ${varName}: ${display}`)
})

// Verificar archivo CSV
console.log("\n📄 Archivo CSV:")
const csvPath = path.join(process.cwd(), "INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv")
if (fs.existsSync(csvPath)) {
  const stats = fs.statSync(csvPath)
  const content = fs.readFileSync(csvPath, "utf-8")
  const lines = content.split("\n").filter((line) => line.trim() !== "")

  console.log("✅ INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv encontrado")
  console.log(`📊 Tamaño: ${(stats.size / 1024).toFixed(2)} KB`)
  console.log(`📝 Líneas: ${lines.length} (${lines.length - 1} estudiantes)`)

  if (lines.length > 0) {
    console.log(`📋 Header: ${lines[0]}`)
  }

  if (lines.length > 1) {
    console.log(`📝 Ejemplo: ${lines[1]}`)
  }
} else {
  console.log("❌ Archivo CSV no encontrado")
  console.log(`📍 Esperado en: ${csvPath}`)
}

// Verificar directorio de backups
console.log("\n📁 Directorio de backups:")
const backupsDir = path.join(process.cwd(), "backups")
if (fs.existsSync(backupsDir)) {
  const files = fs.readdirSync(backupsDir)
  console.log(`✅ Directorio existe con ${files.length} archivos`)

  const backupFiles = files.filter((f) => f.startsWith("backup-alumnos-"))
  if (backupFiles.length > 0) {
    console.log(`📦 Backups existentes: ${backupFiles.length}`)
    console.log(`📅 Más reciente: ${backupFiles[backupFiles.length - 1]}`)
  }
} else {
  console.log("📁 Directorio no existe (se creará automáticamente)")
}

console.log("\n🎯 Estado de configuración:")
const hasAllVars = requiredVars.every((varName) => process.env[varName])
const hasCSV = fs.existsSync(csvPath)

if (hasAllVars && hasCSV) {
  console.log("✅ Configuración completa - Listo para migración")
} else {
  console.log("⚠️ Configuración incompleta:")
  if (!hasAllVars) console.log("   - Faltan variables de entorno")
  if (!hasCSV) console.log("   - Falta archivo CSV")
}
