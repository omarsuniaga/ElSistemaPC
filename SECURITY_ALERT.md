# 🚨 ALERTA DE SEGURIDAD CRÍTICA

## ⚠️ CREDENCIALES EXPUESTAS DETECTADAS

Se han encontrado credenciales de Firebase hardcodeadas en los siguientes archivos:

1. `src/utils/cli/migrate.ts` - Contiene claves privadas completas
2. Múltiples archivos de scripts con `serviceAccount` configurado

## 🛠️ ACCIONES INMEDIATAS REQUERIDAS:

### 1. **REVOCAR CREDENCIALES**
- Ve a Firebase Console
- Navega a Project Settings > Service Accounts
- Revoca INMEDIATAMENTE la clave de servicio comprometida
- Genera nuevas credenciales

### 2. **LIMPIAR REPOSITORIO**
```bash
# Si esto está en Git, necesitas limpiar el historial
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch src/utils/cli/migrate.ts' \
--prune-empty --tag-name-filter cat -- --all
```

### 3. **CONFIGURAR VARIABLES DE ENTORNO**
- Crear archivo `.env.local` (que NO se suba a Git)
- Mover TODAS las credenciales a variables de entorno
- Actualizar `.gitignore` para incluir archivos de credenciales

### 4. **ACTUALIZAR CÓDIGO**
Reemplazar credenciales hardcodeadas con:
```typescript
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  // ... resto usando variables de entorno
};
```

## ⚡ PRIORIDAD MÁXIMA
Este problema debe resolverse INMEDIATAMENTE antes de continuar con cualquier otro trabajo.
