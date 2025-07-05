# 🧪 Guía de Pruebas - Módulo de Clases Compartidas con Gestión de Permisos

## 🎯 Objetivo

Verificar que el módulo de clases compartidas funciona correctamente con la estructura de Firestore, donde la propiedad `teachers` (array) determina si una clase es compartida, y que la gestión de permisos se actualiza correctamente en Firestore.

## 📋 Pre-requisitos

1. La aplicación debe estar ejecutándose (`npm run dev`)
2. Navegar a la sección de Administración de Clases
3. Tener la consola del navegador abierta (F12)

## 🔧 Scripts de Prueba Disponibles

### 1. Scripts de Análisis Básico

```javascript
// Cargar scripts en consola:
// Copiar y pegar el contenido de cada archivo .js en la consola

// Después cargar las funciones:
debugFirestoreClasses() // Analizar datos actuales
verifySharedClassesModule() // Verificar funcionamiento del módulo
realFirestoreTest() // Prueba completa con datos reales
```

### 2. Scripts de Datos de Prueba

```javascript
// Generar datos de prueba basados en Firestore:
generateFirestoreTestData() // Crear datos de prueba
loadFirestoreTestData() // Cargar en la aplicación

// Datos específicos de tu clase real:
injectTestSharedClass() // Inyectar clase de ejemplo
setupTestEnvironment() // Configurar entorno completo
```

### 3. **NUEVO** - Scripts de Prueba de Permisos

```javascript
// Probar sistema de permisos:
testPermissionsSystem() // Crear datos con permisos detallados
loadPermissionsTestData() // Cargar datos con permisos en la app
testPermissionsUI() // Probar interfaz de gestión de permisos
simulatePermissionUpdate() // Simular actualización de permisos
```

## 📊 Estructura de Datos Esperada

### Clase Compartida con Permisos (Firestore)

```javascript
{
  id: "6URLsR4hz1U3OkphzGZo",
  name: "Clase de Piano",
  teacherId: "1MsigzUDs3TWgODw.hF3GVDvPOf3",  // Maestro principal
  teachers: [                                    // ← ESTA es la propiedad clave
    "1MsigzUDs3TWgODw.hF3GVDvPOf3",             // Maestro principal (string)
    {                                           // Maestro compartido (objeto)
      teacherId: "pzoktR8EiJYNKq8wc23YQbE3jWF3",
      role: "assistant",
      assignedAt: "2025-01-20T10:00:00Z",
      assignedBy: "1MsigzUDs3TWgODw.hF3GVDvPOf3",
      permissions: {
        canTakeAttendance: true,
        canAddObservations: true,
        canViewAttendanceHistory: true,
        canEditClass: false,
        canManageStudents: false,
        canManageTeachers: false,
        canManageSchedule: false
      }
    }
  ],
  // ... otros campos
}
```

### Niveles de Permisos Disponibles

- **Solo Lectura**: Ver información básica, estudiantes y horarios
- **Editor**: Lectura + editar clase y gestionar estudiantes
- **Administrador**: Editor + gestionar otros maestros y horarios

### Clase NO Compartida

```javascript
{
  id: "clase-no-compartida",
  name: "Piano Individual",
  teacherId: "solo-teacher",
  teachers: [],                                  // ← Array vacío = no compartida
  // ... otros campos
}
```

## 🚀 Pasos de Prueba

### Paso 1: Verificar Estado Actual

1. Abrir consola del navegador
2. Ejecutar: `debugFirestoreClasses()`
3. Revisar qué clases se detectan como compartidas
4. Verificar si hay datos en el store

### Paso 2: Generar Datos de Prueba (si es necesario)

```javascript
// Si no hay datos o no se ven clases compartidas:
generateFirestoreTestData()
loadFirestoreTestData()

// Para probar específicamente permisos:
testPermissionsSystem()
loadPermissionsTestData()

// Recargar página después de generar datos
location.reload()
```

### Paso 3: Verificar UI

1. Navegar al tab "Clases Compartidas"
2. Verificar que aparece el contador con el número correcto
3. Verificar que se muestran las clases compartidas
4. **NUEVO**: Hacer click en botón "Editar permisos" (ícono lápiz)
5. **NUEVO**: Verificar que se abre el diálogo de gestión de permisos

### Paso 4: Prueba Completa con Permisos

```javascript
// Ejecutar análisis completo:
realFirestoreTest()

// Probar específicamente permisos:
testPermissionsUI()

// Si hay problemas, forzar actualización:
forceDataRefresh()
```

### **NUEVO** - Paso 5: Prueba de Gestión de Permisos

1. **Abrir diálogo de permisos**: Click en botón de editar permisos
2. **Cambiar nivel**: Seleccionar "Editor" o "Administrador"
3. **Verificar permisos específicos**: Los checkboxes deben actualizarse automáticamente
4. **Guardar cambios**: Click en "Guardar Cambios"
5. **Verificar actualización**: Los cambios deben reflejarse en Firestore

## ✅ Resultados Esperados

### En Consola

```
🔗 AdminClassesView - Clases compartidas encontradas: 3
- Clase de Piano: teachers = [teacher1, teacher2]
- Guitarra Clásica: teachers = [teacher2, teacher3, teacher4]
- Ensamble de Violín: teachers = [teacher5, teacher6, teacher7]
```

