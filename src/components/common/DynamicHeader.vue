<!-- src/components/common/DynamicHeader.vue -->
<template>
  <ion-header class="dynamic-header">
    <ion-toolbar :style="headerStyles">
      <!-- Logo y título -->
      <div slot="start" class="header-brand">
        <img
          v-if="appLogo.url && showLogo"
          :src="appLogo.url"
          :alt="appLogo.alt"
          class="header-logo"
          @error="onLogoError"
        />
        <div class="header-title-section">
          <ion-title class="header-title">
            {{ displayTitle }}
          </ion-title>
          <p v-if="showTagline && appTagline" class="header-tagline">
            {{ appTagline }}
          </p>
        </div>
      </div>

      <!-- Slot para contenido personalizado del centro -->
      <div slot="start" class="header-center">
        <slot name="center" />
      </div>

      <!-- Acciones del header -->
      <ion-buttons slot="end" class="header-actions">
        <!-- Notificaciones -->
        <slot name="notifications" />

        <!-- Menú de usuario -->
        <slot name="user-menu" />

        <!-- Acciones adicionales -->
        <slot name="actions" />
      </ion-buttons>
    </ion-toolbar>

    <!-- Barra de progreso opcional -->
    <ion-progress-bar v-if="showProgress" :value="progressValue" :color="progressColor" />
  </ion-header>
</template>

<script setup lang="ts">
import {computed, ref} from "vue"
import {IonHeader, IonToolbar, IonTitle, IonButtons, IonProgressBar} from "@ionic/vue"
import {useBranding} from "@/composables/useBranding"

interface Props {
  title?: string
  showLogo?: boolean
  showTagline?: boolean
  showProgress?: boolean
  progressValue?: number
  progressColor?: string
  customStyles?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  showLogo: true,
  showTagline: false,
  showProgress: false,
  progressValue: 0,
  progressColor: "primary",
  customStyles: () => ({}),
})

// Branding composable
const {appTitle, appTagline, appLogo, brandColors, getCSSVariables} = useBranding()

// Estado local
const logoError = ref(false)

// Título a mostrar
const displayTitle = computed(() => props.title || appTitle.value)

// Estilos dinámicos del header
const headerStyles = computed(() => {
  const baseStyles = {
    "--background": brandColors.value.primary,
    "--color": getContrastColor(brandColors.value.primary),
    "--border-color": brandColors.value.primary,
    ...getCSSVariables(),
  }

  return {
    ...baseStyles,
    ...props.customStyles,
  }
})

// Manejar error de carga del logo
function onLogoError() {
  logoError.value = true
}

// Calcular color de contraste para texto
function getContrastColor(hexColor: string): string {
  // Convertir hex a RGB
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Calcular luminancia
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Retornar blanco o negro según la luminancia
  return luminance > 0.5 ? "#000000" : "#ffffff"
}

// Exponer métodos si es necesario
defineExpose({
  headerStyles,
  displayTitle,
})
</script>

<style scoped>
.dynamic-header {
  --min-height: 60px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  flex: 1;
}

.header-logo {
  height: 40px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.header-logo:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.header-title-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.header-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.header-tagline {
  font-size: 0.85rem;
  margin: 0;
  opacity: 0.9;
  font-weight: 400;
  line-height: 1.1;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-actions {
  padding-right: 8px;
}

/* Animaciones */
@keyframes logoFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.header-logo {
  animation: logoFadeIn 0.5s ease-out;
}

/* Responsivo */
@media (max-width: 768px) {
  .header-brand {
    padding: 8px 12px;
    gap: 8px;
  }

  .header-logo {
    height: 32px;
    max-width: 80px;
  }

  .header-title {
    font-size: 1.2rem;
  }

  .header-tagline {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .header-tagline {
    display: none;
  }

  .header-title {
    font-size: 1.1rem;
  }
}

/* Modo oscuro */
@media (prefers-color-scheme: dark) {
  .header-logo {
    background: rgba(255, 255, 255, 0.15);
  }

  .header-logo:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

/* Estados de carga */
.header-logo[src=""] {
  opacity: 0;
  pointer-events: none;
}

/* Accesibilidad */
.header-logo:focus {
  outline: 2px solid rgba(255, 255, 255, 0.8);
  outline-offset: 2px;
}

/* Efectos de hover para dispositivos táctiles */
@media (hover: hover) {
  .header-brand:hover .header-title {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}
</style>
