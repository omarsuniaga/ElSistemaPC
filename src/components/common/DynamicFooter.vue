<!-- src/components/common/DynamicFooter.vue -->
<template>
  <footer class="dynamic-footer" :style="footerStyles">
    <div class="footer-content">
      <!-- Información principal -->
      <div class="footer-main">
        <!-- Logo y nombre -->
        <div class="footer-brand">
          <img
            v-if="appLogo.url && showLogo"
            :src="appLogo.url"
            :alt="appLogo.alt"
            class="footer-logo"
          />
          <div class="footer-brand-text">
            <h3 class="footer-title">{{ appTitle }}</h3>
            <p v-if="appTagline && showTagline" class="footer-tagline">
              {{ appTagline }}
            </p>
          </div>
        </div>

        <!-- Descripción -->
        <div v-if="appDescription && showDescription" class="footer-description">
          <p>{{ appDescription }}</p>
        </div>
      </div>

      <!-- Enlaces y información de contacto -->
      <div class="footer-grid">
        <!-- Información de contacto -->
        <div v-if="contactInfo && showContact" class="footer-section">
          <h4 class="footer-section-title">Contacto</h4>
          <div class="footer-contact">
            <div v-if="contactInfo.phone" class="contact-item">
              <ion-icon :icon="callOutline" />
              <a :href="`tel:${contactInfo.phone}`">{{ contactInfo.phone }}</a>
            </div>
            <div v-if="contactInfo.email" class="contact-item">
              <ion-icon :icon="mailOutline" />
              <a :href="`mailto:${contactInfo.email}`">{{ contactInfo.email }}</a>
            </div>
            <div v-if="contactInfo.address" class="contact-item">
              <ion-icon :icon="locationOutline" />
              <span>{{ contactInfo.address }}</span>
            </div>
            <div v-if="contactInfo.website" class="contact-item">
              <ion-icon :icon="globeOutline" />
              <a :href="contactInfo.website" target="_blank" rel="noopener"> Sitio Web </a>
            </div>
          </div>
        </div>

        <!-- Enlaces rápidos -->
        <div v-if="quickLinks.length > 0" class="footer-section">
          <h4 class="footer-section-title">Enlaces Rápidos</h4>
          <ul class="footer-links">
            <li v-for="link in quickLinks" :key="link.label">
              <router-link v-if="link.to" :to="link.to" class="footer-link">
                {{ link.label }}
              </router-link>
              <a
                v-else-if="link.href"
                :href="link.href"
                :target="link.external ? '_blank' : '_self'"
                :rel="link.external ? 'noopener' : ''"
                class="footer-link"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Redes sociales -->
        <div v-if="hasSocialMedia && showSocial" class="footer-section">
          <h4 class="footer-section-title">Síguenos</h4>
          <div class="footer-social">
            <a
              v-if="contactInfo.socialMedia?.facebook"
              :href="contactInfo.socialMedia.facebook"
              target="_blank"
              rel="noopener"
              class="social-link"
              aria-label="Facebook"
            >
              <ion-icon :icon="logoFacebook" />
            </a>
            <a
              v-if="contactInfo.socialMedia?.instagram"
              :href="contactInfo.socialMedia.instagram"
              target="_blank"
              rel="noopener"
              class="social-link"
              aria-label="Instagram"
            >
              <ion-icon :icon="logoInstagram" />
            </a>
            <a
              v-if="contactInfo.socialMedia?.twitter"
              :href="contactInfo.socialMedia.twitter"
              target="_blank"
              rel="noopener"
              class="social-link"
              aria-label="Twitter"
            >
              <ion-icon :icon="logoTwitter" />
            </a>
            <a
              v-if="contactInfo.socialMedia?.youtube"
              :href="contactInfo.socialMedia.youtube"
              target="_blank"
              rel="noopener"
              class="social-link"
              aria-label="YouTube"
            >
              <ion-icon :icon="logoYoutube" />
            </a>
          </div>
        </div>

        <!-- Slot para contenido personalizado -->
        <div v-if="$slots.custom" class="footer-section">
          <slot name="custom" />
        </div>
      </div>

      <!-- Barra inferior -->
      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <!-- Copyright -->
          <div class="footer-copyright">
            <p>{{ footerText }}</p>
          </div>

          <!-- Powered by (opcional) -->
          <div v-if="shouldShowPoweredBy" class="footer-powered">
            <p>
              Powered by
              <a href="#" class="powered-link">Music Academy Manager</a>
            </p>
          </div>

          <!-- Enlaces legales -->
          <div v-if="legalLinks.length > 0" class="footer-legal">
            <router-link
              v-for="link in legalLinks"
              :key="link.label"
              :to="link.to"
              class="legal-link"
            >
              {{ link.label }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import {computed} from "vue"
import {IonIcon} from "@ionic/vue"
import {
  callOutline,
  mailOutline,
  locationOutline,
  globeOutline,
  logoFacebook,
  logoInstagram,
  logoTwitter,
  logoYoutube,
} from "ionicons/icons"
import {useBranding} from "@/composables/useBranding"

interface QuickLink {
  label: string
  to?: string
  href?: string
  external?: boolean
}

interface LegalLink {
  label: string
  to: string
}

interface Props {
  showLogo?: boolean
  showTagline?: boolean
  showDescription?: boolean
  showContact?: boolean
  showSocial?: boolean
  quickLinks?: QuickLink[]
  legalLinks?: LegalLink[]
  customStyles?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  showLogo: true,
  showTagline: true,
  showDescription: true,
  showContact: true,
  showSocial: true,
  quickLinks: () => [],
  legalLinks: () => [],
  customStyles: () => ({}),
})

