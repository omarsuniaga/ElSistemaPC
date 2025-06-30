# Script para organizar archivos de documentación y pruebas

Write-Host "Organizando archivos de documentación y pruebas..." -ForegroundColor Green

# Mover archivos .md a docs/
Write-Host "Moviendo archivos .md a docs/" -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "*.md" -File | ForEach-Object {
    Move-Item $_.FullName -Destination "docs\" -Force
    Write-Host "Movido: $($_.Name)" -ForegroundColor Gray
}

# Mover archivos de prueba a tests/
Write-Host "Moviendo archivos de prueba a tests/" -ForegroundColor Yellow

# Archivos JavaScript de prueba
$testPatterns = @(
    "test-*.js",
    "test-*.mjs", 
    "test-*.ps1",
    "test-*.sh",
    "debug-*.js",
    "verify-*.js",
    "generate-*.js",
    "migrate-*.js",
    "*sample*.js",
    "analyze-*.js",
    "check-*.js",
    "monitor-*.js",
    "simple-*.js",
    "quick-*.js",
    "final-*.js",
    "firebase-observation-*.js",
    "RESUMEN_*.js",
    "SISTEMA_*.js",
    "next-steps.js",
    "evaluate-*.js"
)

foreach ($pattern in $testPatterns) {
    Get-ChildItem -Path "." -Filter $pattern -File | ForEach-Object {
        if (Test-Path $_.FullName) {
            Move-Item $_.FullName -Destination "tests\" -Force
            Write-Host "Movido: $($_.Name)" -ForegroundColor Gray
        }
    }
}

# Archivos HTML de prueba y demo
$htmlPatterns = @(
    "test-*.html",
    "demo-*.html",
    "debug-*.html"
)

foreach ($pattern in $htmlPatterns) {
    Get-ChildItem -Path "." -Filter $pattern -File | ForEach-Object {
        if (Test-Path $_.FullName) {
            Move-Item $_.FullName -Destination "tests\" -Force
            Write-Host "Movido: $($_.Name)" -ForegroundColor Gray
        }
    }
}

# Mover archivos de log de debug
Get-ChildItem -Path "." -Filter "*debug*.log" -File | ForEach-Object {
    Move-Item $_.FullName -Destination "tests\" -Force
    Write-Host "Movido: $($_.Name)" -ForegroundColor Gray
}

# Mover test-results.txt
if (Test-Path "test-results.txt") {
    Move-Item "test-results.txt" -Destination "tests\" -Force
    Write-Host "Movido: test-results.txt" -ForegroundColor Gray
}

# Mover migration-config.json
if (Test-Path "migration-config.json") {
    Move-Item "migration-config.json" -Destination "tests\" -Force
    Write-Host "Movido: migration-config.json" -ForegroundColor Gray
}

# Mover install-migration-deps.sh
if (Test-Path "install-migration-deps.sh") {
    Move-Item "install-migration-deps.sh" -Destination "tests\" -Force
    Write-Host "Movido: install-migration-deps.sh" -ForegroundColor Gray
}

Write-Host "Organización completada!" -ForegroundColor Green
