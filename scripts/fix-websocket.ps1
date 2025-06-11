# Script para resolver problemas de WebSocket en Vite
# Ejecutar en PowerShell como administrador si es necesario

Write-Host "🔍 Limpiando procesos Node.js problemáticos..." -ForegroundColor Yellow

# Detener procesos Node.js que puedan estar ocupando puertos
Get-Process | Where-Object { $_.ProcessName -eq "node" } | ForEach-Object {
    Write-Host "Deteniendo proceso Node.js: $($_.Id)" -ForegroundColor Red
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Verificar puertos ocupados
Write-Host "🔍 Verificando puertos ocupados..." -ForegroundColor Yellow
$ports = @(3000, 5173)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "Puerto $port ocupado por PID: $($connection.OwningProcess)" -ForegroundColor Red
        try {
            Stop-Process -Id $connection.OwningProcess -Force
            Write-Host "Proceso detenido exitosamente" -ForegroundColor Green
        } catch {
            Write-Host "No se pudo detener el proceso: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Puerto $port libre" -ForegroundColor Green
    }
}

Write-Host "✅ Limpieza completada. Puedes ejecutar 'npm run dev' ahora." -ForegroundColor Green
