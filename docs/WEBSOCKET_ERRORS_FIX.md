# Solución a Errores de WebSocket en Vite

## Problema
Errores comunes en desarrollo:
```
WebSocket connection to 'ws://localhost:5173/?token=...' failed
[vite] failed to connect to websocket
Uncaught (in promise) Error: WebSocket closed without opened
```

## Causa
- Conflicto entre puertos: Vite intenta conectar al puerto 5173 pero el servidor corre en otro puerto
- Procesos Node.js residuales ocupando puertos
- Configuración HMR (Hot Module Replacement) incorrecta

## Soluciones Implementadas

### 1. Configuración de Vite Actualizada
**Archivo**: `vite.config.ts`
- `strictPort: false` - Permite usar puertos alternativos
- `clientPort: undefined` - HMR usa el mismo puerto que el servidor
- `usePolling: false` - Mejor rendimiento en Windows

### 2. Scripts de Limpieza
**Archivo**: `package.json`
```bash
npm run dev:clean    # Limpia procesos y ejecuta dev
npm run clean-processes  # Solo limpia procesos Node.js
```

**Archivo**: `scripts/fix-websocket.ps1`
- Detiene procesos Node.js problemáticos
- Libera puertos ocupados (3000, 5173)
- Ejecutable desde PowerShell

### 3. Comandos de Resolución Rápida

#### Opción 1: Usar el script automático
```bash
npm run dev:clean
```

#### Opción 2: Limpieza manual (PowerShell)
```powershell
# Detener procesos Node.js
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force

# Verificar puertos ocupados
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Matar proceso específico (cambiar PID)
taskkill /PID <PID> /F
```

#### Opción 3: Reinicio de servidor
```bash
# Detener servidor actual
Ctrl + C

# Esperar 5 segundos
# Reiniciar
npm run dev
```

### 4. Configuración Recomendada para Desarrollo

**Puerto principal**: 3000
**HMR**: Automático en el mismo puerto
**Modo watch**: Optimizado para Windows

## Prevención
1. Siempre usar `Ctrl + C` para detener el servidor correctamente
2. Evitar cerrar abruptamente la terminal
3. Usar `npm run dev:clean` si hay problemas
4. Verificar que no haya múltiples instancias corriendo

## Notas Técnicas
- Los errores de WebSocket no afectan la funcionalidad, solo el HMR
- En producción estos errores no ocurren
- La configuración es específica para entorno Windows con PowerShell

## Comandos de Diagnóstico
```bash
# Verificar procesos Node.js
Get-Process node

# Ver puertos en uso
netstat -ano | findstr :3000

# Verificar configuración Vite
npm run dev -- --debug
```
