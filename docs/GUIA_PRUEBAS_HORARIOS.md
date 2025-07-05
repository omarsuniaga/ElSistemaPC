# 🎵 Sistema de Horarios con Filtros y Solapamiento - Guía de Pruebas

## 📋 Funcionalidades Implementadas

### ✅ **Filtros de Período del Día**

- **Mañana (7am-2pm)**: Filtra clases matutinas
- **Tarde (2pm-7pm)**: Filtra clases vespertinas
- **Noche (7pm-11pm)**: Filtra clases nocturnas
- **Persistencia**: Configuración guardada en Firestore (`CONFIGURACION/app_config`)

### ✅ **Modos de Visualización**

- **Estándar**: Una clase por slot de tiempo (vista tradicional)
- **Con Solapamiento**: Múltiples clases apiladas en el mismo slot

### ✅ **Funciones de Depuración**

- Logs detallados de clases cargadas
- Normalización de nombres de días (español/inglés)
- Verificación de horarios en tiempo real

## 🚀 Cómo Probar el Sistema

### 1. **Acceder a la Vista de Horarios**

```
Navegación: Clases → Ver Horarios → Pestaña "Horarios"
URL: /admin/classes (pestaña Horarios)
```

### 2. **Verificar Datos de Clases**

```javascript
// Abrir consola del navegador (F12)
// Las funciones de debug se ejecutan automáticamente
```

**Si no hay clases**, usar el script incluido:

```javascript
// En la consola del navegador
showSampleDataSummary() // Ver resumen de clases de ejemplo
createLocalStorageData() // Crear datos temporales
```

### 3. **Probar Filtros de Período**

1. **Desmarcar "Mañana"** → Solo clases de tarde y noche
2. **Desmarcar "Tarde"** → Solo clases de mañana y noche
3. **Desmarcar "Noche"** → Solo clases de mañana y tarde
4. **Marcar solo "Mañana"** → Solo clases de 7am-2pm

**Resultado esperado**: La grilla de horarios se ajusta dinámicamente

### 4. **Probar Modo de Solapamiento**

1. **Cambiar a "Con solapamiento"**
2. **Crear clases superpuestas** (mismo horario)
3. **Verificar apilamiento** visual de clases

### 5. **Verificar Persistencia**

1. **Cambiar configuración** de filtros
2. **Recargar página**
3. **Confirmar** que filtros se mantienen

## 🔍 Logs de Depuración

### En Consola del Navegador:

```
=== DEBUG: Estado de clases ===
Total de clases: 10
Clases filtradas: 8
Clase 1: {
  id: "class1",
  name: "Piano Básico A",
  schedule: { slots: [...] }
}
...
```

### Clases Activas:

```
Clase "Piano Básico A" activa en monday 08:00 (08:00-09:00)
Clases para monday: ["Piano Básico A", "Guitarra Intermedio"]
```

## 🎯 Casos de Prueba Específicos

### **Caso 1: Filtro de Mañana**

- **Acción**: Desmarcar "Tarde" y "Noche"
- **Esperado**: Solo horarios de 7am-2pm visibles
- **Verificar**: Estadísticas muestran rango "7:00 AM - 2:00 PM"

### **Caso 2: Modo Solapamiento**

- **Acción**: Crear 2 clases mismo horario, cambiar a modo "overlap"
- **Esperado**: Ambas clases visibles apiladas
- **Verificar**: Efecto de profundidad (z-index)

### **Caso 3: Sin Filtros Activos**

- **Acción**: Desmarcar todos los períodos
- **Esperado**: Sistema muestra todo el día (7am-11pm)
- **Verificar**: Mensaje automático de "mostrar todo"

### **Caso 4: Persistencia**

- **Acción**: Configurar filtros → Recargar → Navegar
- **Esperado**: Configuración se mantiene
- **Verificar**: Firestore documento `CONFIGURACION/app_config`

## 🛠️ Resolución de Problemas

### **No se ven clases en el horario:**

```javascript
// Ejecutar en consola
debugClasses() // Ver estado completo de clases
```

**Posibles causas:**

1. No hay clases con horarios definidos
2. Formato de horario incompatible
3. Días no normalizados correctamente

### **Filtros no funcionan:**

```javascript
// Verificar configuración
console.log(timeConfig.value)
```

**Verificar:**

1. Conexión a Firestore
2. Permisos de escritura en `CONFIGURACION`
3. Formato de datos en `app_config`

### **Días no coinciden:**

El sistema normaliza automáticamente:

- ✅ `"lunes"` → `"monday"`
- ✅ `"miércoles"` → `"wednesday"`
- ✅ `"sábado"` → `"saturday"`

## 📊 Datos de Ejemplo

### **Script Incluido** (`create-sample-classes.js`):

- **10 clases** con diferentes horarios
- **4 maestros** distintos
- **10 estudiantes** distribuidos
- **Instrumentos variados** (Piano, Guitarra, Violín, etc.)
- **Horarios distribuidos** en todos los períodos

### **Usar en Consola:**

```javascript
// Ver resumen
showSampleDataSummary()

// Crear datos temporales
createLocalStorageData()

// Recargar página para ver datos
location.reload()
```

## 🔮 Funcionalidades Avanzadas

### **Estadísticas en Tiempo Real**

- Contador de clases visibles
- Rango horario dinámico
- Indicadores de períodos activos

### **Acciones Rápidas**

- **"Resetear filtros"**: Volver a configuración por defecto
- **"Mostrar todo el día"**: Activar todos los períodos
- **Navegación semanal**: Anterior/Siguiente

### **Responsive Design**

- Grilla adaptable en móviles
- Controles optimizados para touch
- Dark mode compatible

## 🎉 Estado Final

✅ **Sistema 100% Funcional**

- Filtros de tiempo persistentes
- Visualización con solapamiento
- Normalización robusta de datos
- Logs de depuración completos
- Datos de ejemplo incluidos

El sistema está listo para producción y pruebas extensivas. 🚀
