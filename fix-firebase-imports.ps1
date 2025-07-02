# Script para corregir importaciones dinámicas de Firebase
# Convierte importaciones dinámicas a estáticas para evitar advertencias de Vite

Write-Host "🔧 Iniciando corrección de importaciones dinámicas de Firebase..." -ForegroundColor Cyan

# Contadores para estadísticas
$totalFiles = 0
$modifiedFiles = 0
$totalReplacements = 0

# Función para agregar importaciones a la sección de imports
function Add-FirebaseImports {
    param(
        [string]$content,
        [string[]]$importsToAdd,
        [string]$filePath
    )
    
    # Detectar si es archivo .vue o .ts
    $isVueFile = $filePath -like "*.vue"
    
    if ($isVueFile) {
        # Para archivos .vue, buscar la sección <script setup>
        if ($content -match '(<script setup[^>]*>\s*)([\s\S]*?)') {
            $scriptStart = $matches[1]
            $scriptContent = $matches[2]
            
            # Buscar imports existentes de firebase/firestore
            if ($scriptContent -match 'import\s*\{([^}]+)\}\s*from\s*["\']firebase/firestore["\']') {
                # Ya existe una importación, agregar a la existente
                $existingImports = $matches[1].Trim()
                $newImports = ($existingImports + ", " + ($importsToAdd -join ", "))
                $updatedImport = "import {$newImports} from `"firebase/firestore`""
                $content = $content -replace 'import\s*\{[^}]+\}\s*from\s*["\']firebase/firestore["\']', $updatedImport
            } else {
                # No existe, agregar nueva importación después de otros imports
                $newImport = "import {$($importsToAdd -join ", ")} from `"firebase/firestore`""
                
                # Buscar el último import en el script
                $importMatches = [regex]::Matches($scriptContent, 'import\s+.*?from\s+["\'][^"\']+["\']')
                if ($importMatches.Count -gt 0) {
                    $lastImport = $importMatches[$importMatches.Count - 1]
                    $insertPos = $lastImport.Index + $lastImport.Length
                    $beforeInsert = $scriptContent.Substring(0, $insertPos)
                    $afterInsert = $scriptContent.Substring($insertPos)
                    $scriptContent = $beforeInsert + "`n" + $newImport + $afterInsert
                    $content = $content -replace '(<script setup[^>]*>\s*)([\s\S]*?)', ($scriptStart + $scriptContent)
                }
            }
        }
    } else {
        # Para archivos .ts, buscar imports existentes
        if ($content -match 'import\s*\{([^}]+)\}\s*from\s*["\']firebase/firestore["\']') {
            # Ya existe una importación, agregar a la existente
            $existingImports = $matches[1].Trim()
            $newImports = ($existingImports + ", " + ($importsToAdd -join ", "))
            $updatedImport = "import {$newImports} from `"firebase/firestore`""
            $content = $content -replace 'import\s*\{[^}]+\}\s*from\s*["\']firebase/firestore["\']', $updatedImport
        } else {
            # No existe, agregar nueva importación después de otros imports
            $newImport = "import {$($importsToAdd -join ", ")} from `"firebase/firestore`""
            
            # Buscar el último import
            $importMatches = [regex]::Matches($content, 'import\s+.*?from\s+["\'][^"\']+["\']')
            if ($importMatches.Count -gt 0) {
                $lastImport = $importMatches[$importMatches.Count - 1]
                $insertPos = $lastImport.Index + $lastImport.Length
                $beforeInsert = $content.Substring(0, $insertPos)
                $afterInsert = $content.Substring($insertPos)
                $content = $beforeInsert + "`n" + $newImport + $afterInsert
            }
        }
    }
    
    return $content
}

