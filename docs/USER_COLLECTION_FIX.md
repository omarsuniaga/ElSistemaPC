# Corrección de Colecciones de Usuarios - Firestore

## 🐛 Problema Identificado

Al intentar hacer login con los usuarios de prueba creados, aparecía el error:
```
Error de login: Error: No se encontró el perfil del usuario
```

## 🔍 Diagnóstico

**Causa raíz:** Inconsistencia en los nombres de colecciones de Firestore:

- **Script de creación:** Guardaba usuarios en colección `'users'` (minúsculas)
- **Sistema de autenticación:** Buscaba usuarios en colección `'USERS'` (mayúsculas)

**Ubicación del problema:**
- `scripts/create-test-users.mjs` línea 135: `doc(db, 'users', user.uid)`
- `src/stores/auth.ts` línea 86: `doc(db, 'USERS', userCredential.user.uid)`

## 🛠️ Solución Implementada

### 1. Script de Corrección
Creado `scripts/fix-test-users.mjs` que:
- Busca todos los documentos con `isTestUser: true` en colección `'users'`
- Copia cada documento a la colección `'USERS'`
- Elimina el documento original de `'users'`

### 2. Actualización del Script Original
Actualizado `scripts/create-test-users.mjs`:
```javascript
// Antes
await setDoc(doc(db, 'users', user.uid), userDoc);

// Después  
await setDoc(doc(db, 'USERS', user.uid), userDoc);
```

## 📊 Resultado de la Corrección

```
✅ Encontrados 4 documentos en colección "users"
🔄 Moviendo usuario superusuario@test.com de "users" a "USERS"...
✅ Documento creado en "USERS" para superusuario@test.com
🗑️ Documento eliminado de "users" para superusuario@test.com
[...repetido para los 4 usuarios...]

✅ Todos los usuarios de prueba han sido corregidos!
```

## 🧪 Verificación

Los usuarios de prueba ahora deben funcionar correctamente:

- **Superusuario:** `superusuario@test.com` / `Test123456!`
- **Director:** `director@test.com` / `Test123456!`
- **Admin:** `admin@test.com` / `Test123456!`
- **Maestro:** `maestro@test.com` / `Test123456!`

## 🔒 Estado Actual

- ✅ Usuarios en Firebase Auth: Creados correctamente
- ✅ Documentos en Firestore: Ubicados en colección `'USERS'`
- ✅ Sistema de autenticación: Busca en colección `'USERS'`
- ✅ Consistencia: Nombres de colección coinciden

## 📝 Lecciones Aprendidas

1. **Nomenclatura consistente:** Verificar que todos los scripts y código usen la misma nomenclatura para colecciones
2. **Validación temprana:** Probar el login inmediatamente después de crear usuarios de prueba
3. **Documentación:** Mantener registro de las convenciones de nomenclatura del proyecto

## 🚀 Próximos Pasos

Con esta corrección, los usuarios de prueba están listos para:
1. Login exitoso en la aplicación
2. Verificación de roles y permisos
3. Testing de funcionalidades específicas por rol
4. Validación de redirecciones correctas
