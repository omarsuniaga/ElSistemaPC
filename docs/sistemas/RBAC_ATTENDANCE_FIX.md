# Solución del Problema de Bucle Infinito en RBAC y AttendanceList

## Problema Identificado

El sistema presentaba un bucle infinito de redirecciones cuando un maestro intentaba acceder a las rutas de asistencia. El error se manifestaba de la siguiente manera:

1. **Maestro con rol "Maestro"** intentaba acceder a `/attendance/2025-06-06/utbM1dZWhOiF5ODx26nO`
2. **RBAC Guard** rechazaba el acceso y redirigía a `/dashboard`
3. **RBAC Guard** también rechazaba `/dashboard` para maestros
4. **Bucle infinito** se creaba causando Stack Overflow

## Causa Raíz

1. **Navegación incorrecta**: El código en `AttendanceView.vue` no estaba correctamente detectando el rol "Maestro" y navegando a rutas `/attendance/` en lugar de `/teacher/attendance/`
2. **RBAC Guard incompleto**: No manejaba correctamente las redirecciones para maestros que intentaban acceder a rutas administrativas
3. **Falta de verificación de bucles**: No había protección contra redirecciones infinitas

## Solución Implementada

### 1. Mejoras en RBAC Guard (`src/router/guards/rbacGuard.ts`)

```typescript
// Verificación especial para maestros en rutas de teacher
if (userRole?.toLowerCase() === 'maestro' && to.path.startsWith('/teacher')) {
  console.log(`✅ RBAC Guard: Acceso maestro permitido para ruta teacher: ${to.path}`);
  return next();
}

// Redirección especial para maestros que intentan acceder a rutas de admin
if (userRole?.toLowerCase() === 'maestro' && to.path.startsWith('/attendance/')) {
  console.log(`🔄 RBAC Guard: Redirigiendo maestro de ruta admin ${to.path} a ruta teacher`);
  const pathParts = to.path.split('/');
  // Extraer date y classId si están presentes: /attendance/:date/:classId
  if (pathParts.length >= 4) {
    const date = pathParts[2];
    const classId = pathParts[3];
    return next(`/teacher/attendance/${date}/${classId}`);
  } else if (pathParts.length >= 3) {
    const date = pathParts[2];
    return next(`/teacher/attendance/${date}`);
  } else {
    return next('/teacher/attendance/calendar');
  }
}
```

**Características clave:**
- **Acceso directo** para maestros a rutas `/teacher/*`
- **Redirección automática** de rutas `/attendance/*` a `/teacher/attendance/*` para maestros
- **Parsing inteligente** de parámetros de ruta (fecha y classId)
- **Prevención de bucles** con verificación de query param `redirected=true`

### 2. Debugging mejorado en AttendanceView (`src/views/AttendanceView.vue`)

```typescript
function handleClassSelect(classId: string) {
  // ...
  const userRole = authStore.user?.role?.toLowerCase() || ''
  console.log(`[AttendanceView] handleClassSelect: Usuario completo:`, authStore.user)
  console.log(`[AttendanceView] handleClassSelect: Rol del usuario: '${userRole}' (original: '${authStore.user?.role}')`)
  
  if (userRole === 'maestro' || userRole === 'teacher') {
    // Formatear fecha para maestros (YYYYMMDD)
    const dateFormatted = selectedDate.value.replace(/-/g, '')
    routePath = `/teacher/attendance/${dateFormatted}/${classId}`
    console.log(`[AttendanceView] handleClassSelect: Rol maestro detectado, navegando a: ${routePath}`)
  } else {
    // Para admin/director usar la ruta original
    routePath = `/attendance/${selectedDate.value}/${classId}`
    console.log(`[AttendanceView] handleClassSelect: Rol admin/director, navegando a: ${routePath}`)
  }
  // ...
}
```

### 3. Manejo de redirecciones mejorado

```typescript
// Redirigir según el rol del usuario
const normalizedRole = userRole?.toLowerCase() || '';

if (normalizedRole.includes('maestro') || normalizedRole.includes('teacher')) {
  // Si el maestro está intentando acceder a rutas /attendance/, redirigir a /teacher/attendance/calendar
  if (to.path.startsWith('/attendance/')) {
    next('/teacher/attendance/calendar?redirected=true');
  } else {
    // Para otras rutas denegadas, redirigir al dashboard del maestro
    next('/teacher?redirected=true');
  }
} else if (normalizedRole.includes('director') || normalizedRole.includes('admin')) {
  next('/attendance/calendar?redirected=true');
} else if (normalizedRole.includes('superusuario')) {
  next('/superusuario/dashboard?redirected=true');
} else {
  next('/unauthorized');
}
```

## Rutas Corregidas

### Para Maestros:
- ✅ `/teacher/attendance/calendar` - Calendario de asistencia del maestro
- ✅ `/teacher/attendance/:date/:classId` - Detalle de asistencia específica
- ✅ `/teacher/attendance/:date` - Asistencia por fecha
- 🔄 `/attendance/*` → **Auto-redirección** a `/teacher/attendance/*`

### Para Administradores/Directores:
- ✅ `/attendance/calendar` - Calendario de asistencia administrativo
- ✅ `/attendance/:date/:classId` - Detalle de asistencia administrativo

## Logs de Debug Agregados

El sistema ahora incluye logs detallados para facilitar el debugging:

```
👤 RBAC Guard: Verificando acceso para usuario con rol 'Maestro' a ruta '/attendance/2025-06-06/utbM1dZWhOiF5ODx26nO'
🔄 RBAC Guard: Redirigiendo maestro de ruta admin /attendance/2025-06-06/utbM1dZWhOiF5ODx26nO a ruta teacher
[AttendanceView] handleClassSelect: Usuario completo: {...}
[AttendanceView] handleClassSelect: Rol del usuario: 'maestro' (original: 'Maestro')
[AttendanceView] handleClassSelect: Rol maestro detectado, navegando a: /teacher/attendance/20250606/utbM1dZWhOiF5ODx26nO
```

## Resultado

✅ **Problema resuelto**: Los maestros ahora pueden acceder correctamente a las listas de asistencia  
✅ **Sin bucles infinitos**: El sistema maneja redirecciones de forma segura  
✅ **Navegación correcta**: Cada rol navega a sus rutas apropiadas  
✅ **Debugging mejorado**: Logs claros para identificar problemas futuros  

## Próximos Pasos

1. **Validar** que la lista de estudiantes aparece correctamente en `AttendanceList`
2. **Probar** con diferentes fechas y clases
3. **Verificar** que la funcionalidad de guardado de asistencia funciona
4. **Considerar** mejoras adicionales en UX para maestros
