# Script Avanzado para Corrección de Importaciones Dinámicas de Firebase
# Versión: 2.0 - Maneja casos complejos y múltiples patrones

param(
    [switch]$DryRun,  # Solo mostrar qué se cambiaría sin modificar archivos
    [switch]$Verbose  # Mostrar más detalles del procesamiento
)

Write-Host "🔧 CORRECTOR AVANZADO DE IMPORTACIONES DINÁMICAS DE FIREBASE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "🔍 MODO DRY-RUN: Solo se mostrarán los cambios, no se modificarán archivos." -ForegroundColor Yellow
}

# Contadores
$script:stats = @{
    TotalFiles = 0
    ModifiedFiles = 0
    TotalReplacements = 0
    SkippedFiles = 0
    ErrorFiles = 0
}

# Patrones de importaciones dinámicas más completos
$dynamicPatterns = @{
    # Patrón básico: const {func1, func2} = await import("firebase/firestore")
    'const\s*\{\s*([^}]+)\s*\}\s*=\s*await\s+import\s*\(\s*["\']firebase/firestore["\']\s*\)' = @{
        Type = "AwaitImport"
        ImportsGroup = 1
    }
    
    # Patrón con destructuring en líneas separadas
    'const\s*\{\s*\n?\s*([^}]+)\s*\n?\s*\}\s*=\s*await\s+import\s*\(\s*["\']firebase/firestore["\']\s*\)' = @{
        Type = "MultilineAwaitImport"
        ImportsGroup = 1
    }
    
    # Patrón con import().then()
    'import\s*\(\s*["\']firebase/firestore["\']\s*\)\.then\s*\(\s*\(\s*\{\s*([^}]+)\s*\}\s*\)' = @{
        Type = "ThenImport"
        ImportsGroup = 1
    }
    
    # Importación dinámica de @firebase/firestore
    'const\s*\{\s*([^}]+)\s*\}\s*=\s*await\s+import\s*\(\s*["\']@firebase/firestore["\']\s*\)' = @{
        Type = "AtFirebaseImport"
        ImportsGroup = 1
    }
}

# Líneas específicas para remover
$linesToRemove = @(
    '^\s*//\s*Importar\s+Firebase\s*$',
    '^\s*//\s*Importación\s+dinámica\s+de\s+Firebase\s*$',
    '^\s*const\s*\{\s*db\s*\}\s*=\s*await\s+import\s*\(\s*["\']@?/?firebase["\']?\s*\)\s*$',
    '^\s*const\s*\{\s*db\s*\}\s*=\s*await\s+import\s*\(\s*["\'][^"\']*firebase[^"\']*["\']\s*\)\s*$'
)

function Write-VerboseLog {
    param([string]$Message, [string]$Color = "Gray")
    if ($Verbose) {
        Write-Host "    $Message" -ForegroundColor $Color
    }
}

function Get-ExistingFirebaseImports {
    param([string]$content, [string]$filePath)
    
    $isVueFile = $filePath -like "*.vue"
    $existingImports = @()
    
    if ($isVueFile) {
        # Buscar en la sección <script setup>
        if ($content -match '<script setup[^>]*>([\s\S]*?)(?=<\/script>|$)') {
            $scriptContent = $matches[1]
            if ($scriptContent -match 'import\s*\{\s*([^}]+)\s*\}\s*from\s*["\']firebase/firestore["\']') {
                $existingImports = ($matches[1] -split ',' | ForEach-Object { $_.Trim() })
            }
        }
    } else {
        # Buscar en archivos .ts/.js
        if ($content -match 'import\s*\{\s*([^}]+)\s*\}\s*from\s*["\']firebase/firestore["\']') {
            $existingImports = ($matches[1] -split ',' | ForEach-Object { $_.Trim() })
        }
    }
    
    return $existingImports
}

