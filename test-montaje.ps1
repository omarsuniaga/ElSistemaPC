# test-montaje.ps1 - Script PowerShell para ejecutar tests del módulo Montaje

Write-Host "🎵 Ejecutando Tests del Módulo Montaje 🎵" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

function Write-Status($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Verificar que existe Node.js y npm
try {
    $nodeVersion = node --version
    Write-Status "Node.js versión: $nodeVersion"
} catch {
    Write-Error "Node.js no está instalado"
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Status "npm versión: $npmVersion"
} catch {
    Write-Error "npm no está instalado"
    exit 1
}

# Verificar que existe package.json
if (-not (Test-Path "package.json")) {
    Write-Error "No se encontró package.json en el directorio actual"
    exit 1
}

# Verificar e instalar dependencias
Write-Status "Verificando dependencias..."
if (-not (Test-Path "node_modules")) {
    Write-Status "Instalando dependencias..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error instalando dependencias"
        exit 1
    }
}

# Verificar que Vitest está instalado
npm list vitest 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Vitest no está instalado, instalando..."
    npm install --save-dev vitest @vue/test-utils jsdom @vitejs/plugin-vue
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error instalando Vitest"
        exit 1
    }
}

# Crear directorios de resultados
New-Item -ItemType Directory -Force -Path "test-results" | Out-Null
New-Item -ItemType Directory -Force -Path "coverage\montaje" | Out-Null

Write-Status "Iniciando ejecución de tests..."

# Función para ejecutar un tipo específico de test
function Invoke-TestSuite($testType, $testPattern, $description) {
    Write-Host ""
    Write-Host "🧪 $description" -ForegroundColor Magenta
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    & npx vitest run --config vitest.config.montaje.ts $testPattern --reporter=verbose | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "$description completados exitosamente"
        return $true
    } else {
        Write-Error "$description fallaron"
        return $false
    }
}

# Ejecutar diferentes suites de tests
$failedSuites = 0

# 1. Tests Unitarios del Store
if (-not (Invoke-TestSuite "store" "src/modulos/Montaje/store/*.test.ts" "Tests del Store de Montaje")) {
    $failedSuites++
}

# 2. Tests del Servicio
if (-not (Invoke-TestSuite "service" "src/modulos/Montaje/service/*.test.ts" "Tests del Servicio de Montaje")) {
    $failedSuites++
}

# 3. Tests de Composables
if (-not (Invoke-TestSuite "composables" "src/modulos/Montaje/composables/*.test.ts" "Tests de Composables")) {
    $failedSuites++
}

# 4. Tests de Utilidades
if (-not (Invoke-TestSuite "utils" "src/modulos/Montaje/utils/*.test.ts" "Tests de Utilidades")) {
    $failedSuites++
}

# 5. Tests de Componentes
if (-not (Invoke-TestSuite "components" "src/modulos/Montaje/views/*.test.ts" "Tests de Componentes/Vistas")) {
    $failedSuites++
}

# 6. Tests de Integración
if (-not (Invoke-TestSuite "integration" "src/modulos/Montaje/integration/*.test.ts" "Tests de Integración")) {
    $failedSuites++
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan

# Ejecutar todos los tests con coverage
Write-Status "Ejecutando todos los tests con reporte de cobertura..."

& npx vitest run --config vitest.config.montaje.ts --coverage

if ($LASTEXITCODE -eq 0) {
    Write-Success "Todos los tests ejecutados"
    
    # Mostrar resumen de cobertura si existe
    if (Test-Path "coverage\montaje\index.html") {
        Write-Status "Reporte de cobertura generado en: coverage\montaje\index.html"
    }
} else {
    Write-Error "Algunos tests fallaron"
    $failedSuites++
}

Write-Host ""
Write-Host "📊 RESUMEN FINAL" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan

if ($failedSuites -eq 0) {
    Write-Success "✅ Todos los tests del módulo Montaje pasaron correctamente"
    Write-Status "📈 Reporte de cobertura: coverage\montaje\index.html"
    Write-Status "📄 Resultados JUnit: test-results\montaje-results.xml"
    Write-Host ""
    Write-Host "🎉 El módulo Montaje está listo para producción!" -ForegroundColor Green
    
    # Abrir reporte de cobertura si existe
    if (Test-Path "coverage\montaje\index.html") {
        Write-Host "¿Deseas abrir el reporte de cobertura? (s/n): " -NoNewline
        $response = Read-Host
        if ($response -eq "s" -or $response -eq "S") {
            Start-Process "coverage\montaje\index.html"
        }
    }
    
    exit 0
} else {
    Write-Error "❌ $failedSuites suite(s) de tests fallaron"
    Write-Warning "Por favor revisa los errores arriba y corrige los problemas"
    Write-Host ""
    Write-Host "🔧 Ejecuta tests individuales para debug:" -ForegroundColor Yellow
    Write-Host "   npx vitest run --config vitest.config.montaje.ts src/modulos/Montaje/store/montaje.test.ts" -ForegroundColor Gray
    Write-Host "   npx vitest run --config vitest.config.montaje.ts src/modulos/Montaje/service/montajeService.test.ts" -ForegroundColor Gray
    Write-Host "   # etc..." -ForegroundColor Gray
    exit 1
}