// Branding composable
const {
  appTitle,
  appTagline,
  appDescription,
  appLogo,
  contactInfo,
  brandColors,
  shouldShowPoweredBy,
  footerText,
  getCSSVariables,
} = useBranding()

// Verificar si hay redes sociales configuradas
const hasSocialMedia = computed(() => {
  const social = contactInfo.value.socialMedia
  return !!(social?.facebook || social?.instagram || social?.twitter || social?.youtube)
})

// Estilos dinámicos del footer
const footerStyles = computed(() => {
  const baseStyles = {
    "--footer-bg": brandColors.value.secondary || "#2c3e50",
    "--footer-text": getContrastColor(brandColors.value.secondary || "#2c3e50"),
    "--footer-accent": brandColors.value.accent || brandColors.value.primary,
    "--footer-border": `${brandColors.value.primary}33`, // 20% opacity
    ...getCSSVariables(),
  }

  return {
    ...baseStyles,
    ...props.customStyles,
  }
})

// Calcular color de contraste
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "#2c3e50" : "#ecf0f1"
}
</script>

<style scoped>
.dynamic-footer {
  background: var(--footer-bg);
  color: var(--footer-text);
  border-top: 3px solid var(--footer-accent);
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px 20px;
}

.footer-main {
  margin-bottom: 40px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.footer-logo {
  height: 50px;
  width: auto;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.footer-brand-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--footer-accent);
}

.footer-tagline {
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.8;
}

.footer-description {
  max-width: 600px;
  line-height: 1.6;
}

.footer-description p {
  margin: 0;
  opacity: 0.9;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.footer-section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--footer-accent);
  border-bottom: 2px solid var(--footer-accent);
  padding-bottom: 8px;
}

.footer-contact {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.contact-item ion-icon {
  color: var(--footer-accent);
  font-size: 1.2rem;
  min-width: 20px;
}

.contact-item a,
.contact-item span {
  color: var(--footer-text);
  text-decoration: none;
  transition: color 0.3s ease;
}

.contact-item a:hover {
  color: var(--footer-accent);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-link {
  color: var(--footer-text);
  text-decoration: none;
  transition: all 0.3s ease;
  padding: 4px 0;
  position: relative;
}

.footer-link:hover {
  color: var(--footer-accent);
  padding-left: 8px;
}

.footer-link::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 0;
  height: 2px;
  background: var(--footer-accent);
  transition: width 0.3s ease;
  transform: translateY(-50%);
}

.footer-link:hover::before {
  width: 4px;
}

.footer-social {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--footer-accent);
  color: white;
  border-radius: 50%;
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-link:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.social-link ion-icon {
  font-size: 1.3rem;
}

.footer-bottom {
  border-top: 1px solid var(--footer-border);
  padding-top: 20px;
}

.footer-bottom-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-copyright p {
  margin: 0;
  opacity: 0.8;
}

.footer-powered p {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.7;
}

.powered-link {
  color: var(--footer-accent);
  text-decoration: none;
}

.powered-link:hover {
  text-decoration: underline;
}

.footer-legal {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.legal-link {
  color: var(--footer-text);
  text-decoration: none;
  font-size: 0.85rem;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.legal-link:hover {
  opacity: 1;
  color: var(--footer-accent);
}

/* Responsive */
@media (max-width: 768px) {
  .footer-content {
    padding: 30px 16px 16px;
  }

  .footer-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .footer-brand {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .footer-bottom-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .footer-legal {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .footer-social {
    justify-content: center;
  }

  .social-link {
    width: 36px;
    height: 36px;
  }

  .social-link ion-icon {
    font-size: 1.1rem;
  }
}

/* Animaciones */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.footer-section {
  animation: fadeInUp 0.6s ease-out;
}

/* Modo oscuro */
@media (prefers-color-scheme: dark) {
  .footer-logo {
    filter: brightness(0) invert(1);
  }
}
</style>
