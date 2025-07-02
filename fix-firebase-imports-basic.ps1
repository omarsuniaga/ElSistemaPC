# Script para Corregir Importaciones Dinamicas de Firebase

Write-Host "Iniciando correccion de importaciones dinamicas de Firebase..." -ForegroundColor Cyan

$totalFiles = 0
$modifiedFiles = 0
$totalReplacements = 0

function ProcessFile {
    param([string]$filePath)
    
    $script:totalFiles++
    $fileName = Split-Path $filePath -Leaf
    Write-Host "Procesando: $fileName" -ForegroundColor Gray
    
    try {
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        if (-not $content) {
            return
        }
        
        $originalContent = $content
        $fileModified = $false
        $replacements = 0
        
        # Casos especificos que conocemos
        $replacements1 = @{
            'const {updateDoc, doc} = await import("firebase/firestore")' = ''
            'const {getDocs, collection} = await import("firebase/firestore")' = ''
            'const {collection, doc, setDoc} = await import("firebase/firestore")' = ''
            'const {db} = await import("@/firebase")' = ''
            '    // Importar Firebase' = ''
            '// Importar Firebase' = ''
        }
        
        foreach ($search in $replacements1.Keys) {
            if ($content.Contains($search)) {
                $content = $content.Replace($search, $replacements1[$search])
                $replacements++
                $fileModified = $true
                Write-Host "  Removida linea de importacion dinamica" -ForegroundColor Green
            }
        }
        
        # Verificar que importaciones necesitamos agregar
        $needsFirestoreImports = $false
        $importsToAdd = @()
        
        if ($content.Contains('updateDoc') -or $content.Contains(' doc(')) {
            $importsToAdd += @('updateDoc', 'doc')
            $needsFirestoreImports = $true
        }
        if ($content.Contains('getDocs') -or $content.Contains('collection(')) {
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
            
            # Verificar si ya existe una importacion de firebase/firestore
            $hasFirestoreImport = $content.Contains('firebase/firestore')
            
            if (-not $hasFirestoreImport) {
                $newImport = "import {$($uniqueImports -join ', ')} from `"firebase/firestore`""
                
                if ($isVueFile) {
                    # Para archivos .vue
                    $scriptSetupPattern = '<script setup lang="ts">'
                    if ($content.Contains($scriptSetupPattern)) {
                        $content = $content.Replace($scriptSetupPattern, "$scriptSetupPattern`n$newImport")
                        $fileModified = $true
                        Write-Host "  Agregada importacion estatica en archivo .vue" -ForegroundColor Cyan
                    }
                } else {
                    # Para archivos .ts, agregar despues de imports existentes
                    if ($content.Contains('import ')) {
                        # Buscar la primera linea que no sea import
                        $lines = $content -split "`n"
                        $insertIndex = 0
                        for ($i = 0; $i -lt $lines.Length; $i++) {
                            if ($lines[$i] -notmatch '^import ' -and $lines[$i].Trim() -ne '') {
                                $insertIndex = $i
                                break
                            }
                        }
                        
                        if ($insertIndex -gt 0) {
                            $lines = $lines[0..($insertIndex-1)] + $newImport + $lines[$insertIndex..($lines.Length-1)]
                            $content = $lines -join "`n"
                            $fileModified = $true
                            Write-Host "  Agregada importacion estatica en archivo .ts" -ForegroundColor Cyan
                        }
                    }
                }
            }
        }
        
        # Limpiar lineas vacias excesivas
        $content = $content -replace "`n`n`n+", "`n`n"
        
        # Guardar cambios
        if ($fileModified -and $content -ne $originalContent) {
            Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
            $script:modifiedFiles++
            $script:totalReplacements += $replacements
            Write-Host "  Archivo modificado: $replacements cambios" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Obtener archivos
Write-Host "Buscando archivos..." -ForegroundColor Yellow

$files = Get-ChildItem -Path . -Recurse -Include "*.vue", "*.ts" | 
    Where-Object { 
        $_.FullName -notlike "*node_modules*" -and 
        $_.FullName -notlike "*dist*" -and 
        $_.FullName -notlike "*build*" -and
        $_.FullName -notlike "*.d.ts"
    }

Write-Host "Encontrados $($files.Count) archivos para procesar" -ForegroundColor Cyan

# Procesar archivos
foreach ($file in $files) {
    ProcessFile -filePath $file.FullName
}

# Estadisticas finales
Write-Host ""
Write-Host "RESUMEN FINAL:" -ForegroundColor Cyan
Write-Host "Archivos procesados: $totalFiles" -ForegroundColor White
Write-Host "Archivos modificados: $modifiedFiles" -ForegroundColor Green  
Write-Host "Total de reemplazos: $totalReplacements" -ForegroundColor Yellow

if ($modifiedFiles -gt 0) {
    Write-Host ""
    Write-Host "Correccion completada exitosamente!" -ForegroundColor Green
    Write-Host "Ahora el build de Netlify deberia funcionar sin advertencias." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "No se encontraron importaciones dinamicas para corregir." -ForegroundColor Blue
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
