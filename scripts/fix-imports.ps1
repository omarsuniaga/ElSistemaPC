# Script PowerShell para ejecutar la corrección de imports
# Ejecutar: .\scripts\fix-imports.ps1

Write-Host "🚀 Music Academy App - Corrector de Imports" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Verificar si Node.js está disponible
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js no encontrado. Por favor instala Node.js" -ForegroundColor Red
    exit 1
}

# Verificar si glob está instalado
Write-Host "`n📦 Verificando dependencias..." -ForegroundColor Yellow

if (!(Test-Path "node_modules/glob")) {
    Write-Host "📦 Instalando dependencia glob..." -ForegroundColor Yellow
    npm install glob
}

Write-Host "`n🔍 Opciones disponibles:" -ForegroundColor Yellow
Write-Host "1. Análisis seguro (recomendado)" -ForegroundColor White
Write-Host "2. Corrección rápida" -ForegroundColor White
Write-Host "3. Análisis avanzado" -ForegroundColor White
Write-Host "4. Corrección completa" -ForegroundColor White

$choice = Read-Host "`nSelecciona una opción (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n🔍 Ejecutando análisis seguro..." -ForegroundColor Green
        node scripts/safe-import-analyzer.js
    }
    "2" {
        Write-Host "`n⚡ Ejecutando corrección rápida..." -ForegroundColor Yellow
        Write-Host "⚠️ ADVERTENCIA: Esto modificará archivos. Se crearán backups." -ForegroundColor Red
        $confirm = Read-Host "¿Continuar? (s/n)"
        if ($confirm -eq "s" -or $confirm -eq "S") {
            node scripts/quick-import-fix.js
        } else {
            Write-Host "❌ Operación cancelada" -ForegroundColor Red
            exit 0
        }
    }
    "3" {
        Write-Host "`n🧠 Ejecutando análisis avanzado..." -ForegroundColor Blue
        node scripts/advanced-import-resolver.js
    }
    "4" {
        Write-Host "`n🔧 Ejecutando corrección completa..." -ForegroundColor Magenta
        Write-Host "⚠️ ADVERTENCIA: Esto modificará archivos. Se crearán backups." -ForegroundColor Red
        $confirm = Read-Host "¿Continuar? (s/n)"
        if ($confirm -eq "s" -or $confirm -eq "S") {
            node scripts/fix-import-conflicts.js
        } else {
            Write-Host "❌ Operación cancelada" -ForegroundColor Red
            exit 0
        }
    }
    default {
        Write-Host "❌ Opción no válida" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🎯 ¿Deseas ejecutar el build para verificar mejoras? (s/n)" -ForegroundColor Yellow
$buildChoice = Read-Host

if ($buildChoice -eq "s" -or $buildChoice -eq "S") {
    Write-Host "`n🏗️ Ejecutando build..." -ForegroundColor Green
    npm run build
    
    Write-Host "`n📊 Verifica el tamaño de los chunks en la salida anterior" -ForegroundColor Cyan
    Write-Host "Deberías ver múltiples archivos más pequeños en lugar de uno grande" -ForegroundColor Gray
}

Write-Host "`n✅ Proceso completado!" -ForegroundColor Green
Write-Host "📝 Se crearon archivos .backup para cualquier archivo modificado" -ForegroundColor Gray
