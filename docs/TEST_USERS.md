# Usuarios de Prueba - Sistema de Gestión Musical

## 📋 Credenciales de Acceso

Los siguientes usuarios de prueba han sido creados para testear el sistema de roles y permisos:

### 🦸 Superusuario
- **Email:** `superusuario@test.com`
- **Contraseña:** `Test123456!`
- **Rol:** Superusuario
- **Acceso:** Completo al sistema
- **Dashboard:** `/superusuario/dashboard`

### 👨‍💼 Director Académico
- **Email:** `director@test.com`
- **Contraseña:** `Test123456!`
- **Rol:** Director
- **Permisos:** 
  - Gestión de maestros
  - Gestión de estudiantes
  - Ver reportes
  - Gestión de clases
- **Dashboard:** `/dashboard`

### 🔧 Administrador
- **Email:** `admin@test.com`
- **Contraseña:** `Test123456!`
- **Rol:** Admin
- **Permisos:**
  - Gestión del sistema
  - Ver analíticas
  - Gestión de usuarios
  - Respaldo de datos
- **Dashboard:** `/dashboard`

### 🎵 Maestro
- **Email:** `maestro@test.com`
- **Contraseña:** `Test123456!`
- **Rol:** Maestro
- **Especialidades:** Piano, Teoría Musical
- **Permisos:**
  - Gestión de asistencia
  - Ver estudiantes
  - Crear observaciones
- **Dashboard:** `/dashboard`
- **Clases creadas:**
  - Piano Básico - Grupo A (Lunes 14:00-15:30)
  - Teoría Musical Intermedio (Miércoles 16:00-17:00)

## 🧪 Instrucciones de Prueba

1. **Acceder al sistema:**
   - Ve a: http://localhost:3000/login
   - Usa cualquiera de las credenciales anteriores

2. **Probar rutas por rol:**
   - **Superusuario:** Debe acceder a `/superusuario/dashboard`
   - **Otros roles:** Deben acceder a `/dashboard`

3. **Verificar permisos:**
   - Cada usuario debe ver solo las opciones correspondientes a su rol
   - Intentar acceder a rutas no permitidas debe mostrar error de permisos

4. **Probar navegación:**
   - Menú lateral debe mostrar opciones específicas por rol
   - Las redirecciones deben funcionar correctamente

5. **Probar logout:**
   - El logout debe limpiar el estado y redirigir al login
   - No debe haber errores en la consola

## 🏷️ Identificación de Usuarios de Prueba

Todos los usuarios creados tienen la propiedad `isTestUser: true` en Firestore para fácil identificación y posterior limpieza si es necesario.

## 🗑️ Limpieza (Opcional)

Para eliminar los usuarios de prueba después del testing, puedes:

1. **Firebase Console:**
   - Ir a Authentication > Users
   - Eliminar usuarios con emails @test.com

2. **Firestore Console:**
   - Ir a Database > users collection
   - Eliminar documentos donde `isTestUser: true`

3. **Script de limpieza:**
   - Se puede crear un script similar para automatizar la eliminación

## ✅ Casos de Prueba Completados

- [x] Creación de usuarios en Firebase Auth
- [x] Creación de documentos en Firestore (colección 'USERS')
- [x] Asignación de roles y permisos
- [x] Creación de clases de ejemplo para el maestro
- [x] Servidor de desarrollo ejecutándose
- [x] **Corrección de ubicación de datos**: Usuarios movidos de 'users' a 'USERS'

## 🔧 Corrección Aplicada

**Problema detectado:** Los usuarios se guardaron inicialmente en la colección `'users'` pero el sistema de autenticación busca en `'USERS'`.

**Solución:** Se ejecutó un script de corrección que movió todos los documentos de usuarios de prueba de la colección `'users'` a la colección `'USERS'` para que coincida con el sistema de autenticación.

## 🔄 Próximos Pasos

1. Probar login con cada usuario
2. Verificar redirecciones por rol
3. Comprobar acceso a rutas protegidas
4. Validar funcionamiento del sistema de permisos
5. Verificar que logout funciona correctamente
