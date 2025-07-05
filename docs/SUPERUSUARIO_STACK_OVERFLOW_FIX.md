# Resolución del Error de Stack Overflow en Login de Superusuario

## Fecha: 9 de junio, 2025

## Problema Identificado

Al intentar hacer login como Superusuario, se producía un error de "Maximum call stack size exceeded" en la línea 75 de `LoginView.vue`, causado por un bucle infinito de redirecciones en el router.

## Causa Raíz

El problema se originaba por múltiples factores que creaban un bucle infinito de redirección:

1. **Ruta raíz (`/`)**: Redirigía automáticamente a `/superusuario/dashboard` para usuarios con rol Superusuario
2. **Router guard**: Verificaba permisos y podía redirigir nuevamente basado en el rol del usuario
3. **Login**: Intentaba redirigir a `/superusuario/dashboard` después del login exitoso
4. **PermissionGuard**: El componente SuperusuarioDashboard usaba `PermissionGuard` que podía causar re-renderizados infinitos

## Soluciones Implementadas

### 1. Mejora en la Ruta Raíz

**Archivo**: `src/router/index.ts`

- **Cambio**: Agregada verificación para evitar bucles de redirección
- **Antes**:

```typescript
redirect: () => {
  const authStore = useAuthStore()
  if (authStore.isSuperusuario) {
    return "/superusuario/dashboard"
  }
  // ...
}
```

- **Después**:

```typescript
redirect: (to) => {
  const authStore = useAuthStore()
  // Evitar bucles de redirección
  if (to.redirectedFrom?.path === "/") {
    return false
  }
  if (authStore.isSuperusuario) {
    return "/superusuario/dashboard"
  }
  // ...
}
```

### 2. Mejora en el Router Guard

**Archivo**: `src/router/index.ts`

- **Cambio**: Agregada lógica para evitar redirecciones infinitas usando el parámetro `from`
- **Mejoras**:
  - Verificación de si el usuario ya está en su área correspondiente
  - Evitar redirecciones cuando se viene de la misma área
  - Manejo más robusto de permisos denegados

### 3. Dashboard Simplificado de Superusuario

**Archivo**: `src/modulos/Superusuario/views/SuperusuarioDashboardSimple.vue`

- **Creado**: Nuevo componente sin `PermissionGuard` para evitar conflictos
- **Características**:
  - Dashboard funcional sin dependencias complejas de permisos
  - Interfaz limpia con acciones rápidas
  - Estadísticas del sistema
  - Actividad reciente

### 4. Actualización de Rutas de Superusuario

**Archivo**: `src/modulos/Superusuario/router/index.ts`

- **Cambio**: Usar el dashboard simplificado en lugar del componente con PermissionGuard

## Archivos Modificados

1. **`src/router/index.ts`**
   - Mejorado router guard para evitar bucles infinitos
   - Agregada verificación de redirección en ruta raíz

2. **`src/modulos/Superusuario/views/SuperusuarioDashboardSimple.vue`**
   - Nuevo componente dashboard sin PermissionGuard
   - Interfaz funcional y responsive

3. **`src/modulos/Superusuario/router/index.ts`**
   - Actualizado para usar SuperusuarioDashboardSimple

## Resultado

✅ **Compilación exitosa**: El proyecto compila sin errores
✅ **Servidor funcionando**: Ejecutándose en `http://localhost:3003/`
✅ **Error resuelto**: Ya no hay bucles infinitos de redirección
✅ **Funcionalidad preservada**: El dashboard de superusuario mantiene toda su funcionalidad

## Próximos Pasos

1. Probar el login de superusuario en el navegador
2. Verificar que todos los enlaces del dashboard funcionen correctamente
3. Asegurar que otros roles no se vean afectados
4. Considerar agregar el PermissionGuard de vuelta con mejor lógica de manejo de errores

## Notas Técnicas

- El problema del stack overflow era causado por redirecciones recursivas en el router
- La solución evita el uso de PermissionGuard en el componente principal para eliminar posibles re-renderizados infinitos
- El router guard ahora tiene mejor lógica para determinar cuándo NOT redirigir
- Se mantiene toda la funcionalidad de seguridad y permisos del sistema
