# 🎨 Sistema de Configuración de Marca

## Descripción General

El sistema de configuración de marca permite a los superusuarios personalizar completamente la identidad visual y la información de la aplicación, incluyendo logo, colores, textos y configuración PWA.

## Características Principales

### ✅ **Configuración Completa de Marca**
- **Información Básica**: Nombre, descripción, eslogan, mensaje de bienvenida
- **Logo y Favicon**: Subida de archivos con soporte para múltiples formatos
- **Colores de Marca**: Paleta personalizable con vista previa en tiempo real
- **Información de Contacto**: Teléfono, email, dirección, sitio web, redes sociales
- **Configuración PWA**: Configuración para aplicación móvil
- **CSS Personalizado**: Estilos adicionales para personalización avanzada

### ✅ **Vista Previa en Tiempo Real**
- Mockup interactivo que muestra los cambios instantáneamente
- Aplicación automática de colores y estilos
- Previsualización de logo y textos

### ✅ **Gestión Avanzada**
- Importar/exportar configuraciones en formato JSON
- Paletas de colores predefinidas
- Reset a configuración por defecto
- Validación de archivos y datos

### ✅ **Integración Global**
- Plugin de Vue para inicialización automática
- Composable para uso en cualquier componente
- Aplicación automática en headers y footers
- Sincronización con meta tags y PWA

## Estructura del Sistema

```
src/
├── stores/
│   └── brandingStore.ts          # Store principal de Pinia
├── composables/
│   └── useBranding.ts           # Composable para uso global
├── plugins/
│   └── branding.ts              # Plugin de Vue
├── components/
│   ├── admin/
│   │   └── BrandingManager.vue  # Panel de administración
│   └── common/
│       ├── DynamicHeader.vue    # Header personalizable
│       └── DynamicFooter.vue    # Footer personalizable
└── modulos/Superusuario/
    └── router/index.ts          # Rutas de superusuario
```

## Uso del Sistema

### 1. **Acceso para Superusuarios**
```
/superusuario/branding
```
Solo usuarios con rol "Superusuario" pueden acceder.

### 2. **Uso en Componentes**
```vue
<script setup>
import { useBranding } from '@/composables/useBranding'

const { 
  appTitle, 
  appLogo, 
  brandColors, 
  applyBranding 
} = useBranding()
</script>

<template>
  <div :style="{ color: brandColors.primary }">
    <h1>{{ appTitle }}</h1>
    <img :src="appLogo.url" :alt="appLogo.alt" />
  </div>
</template>
```

### 3. **Header y Footer Dinámicos**
```vue
<template>
  <DynamicHeader 
    title="Mi Página"
    :show-logo="true"
    :show-tagline="true"
  >
    <template #actions>
      <!-- Acciones personalizadas -->
    </template>
  </DynamicHeader>
  
  <main>
    <!-- Contenido -->
  </main>
  
  <DynamicFooter 
    :show-contact="true"
    :show-social="true"
    :quick-links="quickLinks"
  />
</template>
```

## Configuración Inicial

### 1. **Estructura de Datos**
```typescript
interface BrandingConfig {
  appName: string
  tagline: string
  appDescription: string
  logo: {
    url: string
    alt: string
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  contact: {
    phone: string
    email: string
    address: string
    website: string
    socialMedia: {
      facebook: string
      instagram: string
      twitter: string
      youtube: string
    }
  }
  pwa: {
    name: string
    shortName: string
    themeColor: string
  }
  advanced: {
    showPoweredBy: boolean
    footerText: string
    welcomeMessage: string
    customCSS: string
  }
}
```

### 2. **Valores por Defecto**
```typescript
const defaultConfig: BrandingConfig = {
  appName: 'Music Academy Manager',
  tagline: 'Transformando la educación musical',
  appDescription: 'Sistema integral de gestión para academias musicales...',
  // ... resto de configuración
}
```

## Características Técnicas

### 🔧 **Store de Pinia**
- Estado reactivo global
- Persistencia automática en Firestore
- Métodos para CRUD completo
- Validación de datos

### 🎨 **Variables CSS Dinámicas**
```css
:root {
  --brand-primary: #1976d2;
  --brand-secondary: #424242;
  --brand-accent: #82b1ff;
  --brand-background: #fafafa;
}
```

