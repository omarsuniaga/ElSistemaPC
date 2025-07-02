# Script Simple para Corregir Importaciones Dinámicas de Firebase
# Versión simplificada que funciona correctamente

Write-Host "🔧 Iniciando corrección de importaciones dinámicas de Firebase..." -ForegroundColor Cyan

$totalFiles = 0
$modifiedFiles = 0
$totalReplacements = 0

function Process-File {
    param([string]$filePath)
    
    $script:totalFiles++
    $fileName = Split-Path $filePath -Leaf
    Write-Host "📄 Procesando: $fileName" -ForegroundColor Gray
    
    try {
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        if (-not $content) {
            return
        }
        
        $originalContent = $content
        $fileModified = $false
        $replacements = 0
        
        # Patrones simples para buscar importaciones dinámicas
        $patterns = @(
            'const\s*\{\s*updateDoc,\s*doc\s*\}\s*=\s*await\s+import\s*\(\s*"firebase/firestore"\s*\)',
            'const\s*\{\s*getDocs,\s*collection\s*\}\s*=\s*await\s+import\s*\(\s*"firebase/firestore"\s*\)',
            'const\s*\{\s*collection,\s*doc,\s*setDoc\s*\}\s*=\s*await\s+import\s*\(\s*"firebase/firestore"\s*\)',
            'const\s*\{\s*db\s*\}\s*=\s*await\s+import\s*\(\s*"@/firebase"\s*\)',
            '//\s*Importar\s+Firebase',
            '//\s*Import.*Firebase'
        )
        
        # Buscar y remover patrones
        foreach ($pattern in $patterns) {
            $matches = [regex]::Matches($content, $pattern)
            if ($matches.Count -gt 0) {
                $content = $content -replace $pattern, ''
                $replacements += $matches.Count
                $fileModified = $true
                Write-Host "  ✅ Removido patrón: $($matches.Count) ocurrencias" -ForegroundColor Green
            }
        }
        
        # Casos específicos más complejos
        # 1. Remover líneas específicas de importación dinámica
        $linesToRemove = @(
            'const {updateDoc, doc} = await import("firebase/firestore")',
            'const {getDocs, collection} = await import("firebase/firestore")',
            'const {collection, doc, setDoc} = await import("firebase/firestore")',
            'const {db} = await import("@/firebase")',
            '// Importar Firebase',
            '    // Importar Firebase'
        )
        
        foreach ($line in $linesToRemove) {
            if ($content.Contains($line)) {
                $content = $content.Replace($line, '')
                $replacements++
                $fileModified = $true
                Write-Host "  ✅ Removida línea específica" -ForegroundColor Green
            }
        }
        
        # Agregar importaciones si es necesario
        $needsFirestoreImports = $false
        $importsToAdd = @()
        
        # Verificar qué importaciones necesitamos
        if ($content.Contains('updateDoc') -or $content.Contains('doc')) {
            $importsToAdd += @('updateDoc', 'doc')
            $needsFirestoreImports = $true
        }
        if ($content.Contains('getDocs') -or $content.Contains('collection')) {
            $importsToAdd += @('getDocs', 'collection')  
            $needsFirestoreImports = $true
        }
        if ($content.Contains('setDoc')) {
            $importsToAdd += 'setDoc'
            $needsFirestoreImports = $true
        }
        
        # Agregar importaciones si es necesario
        if ($needsFirestoreImports) {
            $uniqueImports = $importsToAdd | Sort-Object | Get-Unique
            $isVueFile = $filePath -like "*.vue"
            
            # Verificar si ya existe una importación de firebase/firestore
            $hasFirestoreImport = $content -match 'import.*firebase/firestore'
            
            if (-not $hasFirestoreImport) {
                $newImport = "import {$($uniqueImports -join ', ')} from `"firebase/firestore`""
                
                if ($isVueFile) {
                    # Para archivos .vue, agregar después de <script setup>
                    if ($content -match '(<script setup[^>]*>)') {
                        $scriptTag = $matches[1]
                        $content = $content.Replace($scriptTag, "$scriptTag`n$newImport")
                        $fileModified = $true
                        Write-Host "  ✅ Agregada importación estática en .vue" -ForegroundColor Cyan
                    }
                } else {
                    # Para archivos .ts, agregar al inicio
                    if ($content -match '^(import.*\n)*') {
                        $content = "$newImport`n$content"
                        $fileModified = $true
                        Write-Host "  ✅ Agregada importación estática en .ts" -ForegroundColor Cyan
                    }
                }
            }
        }
        
        # Limpiar líneas vacías excesivas
        $content = $content -replace '\n\s*\n\s*\n+', "`n`n"
        
        # Guardar cambios
        if ($fileModified -and $content -ne $originalContent) {
            Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
            $script:modifiedFiles++
            $script:totalReplacements += $replacements
            Write-Host "  💾 Archivo modificado: $replacements cambios" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Obtener archivos
Write-Host "🔍 Buscando archivos..." -ForegroundColor Yellow

$files = Get-ChildItem -Path . -Recurse -Include "*.vue", "*.ts", "*.js" | 
    Where-Object { 
        $_.FullName -notlike "*node_modules*" -and 
        $_.FullName -notlike "*dist*" -and 
        $_.FullName -notlike "*build*" -and
        $_.FullName -notlike "*.d.ts"
    }

Write-Host "📊 Encontrados $($files.Count) archivos para procesar" -ForegroundColor Cyan

# Procesar archivos
foreach ($file in $files) {
    Process-File -filePath $file.FullName
}

# Estadísticas finales
Write-Host "`n📊 RESUMEN FINAL:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📁 Archivos procesados: $totalFiles" -ForegroundColor White
Write-Host "✅ Archivos modificados: $modifiedFiles" -ForegroundColor Green  
Write-Host "🔄 Total de reemplazos: $totalReplacements" -ForegroundColor Yellow

if ($modifiedFiles -gt 0) {
    Write-Host "`n🎉 ¡Corrección completada exitosamente!" -ForegroundColor Green
    Write-Host "🚀 Ahora el build de Netlify debería funcionar sin advertencias." -ForegroundColor Cyan
} else {
    Write-Host "`nℹ️  No se encontraron importaciones dinámicas para corregir." -ForegroundColor Blue
}

Write-Host "`nPresiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
