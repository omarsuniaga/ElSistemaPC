# Propuesta de Sistema RBAC Dinámico

## Problema Actual

El sistema actual tiene roles hardcodeados en las rutas (`allowedRoles: ['Director', 'Admin', 'Maestro']`), lo que presenta varias limitaciones:

1. **Falta de flexibilidad**: Los roles están fijos en el código
2. **Dificultad de mantenimiento**: Cada cambio requiere modificar código
3. **Escalabilidad limitada**: Agregar nuevos roles o permisos es complejo
4. **Falta de granularidad**: No hay control fino sobre componentes individuales

## Solución Propuesta: Sistema RBAC Dinámico

### 🏗️ Arquitectura del Sistema

#### 1. **Servicio RBAC Central** (`rbacService.ts`)

```typescript
// Gestiona roles, permisos, módulos y asignaciones
class RBACService {
  // Métodos para roles, permisos, módulos y usuarios
  async checkUserModuleAccess(userId: string, moduleId: string): Promise<boolean>
  async checkUserRouteAccess(userId: string, routePath: string): Promise<boolean>
  async checkUserPermission(userId: string, permission: string): Promise<boolean>
}
```

#### 2. **Composable de RBAC** (`useRBAC.ts`)

```typescript
// Proporciona reactividad y métodos para componentes Vue
export function useRBAC() {
  const hasPermission = async (permissionName: string): Promise<boolean>
  const hasModuleAccess = async (moduleId: string): Promise<boolean>
  const canAccessComponent = (componentId: string, moduleId: string): boolean
}
```

#### 3. **Componente de Protección Dinámico** (`DynamicPermissionGuard.vue`)

```vue
<!-- Reemplaza al PermissionGuard estático -->
<DynamicPermissionGuard
  :permissions="['users:write']"
  :roles="['admin']"
  :moduleId="'users'"
  :componentId="'user-form'"
>
  <UserForm />
</DynamicPermissionGuard>
```

#### 4. **Guard de Router Dinámico** (`rbacGuard.ts`)

```typescript
// Verifica acceso a rutas de forma dinámica
export async function rbacGuard(to, from, next) {
  const hasAccess = await rbacService.checkUserRouteAccess(user.uid, to.path)
}
```

### 🎛️ Interface de Gestión (SuperUsuario)

#### **Vista de Gestión RBAC** (`RBACManagement.vue`)

**4 Tabs principales:**

1. **👥 Roles**
   - Crear/editar/eliminar roles
   - Asignar permisos a roles
   - Activar/desactivar roles

2. **🔑 Permisos**
   - Crear permisos granulares por módulo
   - Definir acciones (read, write, delete, execute)
   - Especificar recursos y componentes

3. **📁 Módulos**
   - Configurar acceso por módulo
   - Definir roles permitidos
   - Controlar rutas y componentes

4. **🔗 Asignaciones**
   - Asignar roles a usuarios
   - Ver asignaciones activas
   - Gestionar permisos de usuario

### 🔧 Implementación Práctica

#### **1. Estructura de Datos en Firestore**

```typescript
// Colección: rbac_roles
{
  id: "role_admin",
  name: "Administrador",
  description: "Control total del sistema",
  permissions: ["users:write", "reports:read", "system:manage"],
  isActive: true
}

// Colección: rbac_permissions
{
  id: "users_write",
  name: "Gestionar Usuarios",
  module: "Users",
  action: "write",
  resource: "users",
  component: "UserForm"
}

// Colección: rbac_module_access
{
  moduleId: "students",
  moduleName: "Estudiantes",
  isEnabled: true,
  allowedRoles: ["admin", "teacher"],
  components: [
    {
      componentId: "student-form",
      isVisible: true,
      allowedRoles: ["admin"],
      permissions: ["students:write"]
    }
  ],
  routes: [
    {
      routePath: "/students",
      isAccessible: true,
      allowedRoles: ["admin", "teacher"],
      permissions: ["students:read"]
    }
  ]
}
```

#### **2. Uso en Componentes**

```vue
<template>
  <div>
    <!-- Control de acceso a nivel de módulo -->
    <DynamicPermissionGuard moduleId="students">
      <StudentsModule />
    </DynamicPermissionGuard>

    <!-- Control granular por componente -->
    <DynamicPermissionGuard
      :permissions="['students:write']"
      componentId="student-form"
      moduleId="students"
    >
      <StudentForm />
    </DynamicPermissionGuard>

    <!-- Control por roles específicos -->
    <DynamicPermissionGuard :roles="['admin', 'director']">
      <AdminPanel />
    </DynamicPermissionGuard>
  </div>
</template>
```

#### **3. Router Dinámico**

```typescript
// En lugar de:
meta: {
  allowedRoles: ["Director", "Admin"]
}

// Usamos:
meta: {
  requiresRBAC: true
}

// Y el guard verifica dinámicamente:
beforeEnter: rbacGuard
```

### 🚀 Ventajas del Sistema RBAC

#### **1. Flexibilidad Total**

- Roles y permisos se configuran desde la interfaz
- No requiere modificar código para cambios
- Permisos granulares por componente

#### **2. Escalabilidad**

- Fácil agregar nuevos módulos
- Roles ilimitados
- Permisos específicos por función

#### **3. Seguridad Mejorada**

- Control fino de acceso
- Auditoría completa
- Principio de menor privilegio

#### **4. Mantenimiento Simplificado**

- Configuración centralizada
- Interface visual para gestión
- Cambios en tiempo real

### 📋 Plan de Implementación

#### **Fase 1: Fundamentos** ✅

- [x] Crear servicio RBAC
- [x] Implementar composable useRBAC
- [x] Crear DynamicPermissionGuard
- [x] Desarrollar RBACManagement view

#### **Fase 2: Integración**

- [ ] Implementar guards dinámicos en router
- [ ] Migrar rutas existentes
- [ ] Crear datos iniciales en Firestore

#### **Fase 3: Migración de Módulos**

- [ ] Migrar módulo Students
- [ ] Migrar módulo Teachers
- [ ] Migrar módulo Instruments
- [ ] Migrar módulo Montaje

#### **Fase 4: Funcionalidades Avanzadas**

- [ ] Crear modales de gestión
- [ ] Implementar auditoría
- [ ] Agregar importación/exportación de configuraciones
- [ ] Sistema de plantillas de roles

### 🎯 Resultado Final

**El SuperUsuario podrá:**

- ✅ Crear roles personalizados
- ✅ Definir permisos granulares
- ✅ Controlar acceso por módulo/componente
- ✅ Asignar roles dinámicamente
- ✅ Ver toda la actividad en tiempo real

**Los usuarios verán:**

- ✅ Solo los módulos permitidos
- ✅ Solo los componentes autorizados
- ✅ Interfaces adaptadas a sus permisos
- ✅ Mensajes claros sobre restricciones

### 🛡️ Seguridad

- **Validación doble**: Cliente + servidor
- **Caché inteligente**: Rendimiento optimizado
- **Logs de auditoría**: Trazabilidad completa
- **Principio de menor privilegio**: Acceso mínimo necesario

Esta solución convierte el sistema estático actual en una plataforma completamente configurable y escalable, donde el SuperUsuario tiene control total sobre quién puede acceder a qué, cuándo y cómo.
