# 🔧 Scripts de Corrección de Imports

Este directorio contiene scripts para resolver automáticamente los conflictos de imports dinámicos vs estáticos que causan las advertencias de Vite.

## 🚀 Uso Rápido

### **Opción 1: Script PowerShell (Recomendado para Windows)**
```powershell
npm run fix-imports:windows
```

### **Opción 2: Corrección rápida**
```bash
npm run fix-imports
```

### **Opción 3: Análisis completo**
```bash
npm run fix-imports:advanced
```

## 📋 Scripts Disponibles

### 1. **quick-import-fix.js** ⚡
**Comando:** `npm run fix-imports`

**¿Qué hace?**
- Identifica conflictos comunes de imports
- Aplica correcciones rápidas basadas en patrones conocidos
- Enfoque en los módulos más problemáticos (Firebase, stores internos)

**Ideal para:** Corrección rápida de problemas conocidos

### 2. **advanced-import-resolver.js** 🧠
**Comando:** `npm run fix-imports:advanced`

**¿Qué hace?**
- Análisis profundo de toda la aplicación
- Estrategias inteligentes por tipo de archivo
- Reporte detallado de conflictos y recomendaciones

**Ideal para:** Análisis completo y planificación de correcciones

### 3. **fix-import-conflicts.js** 🔧
**Comando:** `npm run fix-imports:full`

**¿Qué hace?**
- Análisis exhaustivo con AST parsing
- Correcciones más precisas y detalladas
- Manejo de casos complejos

**Ideal para:** Correcciones completas y casos especiales

### 4. **fix-imports.ps1** 🪟
**Comando:** `npm run fix-imports:windows`

**¿Qué hace?**
- Interfaz interactiva en PowerShell
- Opciones múltiples de corrección
- Verificación automática de dependencias
- Ejecución de build para verificar mejoras

**Ideal para:** Usuarios de Windows que prefieren interfaz gráfica

## 🎯 Estrategias Implementadas

### **Firebase**
- `firebase/app`, `firebase/auth`: **Siempre estático**
- `firebase/firestore`: **Inteligente**
  - Estático en componentes y vistas
  - Dinámico en stores y servicios

### **Vue Ecosystem**
- `vue`, `vue-router`, `pinia`: **Siempre estático**
- `@heroicons/vue`: **Estático**

### **Stores y Services Internos**
- En `/store/`: **Dinámico** (carga bajo demanda)
- En `/service/`: **Dinámico** (optimización de bundle)
- En `/components/`: **Estático** (necesario inmediatamente)

### **Librerías Pesadas**
- `jspdf`, `chart.js`: **Dinámico** (carga cuando se necesiten)

## 📊 Verificar Mejoras

Después de ejecutar las correcciones:

```bash
npm run build
```

**Antes:**
```
dist/assets/index.Qmf42ntj.js    1,259.34 kB │ gzip: 352.76 kB
(!) Some chunks are larger than 500 kB
```

**Después:**
```
dist/assets/vendor-vue.abc123.js      200.34 kB │ gzip: 65.12 kB
dist/assets/vendor-firebase.def456.js 180.45 kB │ gzip: 55.23 kB
dist/assets/module-admin.ghi789.js    120.67 kB │ gzip: 35.44 kB
dist/assets/index.jkl012.js           350.12 kB │ gzip: 95.67 kB
```

## 🔄 Proceso de Corrección

1. **Análisis:** Los scripts identifican imports inconsistentes
2. **Backup:** Se crean copias de seguridad automáticamente
3. **Corrección:** Se aplican las estrategias optimizadas
4. **Verificación:** Build para confirmar mejoras

## ⚠️ Archivos de Backup

Los scripts crean automáticamente archivos `.backup` antes de hacer cambios:
- `archivo.vue.backup` - Backup del archivo original
- `archivo.vue.backup.timestamp` - Backup con timestamp

## 🚨 Casos Especiales

### **Si un módulo sigue teniendo problemas:**

1. **Verificar configuración** en el script correspondiente
2. **Agregar regla específica** para ese módulo
3. **Ejecutar corrección manual** si es necesario

### **Si el build sigue mostrando advertencias:**

1. Ejecutar análisis avanzado: `npm run fix-imports:advanced`
2. Revisar el reporte detallado
3. Aplicar correcciones manuales para casos edge

## 📝 Logs y Debug

Los scripts generan logs detallados:
- ✅ Archivos procesados exitosamente
- ⚠️ Advertencias sobre archivos problemáticos
- 🔧 Correcciones aplicadas
- 📊 Estadísticas finales

## 🔍 Análisis sin Correcciones

Para solo ver qué se corregiría sin aplicar cambios:

```bash
npm run fix-imports:analyze
```

Esto te permite revisar las correcciones propuestas antes de aplicarlas.

## ✅ Mejores Prácticas

1. **Ejecutar en entorno de desarrollo** antes de producción
2. **Revisar los backups** si algo sale mal
3. **Testear la aplicación** después de las correcciones
4. **Ejecutar build** para verificar optimizaciones
5. **Usar análisis** antes de correcciones en proyectos grandes
