<template>
  <div class="settings-container py-6 max-w-5xl mx-auto px-4 mb-14">
    <!-- Header -->
    <div class="flex flex-wrap justify-between items-center mb-8 gap-4">
      <h1
        class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent"
      >
        Ajustes
      </h1>

      <div class="flex items-center">
        <button
          class="btn bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
          @click="goBack"
        >
          <ArrowLeftIcon class="w-5 h-5" />
          <span>Volver</span>
        </button>
      </div>
    </div>

    <!-- Tabs de navegación -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 overflow-hidden">
      <div class="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="py-3 px-4 text-sm font-medium relative"
          :class="[
            activeTab === tab.id
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300',
          ]"
          @click="activeTab = tab.id"
        >
          <div class="flex items-center gap-2">
            <component :is="tab.icon" class="w-5 h-5" />
            <span>{{ tab.name }}</span>
          </div>
          <div
            v-if="activeTab === tab.id"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
          />
        </button>
      </div>
    </div>

    <!-- Contenido de los tabs -->
    <div class="settings-content space-y-8">
      <!-- Cuenta y Seguridad -->
      <div v-if="activeTab === 'account'" class="space-y-8">
        <!-- Cambio de contraseña -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
            <LockClosedIcon class="w-5 h-5 text-primary-500" />
            <span>Cambiar Contraseña</span>
          </h3>

          <form class="space-y-4" @submit.prevent="changePassword">
            <div class="grid md:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Contraseña Actual</label>
                <input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  class="form-input"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Nueva Contraseña</label>
                <input
                  v-model="passwordForm.newPassword"
                  type="password"
                  class="form-input"
                  placeholder="••••••••"
                  required
                />
                <div class="mt-2">
                  <div class="password-strength-meter">
                    <div
                      class="progress-bar"
                      :class="passwordStrengthClass"
                      :style="{width: `${passwordStrength * 25}%`}"
                    />
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ passwordStrengthText }}
                  </span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Confirmar Nueva Contraseña</label>
                <input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  class="form-input"
                  placeholder="••••••••"
                  required
                />
                <span
                  v-if="
                    passwordForm.newPassword &&
                    passwordForm.confirmPassword &&
                    passwordForm.newPassword !== passwordForm.confirmPassword
                  "
                  class="text-xs text-red-500 mt-1 block"
                >
                  Las contraseñas no coinciden
                </span>
              </div>
            </div>
            <div class="form-group">
              <button type="submit" class="btn-primary" :disabled="!passwordValid || isLoading">
                <SpinnerIcon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                <span>Actualizar Contraseña</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Información de la cuenta -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
            <UserIcon class="w-5 h-5 text-primary-500" />
            <span>Información de la Cuenta</span>
          </h3>

          <div class="space-y-4">
            <div class="info-item">
              <div>
                <p class="info-label">Email</p>
                <p class="info-value">{{ userEmail }}</p>
              </div>
              <button
                class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                @click="showEmailUpdateForm = !showEmailUpdateForm"
              >
                {{ showEmailUpdateForm ? "Cancelar" : "Cambiar" }}
              </button>
            </div>

            <form
              v-if="showEmailUpdateForm"
              class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
              @submit.prevent="updateEmail"
            >
              <div class="grid md:grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label">Nuevo Email</label>
                  <input
                    v-model="emailForm.newEmail"
                    type="email"
                    class="form-input"
                    placeholder="nuevo@email.com"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Contraseña para Confirmar</label>
                  <input
                    v-model="emailForm.password"
                    type="password"
                    class="form-input"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <div class="mt-4">
                <button
                  type="submit"
                  class="btn-primary"
                  :disabled="!emailForm.newEmail || !emailForm.password || isLoading"
                >
                  <SpinnerIcon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                  <span>Actualizar Email</span>
                </button>
              </div>
            </form>

            <!-- Eliminar cuenta -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h4 class="text-base font-medium text-red-600 dark:text-red-400 mb-2">
                Zona de Peligro
              </h4>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Una vez eliminada tu cuenta, todos tus datos serán borrados permanentemente y no
                podrán ser recuperados.
              </p>
              <button
                class="btn bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                @click="showDeleteAccountModal = true"
              >
                <TrashIcon class="w-5 h-5 mr-2" />
                <span>Eliminar mi cuenta</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Notificaciones -->
      <div v-if="activeTab === 'notifications'" class="space-y-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
            <BellIcon class="w-5 h-5 text-primary-500" />
            <span>Preferencias de Notificaciones</span>
          </h3>

          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Notificaciones por correo electrónico</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Recibe notificaciones importantes en tu correo electrónico
                </p>
              </div>
              <label class="switch">
                <input
                  v-model="notificationSettings.email"
                  type="checkbox"
                  @change="saveNotificationSettings"
                />
                <span class="slider" />
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Notificaciones en la aplicación</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Recibe notificaciones dentro de la aplicación
                </p>
              </div>
              <label class="switch">
                <input
                  v-model="notificationSettings.inApp"
                  type="checkbox"
                  @change="saveNotificationSettings"
                />
                <span class="slider" />
              </label>
            </div>

            <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 class="font-medium mb-3">Tipo de Notificaciones</h4>

              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <p>Asistencia</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Notificaciones sobre asistencia a clases
                    </p>
                  </div>
                  <label class="switch">
                    <input
                      v-model="notificationSettings.types.attendance"
                      type="checkbox"
                      @change="saveNotificationSettings"
                    />
                    <span class="slider" />
                  </label>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <p>Clases</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Actualizaciones sobre horarios de clases
                    </p>
                  </div>
                  <label class="switch">
                    <input
                      v-model="notificationSettings.types.classes"
                      type="checkbox"
                      @change="saveNotificationSettings"
                    />
                    <span class="slider" />
                  </label>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <p>Anuncios</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Anuncios generales de la academia
                    </p>
                  </div>
                  <label class="switch">
                    <input
                      v-model="notificationSettings.types.announcements"
                      type="checkbox"
                      @change="saveNotificationSettings"
                    />
                    <span class="slider" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preferencias de Tema -->
      <div v-if="activeTab === 'appearance'" class="space-y-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
            <PaintBrushIcon class="w-5 h-5 text-primary-500" />
            <span>Tema de la Aplicación</span>
          </h3>

          <div class="space-y-6">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Elige cómo deseas visualizar la aplicación
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label
                class="theme-option-card"
                :class="{active: appearanceSettings.theme === 'light'}"
              >
                <input
                  v-model="appearanceSettings.theme"
                  type="radio"
                  value="light"
                  class="sr-only"
                  @change="saveAppearanceSettings"
                />
                <div class="theme-preview light-preview" />
                <div class="flex items-center justify-between w-full mt-2">
                  <span class="font-medium">Modo Claro</span>
                  <CheckCircleIcon
                    v-if="appearanceSettings.theme === 'light'"
                    class="w-5 h-5 text-primary-500"
                  />
                </div>
              </label>

              <label
                class="theme-option-card"
                :class="{active: appearanceSettings.theme === 'dark'}"
              >
                <input
                  v-model="appearanceSettings.theme"
                  type="radio"
                  value="dark"
                  class="sr-only"
                  @change="saveAppearanceSettings"
                />
                <div class="theme-preview dark-preview" />
                <div class="flex items-center justify-between w-full mt-2">
                  <span class="font-medium">Modo Oscuro</span>
                  <CheckCircleIcon
                    v-if="appearanceSettings.theme === 'dark'"
                    class="w-5 h-5 text-primary-500"
                  />
                </div>
              </label>

              <label
                class="theme-option-card"
                :class="{active: appearanceSettings.theme === 'system'}"
              >
                <input
                  v-model="appearanceSettings.theme"
                  type="radio"
                  value="system"
                  class="sr-only"
                  @change="saveAppearanceSettings"
                />
                <div class="theme-preview system-preview" />
                <div class="flex items-center justify-between w-full mt-2">
                  <span class="font-medium">Según Sistema</span>
                  <CheckCircleIcon
                    v-if="appearanceSettings.theme === 'system'"
                    class="w-5 h-5 text-primary-500"
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Privacidad -->
      <div v-if="activeTab === 'privacy'" class="space-y-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
            <ShieldCheckIcon class="w-5 h-5 text-primary-500" />
            <span>Privacidad y Seguridad</span>
          </h3>

          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Verificación en dos pasos</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Añade una capa extra de seguridad a tu cuenta
                </p>
              </div>
              <label class="switch">
                <input
                  v-model="privacySettings.twoFactorAuth"
                  type="checkbox"
                  @change="savePrivacySettings"
                />
                <span class="slider" />
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Historial de actividad</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Registrar actividad en tu cuenta para mayor seguridad
                </p>
              </div>
              <label class="switch">
                <input
                  v-model="privacySettings.activityLog"
                  type="checkbox"
                  @change="savePrivacySettings"
                />
                <span class="slider" />
              </label>
            </div>

            <div
              v-if="privacySettings.activityLog"
              class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
            >
              <h4 class="font-medium mb-3">Historial de Sesiones</h4>

              <div v-if="sessionHistory.length > 0" class="space-y-3">
                <div
                  v-for="(session, index) in sessionHistory"
                  :key="index"
                  class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center justify-between"
                >
                  <div class="flex items-center gap-3">
                    <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                      <DevicePhoneMobileIcon
                        v-if="session.device.includes('Mobile')"
                        class="w-5 h-5 text-blue-600 dark:text-blue-400"
                      />
                      <ComputerDesktopIcon
                        v-else
                        class="w-5 h-5 text-blue-600 dark:text-blue-400"
                      />
                    </div>
                    <div>
                      <p class="font-medium">{{ session.device }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ new Date(session.startTime).toLocaleString() }}
                      </p>
                    </div>
                  </div>
                  <span
                    class="badge"
                    :class="
                      session.endTime
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    "
                  >
                    {{ session.endTime ? "Finalizada" : "Activa" }}
                  </span>
                </div>
              </div>
              <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
                <p>No hay sesiones registradas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Información de la aplicación -->
      <div v-if="activeTab === 'about'" class="space-y-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-center mb-6">
            <img
              src="../../src/assets/ElSistemaPCLogo.jpeg"
              alt="El Sistema PC Logo"
              class="h-24 w-auto"
            />
          </div>

          <div class="text-center space-y-2 mb-8">
            <h3 class="text-xl font-bold">El Sistema PC</h3>
            <p class="text-gray-600 dark:text-gray-400">Versión 1.0.0</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Sistema de gestión académica para escuelas de música
            </p>
          </div>

          <div class="space-y-4">
            <div
              class="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700"
            >
              <span>Desarrollado por</span>
              <span class="font-medium">Team El Sistema</span>
            </div>
            <div
              class="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700"
            >
              <span>Contacto</span>
              <span class="font-medium">soporte@elsistemapc.com</span>
            </div>
            <div
              class="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700"
            >
              <span>Sitio Web</span>
              <a
                href="https://elsistemapc.com"
                target="_blank"
                class="text-primary-600 dark:text-primary-400 hover:underline"
              >
                elsistemapc.com
              </a>
            </div>
            <div
              class="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700"
            >
              <span>Última Actualización</span>
              <span class="font-medium">10 de Abril, 2025</span>
            </div>
            <div class="flex justify-between items-center p-3">
              <span>Licencia</span>
              <span class="font-medium">Propiedad de El Sistema PC</span>
            </div>
          </div>

          <div class="mt-8 text-center">
            <button class="btn-secondary">
              <InformationCircleIcon class="w-5 h-5 mr-2" />
              <span>Ver Documentación</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal para eliminar cuenta -->
  <Teleport to="body">
    <div
      v-if="showDeleteAccountModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-center mb-4">¿Estás seguro?</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Esta acción no se puede deshacer. Todos tus datos serán eliminados permanentemente.
        </p>

        <div class="form-group mb-4">
          <label class="form-label">Por favor, escribe "ELIMINAR" para confirmar</label>
          <input
            v-model="deleteConfirmation"
            type="text"
            class="form-input"
            placeholder="ELIMINAR"
          />
        </div>

        <div class="flex justify-end gap-3">
          <button class="btn-secondary" @click="showDeleteAccountModal = false">
            <span>Cancelar</span>
          </button>

          <button
            class="btn bg-red-600 text-white hover:bg-red-700"
            :disabled="deleteConfirmation !== 'ELIMINAR'"
            @click="deleteAccount"
          >
            <TrashIcon class="w-5 h-5 mr-2" />
            <span>Eliminar mi cuenta</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useUserSessionsStore } from '../modulos/Users/store/userSessions';