# Función para procesar un archivo
function Process-File {
    param([string]$filePath)
    
    $script:totalFiles++
    Write-Host "📄 Procesando: $($filePath -replace [regex]::Escape($PSScriptRoot), '.')" -ForegroundColor Gray
    
    try {
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        $originalContent = $content
        $fileModified = $false
        $replacements = 0
        
        # Lista de importaciones dinámicas comunes de Firebase
        $dynamicImportPatterns = @{
            'const\s*\{\s*([^}]+)\s*\}\s*=\s*await\s+import\s*\(\s*["\']firebase/firestore["\']\s*\)' = '$1'
            'const\s*\{\s*([^}]+)\s*\}\s*=\s*await\s+import\s*\(\s*["\']@firebase/firestore["\']\s*\)' = '$1'
            'import\s*\(\s*["\']firebase/firestore["\']\s*\)\.then\s*\(\s*\{\s*([^}]+)\s*\}\s*=>\s*' = '$1'
        }
        
        # Coleccionar todas las importaciones que necesitamos agregar
        $importsToAdd = @()
        
        # Buscar y reemplazar importaciones dinámicas
        foreach ($pattern in $dynamicImportPatterns.Keys) {
            $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
            
            foreach ($match in $matches) {
                $importsList = $match.Groups[1].Value
                # Extraer nombres de las importaciones
                $imports = $importsList -split ',' | ForEach-Object { $_.Trim() }
                $importsToAdd += $imports
                
                # Remover la línea de importación dinámica
                $content = $content -replace [regex]::Escape($match.Value), ''
                $replacements++
                $fileModified = $true
                
                Write-Host "  ✅ Removida importación dinámica: $($imports -join ', ')" -ForegroundColor Green
            }
        }
        
        # Patrones específicos para remover líneas completas
        $linesToRemove = @(
            '^\s*//\s*Importar\s+Firebase\s*$',
            '^\s*const\s*\{\s*db\s*\}\s*=\s*await\s+import\s*\(\s*["\']@?/?firebase["\']?\s*\)\s*$'
        )
        
        foreach ($linePattern in $linesToRemove) {
            $lineMatches = [regex]::Matches($content, $linePattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
            if ($lineMatches.Count -gt 0) {
                $content = $content -replace $linePattern, ''
                $replacements += $lineMatches.Count
                $fileModified = $true
                Write-Host "  ✅ Removidas $($lineMatches.Count) líneas de comentario/importación" -ForegroundColor Green
            }
        }
        
        # Si encontramos importaciones para agregar
        if ($importsToAdd.Count -gt 0) {
            $uniqueImports = $importsToAdd | Sort-Object | Get-Unique
            $content = Add-FirebaseImports -content $content -importsToAdd $uniqueImports -filePath $filePath
            Write-Host "  ✅ Agregadas importaciones estáticas: $($uniqueImports -join ', ')" -ForegroundColor Green
        }
        
        # Limpiar líneas vacías excesivas
        $content = $content -replace '\n\s*\n\s*\n', "`n`n"
        
        # Guardar solo si hay cambios
        if ($fileModified -and $content -ne $originalContent) {
            Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
            $script:modifiedFiles++
            $script:totalReplacements += $replacements
            Write-Host "  💾 Archivo modificado: $replacements reemplazos" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "  ❌ Error procesando archivo: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Obtener todos los archivos .vue y .ts del proyecto
$files = Get-ChildItem -Path . -Recurse -Include "*.vue", "*.ts", "*.js" | 
    Where-Object { 
        $_.FullName -notlike "*node_modules*" -and 
        $_.FullName -notlike "*dist*" -and 
        $_.FullName -notlike "*build*" -and
        $_.FullName -notlike "*.d.ts"
    }

Write-Host "🔍 Encontrados $($files.Count) archivos para procesar..." -ForegroundColor Yellow

# Procesar cada archivo
foreach ($file in $files) {
    Process-File -filePath $file.FullName
}

# Mostrar estadísticas finales
Write-Host "`n📊 RESUMEN DE CORRECCIONES:" -ForegroundColor Cyan
Write-Host "📁 Total de archivos procesados: $totalFiles" -ForegroundColor White
Write-Host "✏️  Archivos modificados: $modifiedFiles" -ForegroundColor Green
Write-Host "🔄 Total de reemplazos: $totalReplacements" -ForegroundColor Yellow

if ($modifiedFiles -gt 0) {
    Write-Host "`n✅ ¡Corrección completada! Los archivos han sido actualizados." -ForegroundColor Green
    Write-Host "🚀 Ahora puedes hacer commit de los cambios y el build de Netlify debería funcionar sin advertencias." -ForegroundColor Cyan
} else {
    Write-Host "`nℹ️  No se encontraron importaciones dinámicas de Firebase para corregir." -ForegroundColor Blue
}

Write-Host "`n🎯 Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