function Add-FirebaseImports {
    param([string]$content, [string[]]$importsToAdd, [string]$filePath)
    
    $isVueFile = $filePath -like "*.vue"
    $existingImports = Get-ExistingFirebaseImports -content $content -filePath $filePath
    
    # Combinar importaciones existentes con las nuevas
    $allImports = ($existingImports + $importsToAdd) | Sort-Object | Get-Unique | Where-Object { $_ -ne "" }
    
    if ($allImports.Count -eq 0) {
        return $content
    }
    
    $newImportLine = "import {$($allImports -join ', ')} from `"firebase/firestore`""
    
    if ($isVueFile) {
        if ($content -match '(<script setup[^>]*>)([\s\S]*?)(?=<\/script>|$)') {
            $scriptStart = $matches[1]
            $scriptContent = $matches[2]
            
            # Reemplazar importación existente o agregar nueva
            if ($scriptContent -match 'import\s*\{[^}]+\}\s*from\s*["\']firebase/firestore["\']') {
                $scriptContent = $scriptContent -replace 'import\s*\{[^}]+\}\s*from\s*["\']firebase/firestore["\']', $newImportLine
            } else {
                # Buscar lugar para insertar después de otros imports
                $importMatches = [regex]::Matches($scriptContent, 'import\s+[^;]+;?\s*\n?')
                if ($importMatches.Count -gt 0) {
                    $lastImport = $importMatches[$importMatches.Count - 1]
                    $insertPos = $lastImport.Index + $lastImport.Length
                    $beforeInsert = $scriptContent.Substring(0, $insertPos)
                    $afterInsert = $scriptContent.Substring($insertPos)
                    $scriptContent = $beforeInsert + $newImportLine + "`n" + $afterInsert
                } else {
                    # Agregar al inicio del script
                    $scriptContent = "`n" + $newImportLine + "`n" + $scriptContent
                }
            }
            
            $content = $content -replace '(<script setup[^>]*>)([\s\S]*?)(?=<\/script>|$)', ($scriptStart + $scriptContent)
        }
    } else {
        # Para archivos .ts/.js
        if ($content -match 'import\s*\{[^}]+\}\s*from\s*["\']firebase/firestore["\']') {
            $content = $content -replace 'import\s*\{[^}]+\}\s*from\s*["\']firebase/firestore["\']', $newImportLine
        } else {
            # Buscar lugar para insertar
            $importMatches = [regex]::Matches($content, 'import\s+[^;]+;?\s*\n?')
            if ($importMatches.Count -gt 0) {
                $lastImport = $importMatches[$importMatches.Count - 1]
                $insertPos = $lastImport.Index + $lastImport.Length
                $beforeInsert = $content.Substring(0, $insertPos)
                $afterInsert = $content.Substring($insertPos)
                $content = $beforeInsert + $newImportLine + "`n" + $afterInsert
            } else {
                # Agregar al inicio
                $content = $newImportLine + "`n" + $content
            }
        }
    }
    
    return $content
}