import { doc, getDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore';
import {
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { useTheme } from '../contexts/ThemeContext';
import SpinnerIcon from '../components/SpinnerIcon.vue';
import {
  ArrowLeftIcon,
  BellIcon,
  LockClosedIcon,
  UserIcon,
  TrashIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline';

// Store y router
const router = useRouter();
const authStore = useAuthStore();
const userSessionsStore = useUserSessionsStore();
const { isDarkMode, toggleDarkMode } = useTheme();

// Estado de la UI
const activeTab = ref('account');
const isLoading = ref(false);
const showEmailUpdateForm = ref(false);
const showDeleteAccountModal = ref(false);
const deleteConfirmation = ref('');

// Datos del usuario
const userEmail = computed(() => authStore.user?.email || '');

// Formularios
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const emailForm = ref({
  newEmail: '',
  password: '',
});

// Configuración de notificaciones
const notificationSettings = ref({
  email: true,
  inApp: true,
  types: {
    attendance: true,
    classes: true,
    announcements: true,
  },
});

// Configuración de apariencia
const appearanceSettings = ref({
  theme: isDarkMode.value ? 'dark' : 'light',
});

// Configuración de privacidad
const privacySettings = ref({
  twoFactorAuth: false,
  activityLog: true,
});

// Historial de sesiones
const sessionHistory = ref<any[]>([]);

// Estructura de pestañas
const tabs = [
  { id: 'account', name: 'Cuenta', icon: UserIcon },
  { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
  { id: 'appearance', name: 'Apariencia', icon: PaintBrushIcon },
  { id: 'privacy', name: 'Privacidad', icon: ShieldCheckIcon },
  { id: 'about', name: 'Acerca de', icon: InformationCircleIcon },
];

// Fuerza de la contraseña
const passwordStrength = computed(() => {
  const password = passwordForm.value.newPassword;
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
});

const passwordStrengthClass = computed(() => {
  switch (passwordStrength.value) {
  case 0:
    return 'bg-gray-300 dark:bg-gray-600';
  case 1:
    return 'bg-red-500';
  case 2:
    return 'bg-yellow-500';
  case 3:
    return 'bg-blue-500';
  case 4:
    return 'bg-green-500';
  default:
    return 'bg-gray-300 dark:bg-gray-600';
  }
});

const passwordStrengthText = computed(() => {
  switch (passwordStrength.value) {
  case 0:
    return 'Ingresa una contraseña';
  case 1:
    return 'Débil';
  case 2:
    return 'Regular';
  case 3:
    return 'Buena';
  case 4:
    return 'Fuerte';
  default:
    return '';
  }
});

const passwordValid = computed(() => {
  return (
    passwordForm.value.newPassword &&
    passwordForm.value.confirmPassword &&
    passwordForm.value.currentPassword &&
    passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
    passwordStrength.value >= 3
  );
});

// Métodos
const goBack = () => {
  router.back();
};

const loadUserSettings = async () => {
  if (!authStore.user?.uid) return;

  try {
    isLoading.value = true;

    // Cargar preferencias de notificaciones
    const userDocRef = doc(db, 'USERS', authStore.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      if (userData.notificationSettings) {
        notificationSettings.value = {
          ...notificationSettings.value,
          ...userData.notificationSettings,
        };
      }

      if (userData.privacySettings) {
        privacySettings.value = {
          ...privacySettings.value,
          ...userData.privacySettings,
        };
      }
    }

    // Cargar historial de sesiones
    if (privacySettings.value.activityLog) {
      await userSessionsStore.getUserSessions(authStore.user.uid);
      sessionHistory.value = userSessionsStore.getUserSessionsById(authStore.user.uid);
    }
  } catch (error) {
    console.error('Error al cargar configuraciones:', error);
  } finally {
    isLoading.value = false;
  }
};

const changePassword = async () => {
  if (!passwordValid.value) return;

  try {
    isLoading.value = true;
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      throw new Error('Usuario no autenticado');
    }

    // Reautenticar al usuario
    const credential = EmailAuthProvider.credential(user.email, passwordForm.value.currentPassword);

    await reauthenticateWithCredential(user, credential);

    // Cambiar contraseña
    await updatePassword(user, passwordForm.value.newPassword);

    alert('Contraseña actualizada correctamente');

    // Limpiar formulario
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  } catch (error: any) {
    if (error.code === 'auth/wrong-password') {
      alert('La contraseña actual es incorrecta');
    } else {
      console.error('Error al cambiar contraseña:', error);
      alert('Error al actualizar contraseña');
    }
  } finally {
    isLoading.value = false;
  }
};

const updateEmail = async () => {
  if (!emailForm.value.newEmail || !emailForm.value.password) return;

  try {
    isLoading.value = true;
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      throw new Error('Usuario no autenticado');
    }

    // Reautenticar al usuario
    const credential = EmailAuthProvider.credential(user.email, emailForm.value.password);

    await reauthenticateWithCredential(user, credential);

    // Actualizar correo
    await updateEmail(user, emailForm.value.newEmail);

    // Actualizar en Firestore
    if (authStore.user?.uid) {
      const userDocRef = doc(db, 'USERS', authStore.user.uid);
      await updateDoc(userDocRef, {
        email: emailForm.value.newEmail,
      });
    }

    alert('Correo electrónico actualizado correctamente');
    showEmailUpdateForm.value = false;

    // Limpiar formulario
    emailForm.value = {
      newEmail: '',
      password: '',
    };
  } catch (error: any) {
    if (error.code === 'auth/wrong-password') {
      alert('La contraseña es incorrecta');
    } else if (error.code === 'auth/email-already-in-use') {
      alert('Este correo ya está en uso por otra cuenta');
    } else {
      console.error('Error al actualizar email:', error);
      alert('Error al actualizar correo electrónico');
    }
  } finally {
    isLoading.value = false;
  }
};

const saveNotificationSettings = async () => {
  if (!authStore.user?.uid) return;

  try {
    isLoading.value = true;

    const userDocRef = doc(db, 'USERS', authStore.user.uid);
    await updateDoc(userDocRef, {
      notificationSettings: notificationSettings.value,
    });

    alert('Preferencias de notificaciones guardadas');
  } catch (error) {
    console.error('Error al guardar preferencias de notificaciones:', error);
    alert('Error al guardar preferencias');
  } finally {
    isLoading.value = false;
  }
};

const saveAppearanceSettings = async () => {
  if (!authStore.user?.uid) return;

  try {
    isLoading.value = true;

    const userDocRef = doc(db, 'USERS', authStore.user.uid);
    await updateDoc(userDocRef, {
      isDark: appearanceSettings.value.theme === 'dark',
    });

    // Aplicar tema
    if (appearanceSettings.value.theme === 'dark') {
      if (!isDarkMode.value) toggleDarkMode();
    } else {
      if (isDarkMode.value) toggleDarkMode();
    }

    alert('Preferencias de apariencia guardadas');
  } catch (error) {
    console.error('Error al guardar preferencias de apariencia:', error);
    alert('Error al guardar preferencias');
  } finally {
    isLoading.value = false;
  }
};

const savePrivacySettings = async () => {
  if (!authStore.user?.uid) return;

  try {
    isLoading.value = true;

    const userDocRef = doc(db, 'USERS', authStore.user.uid);
    await updateDoc(userDocRef, {
      privacySettings: privacySettings.value,
    });

    // Si se activó el registro de actividad, cargar sesiones
    if (privacySettings.value.activityLog) {
      await userSessionsStore.getUserSessions(authStore.user.uid);
      sessionHistory.value = userSessionsStore.getUserSessionsById(authStore.user.uid);
    }

    alert('Configuración de privacidad guardada');
  } catch (error) {
    console.error('Error al guardar configuración de privacidad:', error);
    alert('Error al guardar configuración');
  } finally {
    isLoading.value = false;
  }
};

const deleteAccount = async () => {
  if (deleteConfirmation.value !== 'ELIMINAR') return;

  try {
    isLoading.value = true;
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !authStore.user?.uid) {
      throw new Error('Usuario no autenticado');
    }

    // Eliminar datos del usuario en Firestore
    const userDocRef = doc(db, 'USERS', authStore.user.uid);
    await deleteDoc(userDocRef);

    // Eliminar usuario de Firebase Auth
    await deleteUser(user);

    alert('Cuenta eliminada correctamente');
    router.push('/login');
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    alert('Error al eliminar cuenta. Es posible que necesites iniciar sesión nuevamente.');
  } finally {
    isLoading.value = false;
    showDeleteAccountModal.value = false;
  }
};

// Inicializar
onMounted(() => {
  loadUserSettings();

  // Registrar la sesión actual
  if (authStore.user?.uid) {
    const deviceType = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent)
      ? 'Dispositivo Móvil'
      : 'Computadora';

    userSessionsStore.recordSession({
      userId: authStore.user.uid,
      device: `${deviceType} (${navigator.platform})`,
      startTime: new Date(),
      ipAddress: '', // No se puede obtener directamente por privacidad
      actions: ['Acceso a configuración'],
    });
  }
});
</script>

