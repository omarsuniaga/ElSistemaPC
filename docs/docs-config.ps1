# Configuración para documentación automática
# Este archivo establece las rutas donde se guardará nueva documentación

# Configuración de rutas de documentación
$DOCS_CONFIG = @{
    ROOT = "docs"
    SISTEMAS = "docs/sistemas"
    IMPLEMENTACIONES = "docs/implementaciones" 
    MODULOS = "docs/modulos"
    CORRECCIONES = "docs/correcciones"
    OPTIMIZACIONES = "docs/optimizaciones"
    TESTING = "docs/testing"
}

# Función para determinar la carpeta correcta según el tipo de documento
function Get-DocsPath {
    param(
        [string]$DocumentType,
        [string]$FileName
    )
    
    switch ($DocumentType.ToLower()) {
        "sistema" { return $DOCS_CONFIG.SISTEMAS }
        "implementacion" { return $DOCS_CONFIG.IMPLEMENTACIONES }
        "modulo" { return $DOCS_CONFIG.MODULOS }
        "correccion" { return $DOCS_CONFIG.CORRECCIONES }
        "optimizacion" { return $DOCS_CONFIG.OPTIMIZACIONES }
        "testing" { return $DOCS_CONFIG.TESTING }
        default { 
            # Auto-detectar por nombre de archivo
            if ($FileName -match "(SISTEMA|RBAC)") { return $DOCS_CONFIG.SISTEMAS }
            if ($FileName -match "(IMPLEMENTACION|COMPLETADO)") { return $DOCS_CONFIG.IMPLEMENTACIONES }
            if ($FileName -match "(MODULO|MODULE)") { return $DOCS_CONFIG.MODULOS }
            if ($FileName -match "(CORRECCION|FIX|ERROR)") { return $DOCS_CONFIG.CORRECCIONES }
            if ($FileName -match "(OPTIMIZACION|OPTIMIZATION)") { return $DOCS_CONFIG.OPTIMIZACIONES }
            if ($FileName -match "(TEST|TESTING|GUIDE)") { return $DOCS_CONFIG.TESTING }
            return $DOCS_CONFIG.ROOT
        }
    }
}

# Función para crear documentación nueva
function New-Documentation {
    param(
        [string]$Title,
        [string]$Type,
        [string]$Content
    )
    
    $fileName = "$Title.md"
    $targetPath = Get-DocsPath -DocumentType $Type -FileName $fileName
    $fullPath = Join-Path $targetPath $fileName
    
    # Crear directorio si no existe
    if (!(Test-Path $targetPath)) {
        New-Item -Path $targetPath -ItemType Directory -Force
    }
    
    # Crear archivo con contenido
    $Content | Out-File -FilePath $fullPath -Encoding UTF8
    
    Write-Host "✅ Documentación creada: $fullPath"
    return $fullPath
}

# Exportar configuración para uso global
$global:DOCS_CONFIG = $DOCS_CONFIG

Write-Host "📚 Configuración de documentación cargada"
Write-Host "🎯 Rutas configuradas:"
foreach ($key in $DOCS_CONFIG.Keys) {
    Write-Host "   $key -> $($DOCS_CONFIG[$key])"
}