### 📱 **Integración PWA**
- Actualización automática del manifest
- Configuración de theme-color
- Meta tags dinámicas

### 🖼️ **Gestión de Archivos**
- Subida a Firebase Storage
- Optimización automática
- Validación de tamaño y formato
- URLs seguras y accesibles

## API del Store

### Métodos Principales
```typescript
// Cargar configuración
await loadBrandingConfig()

// Guardar cambios
await saveBrandingConfig()

// Subir logo
const url = await uploadLogo(file)

// Exportar configuración
await exportConfig()

// Importar configuración
await importConfig(file)

// Reset a defecto
await resetToDefault()

// Vista previa
previewChanges(tempConfig)
```

### Computed Properties
```typescript
// CSS variables reactivas
const cssVariables = computed(() => ({
  '--brand-primary': config.value.colors.primary,
  '--brand-secondary': config.value.colors.secondary,
  // ...
}))

// Estado de carga
const isLoading = ref(false)
const hasChanges = ref(false)
const isConfigLoaded = ref(false)
```

## Validaciones y Seguridad

### ✅ **Validaciones de Archivos**
- Tamaño máximo: 5MB
- Formatos permitidos: JPG, PNG, SVG, WebP
- Validación de MIME type

### ✅ **Validaciones de Datos**
- URLs válidas
- Colores en formato hexadecimal
- Longitud mínima/máxima de textos
- Sanitización de CSS personalizado

### ✅ **Seguridad**
- Solo superusuarios pueden modificar
- Validación en Firebase Rules
- Escape de contenido HTML
- Límites de upload

## Ejemplos de Uso

### Aplicar Branding al Cargar Página
```typescript
import { useBranding } from '@/composables/useBranding'

export default {
  async mounted() {
    const { applyBranding } = useBranding()
    await applyBranding('Título de la Página')
  }
}
```

### Usar Colores Dinámicos
```vue
<template>
  <div class="custom-component" :style="componentStyles">
    <!-- Contenido -->
  </div>
</template>

<script setup>
const { brandColors, getCSSVariables } = useBranding()

const componentStyles = computed(() => ({
  backgroundColor: brandColors.value.primary,
  color: brandColors.value.background,
  ...getCSSVariables()
}))
</script>
```

### Mostrar Información de Contacto
```vue
<template>
  <div class="contact-info">
    <h3>Contáctanos</h3>
    <p v-if="contactInfo.phone">
      📞 {{ contactInfo.phone }}
    </p>
    <p v-if="contactInfo.email">
      ✉️ {{ contactInfo.email }}
    </p>
  </div>
</template>

<script setup>
const { contactInfo } = useBranding()
</script>
```

## Paletas de Colores Predefinidas

### 🎨 **Paletas Disponibles**
1. **Azul Profesional**: #1976d2, #424242, #82b1ff, #fafafa
2. **Verde Natura**: #388e3c, #2e7d32, #81c784, #f1f8e9
3. **Púrpura Elegante**: #7b1fa2, #4a148c, #ba68c8, #f3e5f5
4. **Naranja Vibrante**: #f57c00, #e65100, #ffb74d, #fff3e0
5. **Rojo Passion**: #d32f2f, #b71c1c, #e57373, #ffebee

## Troubleshooting

### ❗ **Problemas Comunes**

**1. Logo no se muestra**
- Verificar que la URL sea válida
- Comprobar permisos de Firebase Storage
- Validar formato de imagen

**2. Colores no se aplican**
- Verificar formato hexadecimal
- Comprobar que el CSS esté cargando
- Revisar especificidad de CSS

**3. Configuración no se guarda**
- Verificar permisos de usuario (Superusuario)
- Comprobar conexión a Firestore
- Revisar reglas de Firebase

### 🔧 **Debug**
```javascript
// En consola del navegador
window.debugBranding = () => {
  console.log('Branding Config:', useBrandingStore().config)
  console.log('CSS Variables:', useBrandingStore().cssVariables)
}
```

## Roadmap Futuro

### 🚀 **Próximas Características**
- [ ] Editor visual de temas
- [ ] Modo oscuro automático
- [ ] Plantillas predefinidas
- [ ] Sincronización con redes sociales
- [ ] API externa para configuración
- [ ] Historial de cambios
- [ ] Preview en dispositivos móviles

---

**Desarrollado con ❤️ para Music Academy Manager**
