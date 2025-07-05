# Script para Actualizar Configuración RBAC - Acceso de Maestros

## Problema Identificado

Los maestros están siendo bloqueados por el sistema RBAC al intentar acceder a:

- `/students` (Listado de estudiantes)
- `/dashboard` (Dashboard principal)

## Solución Implementada

### 1. Configuración de Navegación Actualizada

Se agregaron las siguientes rutas en la configuración RBAC para maestros:

```typescript
// Rutas principales para maestros
{
  id: 'dashboard-maestro',
  name: 'Dashboard',
  path: '/dashboard',
  roles: ['Maestro', 'Maestro Avanzado']
},
{
  id: 'teacher-dashboard-maestro',
  name: 'Dashboard Maestro',
  path: '/teacher',
  roles: ['Maestro', 'Maestro Avanzado']
},
{
  id: 'estudiantes-maestro',
  name: 'Estudiantes',
  path: '/students',
  roles: ['Maestro', 'Maestro Avanzado']
},
{
  id: 'asistencia-maestro',
  name: 'Asistencia',
  path: '/asistencia',
  roles: ['Maestro', 'Maestro Avanzado']
},
{
  id: 'teacher-attendance-maestro',
  name: 'Asistencia Maestro',
  path: '/teacher/attendance',
  roles: ['Maestro', 'Maestro Avanzado']
}
```

### 2. Pasos para Configurar desde Superusuario

Si necesitas hacer esto desde la interfaz de superusuario:

#### A) Acceder al Panel de Superusuario:

1. Inicia sesión con una cuenta de **Superusuario**
2. Ve a `/superusuario/dashboard`

#### B) Configurar Navegación:

1. Ve a **"Config. Navegación"** (`/superusuario/navigation`)
2. Busca los items de navegación para rol **"Maestro"**
3. Asegúrate de que estos elementos estén **activos**:
   - Dashboard (`/dashboard`)
   - Dashboard Maestro (`/teacher`)
   - Estudiantes (`/students`)
   - Asistencia (`/asistencia`)
   - Asistencia Maestro (`/teacher/attendance`)

#### C) Verificar Permisos:

1. Ve a **"Gestión RBAC"** (`/superusuario/rbac`)
2. Edita el rol **"Maestro"**
3. Asegúrate de que tenga estos permisos:
   - ✅ Ver Estudiantes
   - ✅ Dashboard Maestro
   - ✅ Ver Asistencia
   - ✅ Crear Asistencia
   - ✅ Editar Asistencia

### 3. Comandos para Forzar Actualización

Si necesitas forzar la actualización desde código:

```javascript
// En la consola del navegador (F12)
localStorage.removeItem("rbac-config")
localStorage.removeItem("navigation-config")
window.location.reload()
```

### 4. Verificar que Funciona

Después de la configuración:

1. **Cierra sesión** del maestro
2. **Inicia sesión nuevamente**
3. Verifica que en el menú aparezca **"Estudiantes"**
4. Intenta acceder a `/students`
5. Debe poder ver el listado completo de estudiantes

## Archivos Modificados

- `src/services/rbac/rbacPersistenceService.ts`
- `src/services/navigation/navigationService.ts`

## Rutas que Ahora Funcionan para Maestros

✅ `/dashboard` - Dashboard principal  
✅ `/teacher` - Dashboard específico de maestros  
✅ `/students` - Listado de estudiantes  
✅ `/students/:id` - Perfil de estudiante  
✅ `/asistencia` - Sistema de asistencia  
✅ `/teacher/attendance` - Asistencia específica de maestros

## Estado

✅ **COMPLETADO** - Configuración RBAC actualizada para maestros
