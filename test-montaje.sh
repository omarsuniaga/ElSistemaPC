#!/bin/bash

# test-montaje.sh - Script para ejecutar tests del módulo Montaje

echo "🎵 Ejecutando Tests del Módulo Montaje 🎵"
echo "========================================"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que existe Node.js y npm
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

# Verificar que existe package.json
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json en el directorio actual"
    exit 1
fi

# Instalar dependencias si es necesario
print_status "Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    print_status "Instalando dependencias..."
    npm install
fi

# Verificar que Vitest está instalado
if ! npm list vitest > /dev/null 2>&1; then
    print_warning "Vitest no está instalado, instalando..."
    npm install --save-dev vitest @vue/test-utils jsdom
fi

# Crear directorio de resultados si no existe
mkdir -p test-results coverage/montaje

print_status "Iniciando ejecución de tests..."

# Función para ejecutar un tipo específico de test
run_test_suite() {
    local test_type=$1
    local test_pattern=$2
    local description=$3
    
    echo ""
    echo "🧪 $description"
    echo "----------------------------------------"
    
    if npx vitest run --config vitest.config.montaje.ts "$test_pattern" --reporter=verbose; then
        print_success "$description completados exitosamente"
        return 0
    else
        print_error "$description fallaron"
        return 1
    fi
}

# Ejecutar diferentes suites de tests
failed_suites=0

# 1. Tests Unitarios del Store
if ! run_test_suite "store" "src/modulos/Montaje/store/*.test.ts" "Tests del Store de Montaje"; then
    ((failed_suites++))
fi

# 2. Tests del Servicio
if ! run_test_suite "service" "src/modulos/Montaje/service/*.test.ts" "Tests del Servicio de Montaje"; then
    ((failed_suites++))
fi

# 3. Tests de Composables
if ! run_test_suite "composables" "src/modulos/Montaje/composables/*.test.ts" "Tests de Composables"; then
    ((failed_suites++))
fi

# 4. Tests de Utilidades
if ! run_test_suite "utils" "src/modulos/Montaje/utils/*.test.ts" "Tests de Utilidades"; then
    ((failed_suites++))
fi

# 5. Tests de Componentes
if ! run_test_suite "components" "src/modulos/Montaje/views/*.test.ts" "Tests de Componentes/Vistas"; then
    ((failed_suites++))
fi

# 6. Tests de Integración
if ! run_test_suite "integration" "src/modulos/Montaje/integration/*.test.ts" "Tests de Integración"; then
    ((failed_suites++))
fi

echo ""
echo "========================================="

# Ejecutar todos los tests con coverage
print_status "Ejecutando todos los tests con reporte de cobertura..."

if npx vitest run --config vitest.config.montaje.ts --coverage; then
    print_success "Todos los tests ejecutados"
    
    # Mostrar resumen de cobertura si existe
    if [ -f "coverage/montaje/index.html" ]; then
        print_status "Reporte de cobertura generado en: coverage/montaje/index.html"
    fi
    
else
    print_error "Algunos tests fallaron"
    ((failed_suites++))
fi

echo ""
echo "📊 RESUMEN FINAL"
echo "================"

if [ $failed_suites -eq 0 ]; then
    print_success "✅ Todos los tests del módulo Montaje pasaron correctamente"
    print_status "📈 Reporte de cobertura: coverage/montaje/index.html"
    print_status "📄 Resultados JUnit: test-results/montaje-results.xml"
    echo ""
    echo "🎉 El módulo Montaje está listo para producción!"
    exit 0
else
    print_error "❌ $failed_suites suite(s) de tests fallaron"
    print_warning "Por favor revisa los errores arriba y corrige los problemas"
    echo ""
    echo "🔧 Ejecuta tests individuales para debug:"
    echo "   npx vitest run --config vitest.config.montaje.ts src/modulos/Montaje/store/montaje.test.ts"
    echo "   npx vitest run --config vitest.config.montaje.ts src/modulos/Montaje/service/montajeService.test.ts"
    echo "   # etc..."
    exit 1
fi
