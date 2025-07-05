# MANUAL DE PRUEBAS - SISTEMA DE CLASES EMERGENTES

## Verificación Completa de Carga de Estudiantes

### ESTADO ACTUAL

✅ **COMPLETADO**: Integración completa del sistema de clases emergentes con gestión de asistencia
✅ **IMPLEMENTADO**: Carga automática de estudiantes desde `EMERGENCY_CLASSES`
✅ **CORREGIDO**: Búsqueda híbrida de clases (regulares + emergentes)
✅ **SOLUCIONADO**: Errores de TypeScript y navegación

---

## PASO 1: PREPARACIÓN PARA PRUEBAS

### 1.1 Ejecutar el servidor de desarrollo

```bash
npm run dev
```

### 1.2 Navegar a la clase emergente problemática

- URL: `http://localhost:3000/attendance/20250627/3sf0mBLxcam45CbTgmvK`
- **ID de Clase Emergente**: `3sf0mBLxcam45CbTgmvK`
- **Fecha**: 27 de junio de 2025

### 1.3 Abrir herramientas de desarrollo

- Presionar `F12`
- Ir a la pestaña **Console**

---

## PASO 2: CARGAR SCRIPT DE PRUEBAS

### 2.1 Copiar y pegar en la consola:

```javascript
// Cargar el script de pruebas directamente
const script = document.createElement("script")
script.src = "/test-emergency-class-students-complete.js"
document.head.appendChild(script)
```

### 2.2 O ejecutar las pruebas manualmente:

```javascript
// Verificar acceso a Firebase
if (window.firebase && window.firebase.firestore) {
  const db = window.firebase.firestore()
  const emergencyRef = db.collection("EMERGENCY_CLASSES").doc("3sf0mBLxcam45CbTgmvK")
  emergencyRef.get().then((doc) => {
    if (doc.exists) {
      const data = doc.data()
      console.log("✅ Clase emergente encontrada:", {
        nombre: data.className,
        estudiantes: data.selectedStudents?.length || 0,
        ids: data.selectedStudents,
      })
    }
  })
}
```

---

## PASO 3: VERIFICACIONES AUTOMÁTICAS

### 3.1 Resultados esperados en consola:

```
🎯 Testing COMPLETE Emergency Class Student Loading...
📚 Testing emergency class student loading integration...
1. Checking current page context...
📍 Current URL: [URL de la clase emergente]
2. Checking for student elements in the page...
👥 Found X potential student elements
3. Checking attendance table structure...
📊 Attendance table/list found
📋 Table rows/items found: X
```

### 3.2 Verificar elementos de estudiantes:

- La tabla debe mostrar nombres de estudiantes reales
- No debe aparecer solo el ID de la clase
- Los botones de asistencia deben estar disponibles

---

## PASO 4: VERIFICACIONES MANUALES

### 4.1 Interfaz de usuario

- [ ] **Título de la clase**: Debe mostrar el nombre real, no el ID
- [ ] **Lista de estudiantes**: Debe mostrar estudiantes con nombres completos
- [ ] **Contador de estudiantes**: Debe mostrar número > 0
- [ ] **Botones de asistencia**: Presente/Ausente/Tardanza disponibles

### 4.2 Mensajes de error

- [ ] **NO debe aparecer**: "No se encontró la clase con ID=3sf0mBLxcam45CbTgmvK"
- [ ] **NO debe aparecer**: "Sin estudiantes registrados"
- [ ] **SÍ debe aparecer**: Mensajes de carga exitosa

### 4.3 Funcionalidad de asistencia

- [ ] **Marcar presente**: Debe cambiar estado del estudiante
- [ ] **Marcar ausente**: Debe cambiar estado del estudiante
- [ ] **Marcar tardanza**: Debe cambiar estado del estudiante
- [ ] **Guardar asistencia**: Debe persistir en Firebase

---

## PASO 5: DEBUGGING AVANZADO

### 5.1 Activar modo debug

```javascript
window.localStorage.setItem("attendance-debug", "true")
// Luego refrescar la página
```

### 5.2 Buscar mensajes de debug en consola:

```
[AttendanceDebug] onMounted: Detectada clase emergente
[AttendanceDebug] onMounted: Cargando estudiantes de CLASE EMERGENTE...
[AttendanceDebug] ✅ Estudiantes de clase emergente obtenidos: X
[AttendanceDebug] 📋 onMounted: Total estudiantes filtrados para la clase: X
```

### 5.3 Verificar almacenamiento de datos

```javascript
// Verificar que los datos se cargan correctamente
console.log("Estudiantes cargados:", window.emergencyClassStudentTests)
```

---

## PASO 6: PRUEBAS DE INTEGRACIÓN

### 6.1 Navegación desde dashboard

1. Ir al dashboard de maestros
2. Buscar la clase emergente en el calendario
3. Hacer clic para acceder a la asistencia
4. Verificar que la carga es correcta

### 6.2 Navegación directa

1. Usar URL directa: `/attendance/20250627/3sf0mBLxcam45CbTgmvK`
2. Verificar carga inmediata de estudiantes
3. Confirmar que no hay errores de navegación

---

## PASO 7: RESULTADOS ESPERADOS

### ✅ ÉXITO SI:

1. **Título**: Muestra nombre de clase, no ID
2. **Estudiantes**: Lista poblada con nombres reales
3. **Asistencia**: Botones funcionales para cada estudiante
4. **Navegación**: Sin errores de "clase no encontrada"
5. **Performance**: Carga rápida y sin trabas

### ❌ FALLO SI:

1. **Error**: "No se encontró la clase con ID=..."
2. **Vacío**: Lista de estudiantes vacía
3. **IDs**: Solo muestra IDs en lugar de nombres
4. **Carga**: Pantalla de carga infinita
5. **Funcionalidad**: Botones de asistencia no responden

---

## PASO 8: SOLUCIÓN DE PROBLEMAS

### 8.1 Si no cargan estudiantes:

```javascript
// Verificar datos directamente en Firebase
const db = firebase.firestore()
db.collection("EMERGENCY_CLASSES")
  .doc("3sf0mBLxcam45CbTgmvK")
  .get()
  .then((doc) => {
    console.log("Datos directos:", doc.data())
  })
```

### 8.2 Si hay errores de navegación:

1. Limpiar caché del navegador
2. Reiniciar servidor de desarrollo
3. Verificar reglas de Firebase

### 8.3 Si faltan estudiantes:

1. Verificar que los IDs en `selectedStudents` coinciden con documentos en `ALUMNOS`
2. Comprobar permisos de lectura en Firebase
3. Revisar filtros de estudiantes activos

---

## CÓDIGO MODIFICADO EN ESTA SOLUCIÓN

### Archivos principales:

1. **`src/stores/classes.ts`** - Método `findClassById()`
2. **`src/modulos/Classes/store/classes.ts`** - Búsqueda híbrida
3. **`src/modulos/Attendance/components/AttendanceList.vue`** - Carga de estudiantes
4. **`src/views/AttendanceView.vue`** - Soporte para clases emergentes

### Funcionalidades añadidas:

- ✅ Búsqueda híbrida de clases (regulares + emergentes)
- ✅ Conversión automática de formato de clases emergentes
- ✅ Carga de estudiantes específica para clases emergentes
- ✅ Detección automática del tipo de clase
- ✅ Manejo de errores mejorado

---

**ESTADO**: 🎯 **IMPLEMENTACIÓN COMPLETA**
**SIGUIENTE**: 🔄 **FASE DE PRUEBAS Y VALIDACIÓN**
