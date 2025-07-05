# CONFIGURACIÓN INSTITUCIONAL CON FIREBASE FIRESTORE

## Descripción General

Se ha implementado un sistema de configuración institucional que utiliza Firebase Firestore para almacenar y gestionar información global de la institución, como el nombre y logo institucional. Esta configuración se puede usar en toda la aplicación y específicamente en la generación de PDFs.

## Estructura en Firestore

### Colección: `CONFIGURACIÓN`

La colección almacena documentos con la siguiente estructura:

```javascript
{
  title_institucional: "ACADEMIA DE MÚSICA",  // Nombre de la institución
  url_institucional: "https://firebase...",   // URL del logo institucional
  created_at: timestamp,                      // Fecha de creación
  updated_at: timestamp,                      // Última actualización

  // Campos opcionales para futuras expansiones
  theme_color: "#3B82F6",                     // Color principal de la app
  contact_email: "info@academia.com",         // Email de contacto
  contact_phone: "+1234567890",               // Teléfono de contacto
  address: "Calle Principal 123",             // Dirección física
  facebook_url: "https://facebook.com/...",   // URL de Facebook
  instagram_url: "https://instagram.com/...", // URL de Instagram
  website_url: "https://academia.com"         // Sitio web oficial
}
```

## Componentes Implementados

### 1. Store: `useInstitutionalConfigStore`

**Ubicación:** `src/modulos/Admin/store/institutionalConfig.ts`

**Funciones principales:**

- `loadConfig()`: Carga la configuración desde Firestore
- `updateTitle(newTitle)`: Actualiza el título institucional
- `uploadLogo(file)`: Sube un nuevo logo a Firebase Storage
- `removeLogo()`: Elimina el logo actual
- `updateConfig(config)`: Actualiza configuración completa
- `resetConfig()`: Restaura configuración por defecto

**Estado reactivo:**

- `institutionalTitle`: Título de la institución
- `institutionalLogoUrl`: URL del logo institucional
- `hasLogo`: Booleano que indica si hay logo
- `isLoading`: Estado de carga
- `isUploading`: Estado de subida de archivos

### 2. Componente: `InstitutionalConfigPanel`

**Ubicación:** `src/modulos/Admin/components/InstitutionalConfigPanel.vue`

**Características:**

- Interfaz visual para configurar el título institucional
- Upload de logo con drag & drop
- Vista previa del logo actual
- Validación de archivos (tamaño máximo 5MB)
- Feedback visual con toasts de éxito/error
- Funcionalidad de resetear a valores por defecto

### 3. Integración en PDFGeneratorModal

**Mejoras implementadas:**

- Uso automático del título institucional en PDFs
- Uso automático del logo institucional en PDFs
- Opción de logo temporal que sobrescribe el institucional
- Información visual de la configuración actual
- Carga automática de la configuración al inicializar

## Flujo de Trabajo

### Configuración Inicial

1. Al acceder por primera vez, se crea automáticamente un documento con valores por defecto
2. El administrador puede modificar el título y subir un logo desde el panel de configuración
3. Los cambios se guardan automáticamente en Firestore

### Generación de PDFs

1. Al abrir el modal de PDFs, se carga automáticamente la configuración institucional
2. El título y logo se muestran en la vista previa de configuración
3. El usuario puede subir un logo temporal para sobrescribir el institucional solo para ese PDF
4. El PDF se genera usando la configuración institucional o la temporal si se especifica

### Gestión de Archivos

- Los logos se almacenan en Firebase Storage bajo la ruta `institutional/`
- Se eliminan automáticamente los logos anteriores al subir uno nuevo
- Los archivos temporales solo existen en memoria durante la sesión

## Beneficios

### 1. Centralización

- Configuración única para toda la aplicación
- Consistencia en documentos y interfaces

### 2. Flexibilidad

- Logo temporal para casos especiales
- Configuración expandible para futuras necesidades

### 3. Facilidad de Uso

- Interfaz intuitiva para administradores
- Cambios en tiempo real
- Validaciones automáticas

### 4. Escalabilidad

- Preparado para agregar más configuraciones
- Estructura extensible para múltiples instituciones (futuro)

## Instalación y Uso

### Paso 1: Agregar el Store al Proyecto

```javascript
// En el archivo donde uses la configuración
import {useInstitutionalConfigStore} from "@/modulos/Admin/store/institutionalConfig"

const configStore = useInstitutionalConfigStore()
await configStore.loadConfig()

// Usar los valores
const title = configStore.institutionalTitle
const logoUrl = configStore.institutionalLogoUrl
```

### Paso 2: Agregar el Panel de Configuración

```vue
<template>
  <InstitutionalConfigPanel />
</template>

<script setup>
import InstitutionalConfigPanel from "@/modulos/Admin/components/InstitutionalConfigPanel.vue"
</script>
```

### Paso 3: Integrar en Otros Componentes

```javascript
// En cualquier componente que necesite la configuración institucional
const institutionalConfig = useInstitutionalConfigStore()

onMounted(async () => {
  await institutionalConfig.loadConfig()
})

// Usar en plantillas
const headerTitle = computed(() => institutionalConfig.institutionalTitle)
```

## Futuras Expansiones

### Configuraciones Adicionales

- Colores temáticos de la aplicación
- Información de contacto
- Redes sociales
- Configuraciones de email
- Formatos de documentos

### Multi-tenancy

- Soporte para múltiples instituciones
- Configuraciones por cliente/tenant
- Aislamiento de datos

### Configuraciones Avanzadas

- Plantillas de documentos personalizables
- Configuraciones de notificaciones
- Integraciones con servicios externos

## Seguridad

### Reglas de Firestore Recomendadas

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Configuración institucional - solo administradores
    match /CONFIGURACIÓN/{configId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      request.auth.token.role == 'admin' ||
                      request.auth.token.role == 'superadmin';
    }
  }
}
```

### Reglas de Storage

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Logos institucionales
    match /institutional/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                      request.auth.token.role == 'admin' ||
                      request.auth.token.role == 'superadmin';
      allow delete: if request.auth != null &&
                       request.auth.token.role == 'admin' ||
                       request.auth.token.role == 'superadmin';
    }
  }
}
```

## Troubleshooting

### Error: "No se puede cargar la configuración"

- Verificar conexión a Firebase
- Verificar permisos de Firestore
- Verificar que existe la colección CONFIGURACIÓN

### Error: "No se puede subir el logo"

- Verificar permisos de Storage
- Verificar tamaño del archivo (máximo 5MB)
- Verificar formato del archivo (solo imágenes)

### PDF sin logo institucional

- Verificar que la configuración se ha cargado
- Verificar permisos de acceso al archivo en Storage
- Verificar que la URL del logo es válida

## Conclusión

Esta implementación proporciona una base sólida para la gestión de configuraciones institucionales, mejorando la profesionalidad y consistencia de los documentos generados mientras mantiene la flexibilidad para personalizaciones específicas.
