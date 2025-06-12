# Script para organizar documentación en carpeta docs
# Ejecutar desde la raíz del proyecto

# Crear estructura de carpetas si no existen
if (!(Test-Path "docs/implementaciones")) { New-Item -Path "docs/implementaciones" -ItemType Directory -Force }
if (!(Test-Path "docs/correcciones")) { New-Item -Path "docs/correcciones" -ItemType Directory -Force }
if (!(Test-Path "docs/sistemas")) { New-Item -Path "docs/sistemas" -ItemType Directory -Force }
if (!(Test-Path "docs/testing")) { New-Item -Path "docs/testing" -ItemType Directory -Force }
if (!(Test-Path "docs/modulos")) { New-Item -Path "docs/modulos" -ItemType Directory -Force }
if (!(Test-Path "docs/optimizaciones")) { New-Item -Path "docs/optimizaciones" -ItemType Directory -Force }

# Documentos de implementaciones
$implementaciones = @(
    "IMPLEMENTACION_MODAL_JUSTIFICACION_COMPLETADA.md",
    "PERMISOS_IMPLEMENTACION_COMPLETA.md",
    "INDICADORES_ASISTENCIA_IMPLEMENTADOS.md",
    "VALIDACION_ESTUDIANTES_IMPLEMENTADO.md",
    "VALIDACION_HORARIOS_IMPLEMENTADO.md",
    "VALIDACION_HORARIOS_IMPLEMENTADA.md",
    "EXPORTACION_PDF_COMPLETADO.md",
    "AVATARES_INICIALES_IMPLEMENTACION.md",
    "COLABORACION_MAESTROS_COMPLETADO.md",
    "ASISTENCIA_OBSERVACIONES_OPTIMIZADO.md",
    "FINAL_IMPLEMENTATION_SUMMARY.md"
)

foreach ($file in $implementaciones) {
    if (Test-Path $file) {
        Move-Item $file "docs/implementaciones/" -Force
        Write-Host "Movido: $file -> docs/implementaciones/"
    }
}

# Documentos de sistemas
$sistemas = @(
    "SISTEMA_EVALUACION_INTEGRAL.md",
    "RBAC_IMPLEMENTATION_STATUS.md",
    "RBAC_ATTENDANCE_FIX.md"
)

foreach ($file in $sistemas) {
    if (Test-Path $file) {
        Move-Item $file "docs/sistemas/" -Force
        Write-Host "Movido: $file -> docs/sistemas/"
    }
}

# Documentos de módulos
$modulos = @(
    "MODULO_MONTAJE_COMPLETADO.md",
    "MODULO_MONTAJE_FINALIZADO.md",
    "MODULO_MONTAJE_FINALIZACION_COMPLETA.md",
    "MONTAJE_DARK_MODE_IMPLEMENTATION.md",
    "MONTAJE_VIEW_DARK_MODE_IMPLEMENTATION.md",
    "CLASS_DETAIL_MODERNIZATION_SUMMARY.md",
    "REVISION_MODULO_ATTENDANCE_COMPLETADA.md",
    "ATTENDANCE_IMPROVEMENTS.md",
    "ATTENDANCE_SERVICE_IMPROVEMENTS.md"
)

foreach ($file in $modulos) {
    if (Test-Path $file) {
        Move-Item $file "docs/modulos/" -Force
        Write-Host "Movido: $file -> docs/modulos/"
    }
}

# Documentos de optimizaciones
$optimizaciones = @(
    "OPTIMIZACION_COMPLETADA.md",
    "OPTIMIZACION_FINALIZADA.md",
    "OPTIMIZACION_VALIDACION.md",
    "OPTIMIZACION_ASISTENCIAS_COMPLETA.md",
    "OPTIMIZATION_SUMMARY.md"
)

foreach ($file in $optimizaciones) {
    if (Test-Path $file) {
        Move-Item $file "docs/optimizaciones/" -Force
        Write-Host "Movido: $file -> docs/optimizaciones/"
    }
}

# Documentos de correcciones
$correcciones = @(
    "CORRECCION_ERRORES_COMPLETADA.md",
    "SUPERUSUARIO_DASHBOARD_FIX.md",
    "FOOTER_NAVIGATION_SUPERUSUARIO.md",
    "FIRESTORE_INDEX_FIXES.md",
    "FIRESTORE_INDEXES.md"
)

foreach ($file in $correcciones) {
    if (Test-Path $file) {
        Move-Item $file "docs/correcciones/" -Force
        Write-Host "Movido: $file -> docs/correcciones/"
    }
}

# Resúmenes y documentos principales
$principales = @(
    "PROYECTO_COMPLETADO.md",
    "RESUMEN_IMPLEMENTACION_ESPAÑOL.md",
    "RutaProcesamientoDatos.md",
    "ANALISIS_PERSPECTIVA_ESTUDIANTE_COMPLETADO.md"
)

foreach ($file in $principales) {
    if (Test-Path $file) {
        Move-Item $file "docs/" -Force
        Write-Host "Movido: $file -> docs/"
    }
}

Write-Host "¡Documentación organizada exitosamente!"