function Process-File {
    param([string]$filePath)
    
    $script:stats.TotalFiles++
    $fileName = Split-Path $filePath -Leaf
    Write-Host "📄 $fileName" -ForegroundColor Gray
    
    try {
        $content = Get-Content -Path $filePath -Raw -Encoding UTF8
        if (-not $content) {
            Write-VerboseLog "Archivo vacío, saltando..." "Yellow"
            $script:stats.SkippedFiles++
            return
        }
        
        $originalContent = $content
        $fileModified = $false
        $replacements = 0
        $importsToAdd = @()
        
        # Buscar patrones de importaciones dinámicas
        foreach ($pattern in $dynamicPatterns.Keys) {
            $patternInfo = $dynamicPatterns[$pattern]
            $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
            
            foreach ($match in $matches) {
                $importsList = $match.Groups[$patternInfo.ImportsGroup].Value
                $imports = $importsList -split ',' | ForEach-Object { 
                    $_.Trim() -replace '^\s*([^:]+).*$', '$1'  # Remover alias si los hay
                }
                
                $importsToAdd += $imports
                
                # Remover la importación dinámica completa
                $content = $content -replace [regex]::Escape($match.Value), ''
                $replacements++
                $fileModified = $true
                
                Write-VerboseLog "Removida importación $($patternInfo.Type): $($imports -join ', ')" "Green"
            }
        }
        
        # Remover líneas específicas
        foreach ($linePattern in $linesToRemove) {
            $lineMatches = [regex]::Matches($content, $linePattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
            if ($lineMatches.Count -gt 0) {
                $content = $content -replace $linePattern, ''
                $replacements += $lineMatches.Count
                $fileModified = $true
                Write-VerboseLog "Removidas $($lineMatches.Count) líneas de comentario" "Green"
            }
        }
        
        # Agregar importaciones estáticas si es necesario
        if ($importsToAdd.Count -gt 0) {
            $uniqueImports = $importsToAdd | Sort-Object | Get-Unique | Where-Object { $_ -ne "" }
            $content = Add-FirebaseImports -content $content -importsToAdd $uniqueImports -filePath $filePath
            Write-VerboseLog "Agregadas importaciones estáticas: $($uniqueImports -join ', ')" "Cyan"
        }
        
        # Limpiar formato
        $content = $content -replace '\n\s*\n\s*\n+', "`n`n"  # Múltiples líneas vacías
        $content = $content -replace '^\s*\n+', ''            # Líneas vacías al inicio
        
        # Guardar cambios
        if ($fileModified -and $content -ne $originalContent) {
            if (-not $DryRun) {
                Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
            }
            
            $script:stats.ModifiedFiles++
            $script:stats.TotalReplacements += $replacements
            
            $dryRunText = if ($DryRun) { " [DRY-RUN]" } else { "" }
            Write-Host "  ✅ Modificado: $replacements cambios$dryRunText" -ForegroundColor Green
        } else {
            Write-VerboseLog "Sin cambios necesarios" "Gray"
        }
        
    } catch {
        $script:stats.ErrorFiles++
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-VerboseLog "Stack trace: $($_.ScriptStackTrace)" "Red"
    }
}

# Obtener archivos
Write-Host "🔍 Buscando archivos..." -ForegroundColor Yellow

$files = Get-ChildItem -Path . -Recurse -Include "*.vue", "*.ts", "*.js" | 
    Where-Object { 
        $_.FullName -notlike "*node_modules*" -and 
        $_.FullName -notlike "*dist*" -and 
        $_.FullName -notlike "*build*" -and
        $_.FullName -notlike "*.d.ts" -and
        $_.FullName -notlike "*/.git/*"
    }

Write-Host "📊 Encontrados $($files.Count) archivos para procesar" -ForegroundColor Cyan

# Procesar archivos
foreach ($file in $files) {
    Process-File -filePath $file.FullName
}

# Estadísticas finales
Write-Host "`n📊 RESUMEN FINAL:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📁 Archivos procesados: $($script:stats.TotalFiles)" -ForegroundColor White
Write-Host "✅ Archivos modificados: $($script:stats.ModifiedFiles)" -ForegroundColor Green
Write-Host "🔄 Total de reemplazos: $($script:stats.TotalReplacements)" -ForegroundColor Yellow
Write-Host "⏭️  Archivos saltados: $($script:stats.SkippedFiles)" -ForegroundColor Gray
Write-Host "❌ Archivos con errores: $($script:stats.ErrorFiles)" -ForegroundColor Red

if ($DryRun) {
    Write-Host "`n🔍 Esto fue una simulación. Ejecuta sin -DryRun para aplicar cambios." -ForegroundColor Yellow
} elseif ($script:stats.ModifiedFiles -gt 0) {
    Write-Host "`n🎉 ¡Corrección completada exitosamente!" -ForegroundColor Green
    Write-Host "💡 Recomendaciones:" -ForegroundColor Cyan
    Write-Host "   1. Verifica que el proyecto compile correctamente" -ForegroundColor White
    Write-Host "   2. Ejecuta las pruebas para asegurar funcionalidad" -ForegroundColor White
    Write-Host "   3. Haz commit de los cambios" -ForegroundColor White
    Write-Host "   4. El build de Netlify debería funcionar sin advertencias" -ForegroundColor White
} else {
    Write-Host "`nℹ️  No se encontraron importaciones dinámicas para corregir." -ForegroundColor Blue
}

Write-Host "`nPresiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