### En UI

- **Tab "Clases Compartidas"** debe mostrar un contador (ej: "3")
- **Lista de clases compartidas** debe mostrar todas las clases con `teachers.length > 0`
- **Filtros** deben funcionar correctamente
- **Detalles de cada clase** deben mostrar todos los maestros asignados

## 🔍 Puntos de Verificación

### ✅ Lógica Correcta

- [x] Se usa `cls.teachers` (no `cls.sharedWith`)
- [x] Se verifica que `teachers` sea un array
- [x] Se verifica que `teachers.length > 0`
- [x] Compatibilidad con `teachers` como array de strings o objetos

### ✅ UI Funcional

- [x] Tab de clases compartidas visible
- [x] Contador muestra número correcto
- [x] Lista muestra clases compartidas
- [x] Filtros funcionan con nueva lógica
- [x] No se muestran clases con `teachers = []`
- [x] **NUEVO**: Botones de "Editar permisos" visibles
- [x] **NUEVO**: Diálogo de gestión de permisos funcional
- [x] **NUEVO**: Cambios de permisos se guardan en Firestore

### ✅ Gestión de Permisos

- [x] **NUEVO**: Niveles de acceso (Lectura, Editor, Administrador)
- [x] **NUEVO**: Permisos específicos configurables
- [x] **NUEVO**: Actualización en tiempo real
- [x] **NUEVO**: Validación de permisos del propietario
- [x] **NUEVO**: Botón "Eliminar Acceso" funcional

### ✅ Datos Consistentes

- [x] AdminClassesView pasa todas las clases a SharedClassesList
- [x] SharedClassesList filtra usando `teachers`
- [x] Logs de debug muestran proceso de filtrado
- [x] Datos reales de Firestore se procesan correctamente

## 🚨 Problemas Comunes y Soluciones

### Problema: No se ven clases compartidas

**Soluciones:**

1. Verificar que las clases tengan `teachers` poblado
2. Ejecutar `generateFirestoreTestData()` para datos de prueba
3. Verificar logs en consola con `debugFirestoreClasses()`

### Problema: Contador en 0 pero hay clases compartidas

**Soluciones:**

1. Verificar estructura de datos con `realFirestoreTest()`
2. Comprobar que no se esté usando `sharedWith` en lugar de `teachers`
3. Forzar actualización con `forceDataRefresh()`

### Problema: No se ven botones de editar permisos

**Soluciones:**

1. Verificar que eres propietario de la clase (`isClassOwner`)
2. Ejecutar `testPermissionsSystem()` para datos con permisos
3. Verificar que los maestros aparecen en la sección "Maestros con Acceso"

### Problema: Error al guardar permisos

**Soluciones:**

1. Verificar conexión con Firestore
2. Comprobar que tienes permisos de propietario
3. Revisar logs de consola para errores específicos
4. Usar `simulatePermissionUpdate()` para datos de prueba

## 📝 Notas Técnicas

### Cambios Implementados

1. **AdminClassesView.vue**: Actualizado para usar `teachers` en filtros
2. **SharedClassesList.vue**: Filtra usando `teachers.length > 0`
3. **class.ts**: Tipo actualizado para permitir `teachers: (string | ClassTeacher)[]`
4. **Logs de debug**: Agregados para facilitar troubleshooting
5. **NUEVO - ManagePermissionsDialog.vue**: Diálogo completo de gestión de permisos
6. **NUEVO - Funciones de actualización**: Conectadas con Firestore para guardar cambios
7. **NUEVO - Sistema de permisos**: 3 niveles + permisos específicos configurables

### Estructura Firestore Soportada

- `teachers: string[]` - Array de IDs de maestros (solo IDs)
- `teachers: ClassTeacher[]` - Array de objetos maestro con permisos
- `teachers: (string | ClassTeacher)[]` - Array mixto (compatibilidad)
- `teachers: []` - Array vacío (clase no compartida)
- `teachers: undefined` - Sin compartir (legacy)

### **NUEVO** - Sistema de Permisos

- **Niveles**: Solo lectura, Editor, Administrador
- **Permisos específicos**: 7 permisos granulares configurables
- **Actualización en Firestore**: Cambios se guardan automáticamente
- **Validación**: Solo propietarios pueden modificar permisos

## 🎉 Resultado Final Esperado

Al completar las pruebas exitosamente, deberías ver:

1. **En la consola**: Logs claros mostrando qué clases son compartidas y permisos
2. **En la UI**: Tab "Clases Compartidas" con contador y lista funcional
3. **Gestión de permisos**: Botones de editar permisos y diálogo funcional
4. **Funcionalidad completa**: Filtros, detalles, permisos y compartir funcionando
5. **Actualización en Firestore**: Cambios de permisos se guardan correctamente
6. **Compatibilidad**: Sistema funciona tanto con datos nuevos como legacy

---

**💡 Tip**: Para pruebas rápidas de permisos, ejecuta `testPermissionsSystem()` seguido de `loadPermissionsTestData()` y luego `testPermissionsUI()` para una verificación completa del sistema.