<style scoped>
/* Estilos para campos de formulario */
.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-input,
.form-select {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white;
}

/* Estilos para botones */
.btn-primary {
  @apply flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600;
}

.btn-secondary {
  @apply flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors;
}

.btn {
  @apply flex items-center justify-center gap-2 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Estilos para tarjetas de tema */
.theme-option-card {
  @apply flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.theme-option-card.active {
  @apply border-primary-500 bg-primary-50 dark:bg-primary-900/30;
}

.theme-preview {
  @apply w-full h-32 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden;
}

.light-preview {
  @apply bg-gradient-to-b from-blue-100 to-white;
}

.dark-preview {
  @apply bg-gradient-to-b from-gray-800 to-gray-900;
}

.system-preview {
  @apply relative bg-gradient-to-r from-blue-100 to-white dark:from-gray-800 dark:to-gray-900;
  background-image: linear-gradient(
    to right,
    theme("colors.blue.100") 50%,
    theme("colors.gray.800") 50%
  );
}

/* Estilos para items de información */
.info-item {
  @apply flex items-start justify-between gap-4;
}

.info-label {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.info-value {
  @apply font-medium;
}

/* Estilos para switch toggle */
.switch {
  @apply relative inline-flex items-center cursor-pointer;
}

.switch input {
  @apply sr-only;
}

.slider {
  @apply relative inline-block w-10 h-5 bg-gray-300 dark:bg-gray-600 rounded-full transition-all duration-300 mr-3;
}

.slider::before {
  @apply content-[''] absolute h-4 w-4 left-0.5 bottom-0.5 bg-white rounded-full transition-all duration-300;
}

input:checked + .slider {
  @apply bg-primary-500;
}

input:checked + .slider::before {
  @apply translate-x-5;
}

/* Estilos para medidor de fuerza de contraseña */
.password-strength-meter {
  @apply h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.progress-bar {
  @apply h-full transition-all duration-300;
}

/* Estilos para badges */
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
