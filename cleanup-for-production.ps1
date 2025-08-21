# 🧹 LIMPIEZA PARA PRODUCCIÓN - Script PowerShell
# Este script mueve archivos de desarrollo/testing a una carpeta separada

Write-Host "🏭 PREPARANDO PROYECTO PARA PRODUCCIÓN" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Yellow

# Crear carpeta de desarrollo si no existe
$devFolder = "dev-files"
if (!(Test-Path $devFolder)) {
    New-Item -ItemType Directory -Path $devFolder
    Write-Host "✅ Creada carpeta: $devFolder" -ForegroundColor Green
}

# Crear subcarpetas
$subFolders = @("tests", "debug", "sample-data", "docs")
foreach ($folder in $subFolders) {
    $path = Join-Path $devFolder $folder
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path
        Write-Host "✅ Creada carpeta: $path" -ForegroundColor Green
    }
}

# Archivos de testing a mover
$testFiles = @(
    "test-*.js",
    "test-*.html",
    "debug-*.js",
    "debug-*.html",
    "*test*.js",
    "*debug*.js",
    "*sample*.js",
    "analyze-*.js",
    "check-*.js",
    "diagnose-*.js",
    "evaluate-*.js",
    "generate-*.js",
    "migrate-*.js",
    "monitor-*.js",
    "verify-*.js",
    "quick-*.js",
    "simple-*.js",
    "create-sample-*.js",
    "demo-*.html",
    "whatsapp-test.html",
    "firebase-diagnostic.js",
    "test-firebase-connection.js"
)

$moveCount = 0

foreach ($pattern in $testFiles) {
    $files = Get-ChildItem -Path . -Name $pattern -File
    foreach ($file in $files) {
        if (Test-Path $file) {
            $destination = Join-Path $devFolder "tests" $file
            Move-Item -Path $file -Destination $destination -Force
            Write-Host "📦 Movido: $file → dev-files/tests/" -ForegroundColor Cyan
            $moveCount++
        }
    }
}

# Archivos de documentación específicos a mover
$docFiles = @(
    "*.md",
    "attendance_module_documentation.html",
    "performance-*.html",
    "security-test.html"
)

foreach ($pattern in $docFiles) {
    $files = Get-ChildItem -Path . -Name $pattern -File
    foreach ($file in $files) {
        # Mantener README.md en el root
        if ($file -ne "README.md") {
            if (Test-Path $file) {
                $destination = Join-Path $devFolder "docs" $file
                Move-Item -Path $file -Destination $destination -Force
                Write-Host "📚 Movido: $file → dev-files/docs/" -ForegroundColor Magenta
                $moveCount++
            }
        }
    }
}

Write-Host ""
Write-Host "🎉 LIMPIEZA COMPLETADA!" -ForegroundColor Green
Write-Host "📊 Total de archivos movidos: $moveCount" -ForegroundColor Yellow
Write-Host "📁 Los archivos están en: ./dev-files/" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ El proyecto está listo para producción!" -ForegroundColor Green
