<script setup lang="ts">
import {ref, onMounted, onUnmounted} from "vue"
import {useRouter} from "vue-router"
import {getFirestore, doc, getDoc, onSnapshot} from "firebase/firestore"
import {getAuth, signOut} from "firebase/auth"
import {
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline"

const router = useRouter()
const auth = getAuth()
const db = getFirestore()

const isLoading = ref(true)
const error = ref("")
const userStatus = ref<"pendiente" | "aprobado" | "rechazado" | null>(null)
const rejectionReason = ref("")
const unsubscribeRef = ref<(() => void) | null>(null)

// Comprueba el estado de aprobación del usuario
const checkApprovalStatus = async () => {
  isLoading.value = true
  error.value = ""

  try {
    const currentUser = auth.currentUser

    if (!currentUser) {
      router.push("/login")
      return
    }

    const userDocRef = doc(db, "USERS", currentUser.uid)

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(
      userDocRef,
      (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data()
          userStatus.value = userData.status
          rejectionReason.value = userData.rejectionReason || ""

          // Si el usuario ya está aprobado, redirigir al dashboard
          if (userData.status === "aprobado") {
            router.push("/")
          }
        } else {
          error.value = "No se pudo encontrar la información de usuario"
        }

        isLoading.value = false
      },
      (err) => {
        console.error("Error al verificar estado:", err)
        error.value = "Error al comprobar el estado de aprobación"
        isLoading.value = false
      }
    )

    // Guardar referencia para limpiarla al desmontar
    unsubscribeRef.value = unsubscribe
  } catch (err) {
    console.error("Error al verificar estado:", err)
    error.value = "Error al comprobar el estado de aprobación"
    isLoading.value = false
  }
}

// Cerrar sesión
const handleLogout = async () => {
  try {
    await signOut(auth)
    router.push("/login")
  } catch (err) {
    console.error("Error al cerrar sesión:", err)
    error.value = "Error al cerrar sesión"
  }
}

onMounted(() => {
  checkApprovalStatus()
})

onUnmounted(() => {
  // Limpiar la suscripción al desmontar el componente
  if (unsubscribeRef.value) {
    unsubscribeRef.value()
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <!-- Estado de carga -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        <p class="mt-4 text-gray-600 dark:text-gray-400">Verificando estado de tu cuenta...</p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-6 rounded-lg text-center"
      >
        <ExclamationCircleIcon class="h-12 w-12 mx-auto text-red-500 dark:text-red-400 mb-4" />
        <h2 class="text-xl font-bold mb-2">Error</h2>
        <p class="mb-4">{{ error }}</p>
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          @click="handleLogout"
        >
          Volver al inicio de sesión
        </button>
      </div>

      <!-- Cuenta pendiente -->
      <div v-else-if="userStatus === 'pendiente'" class="text-center">
        <ClockIcon class="h-16 w-16 mx-auto text-yellow-500 dark:text-yellow-400 mb-4" />
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Cuenta pendiente de aprobación
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Tu cuenta está siendo revisada por nuestros administradores. Este proceso puede tomar
          hasta 24 horas. Te notificaremos por correo electrónico cuando tu cuenta sea aprobada.
        </p>
        <div class="flex flex-col gap-4">
          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-left">
            <h3 class="font-medium text-yellow-800 dark:text-yellow-300 mb-2">¿Qué sigue?</h3>
            <ul class="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-200">
              <li>Un administrador revisará tu solicitud</li>
              <li>Recibirás una notificación por correo cuando tu estatus cambie</li>
              <li>Una vez aprobado, podrás acceder a todas las funciones de la plataforma</li>
            </ul>
          </div>
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            @click="handleLogout"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <!-- Cuenta rechazada -->
      <div v-else-if="userStatus === 'rechazado'" class="text-center">
        <XCircleIcon class="h-16 w-16 mx-auto text-red-500 dark:text-red-400 mb-4" />
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Solicitud rechazada</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Lo sentimos, tu solicitud de acceso ha sido rechazada por los administradores.
        </p>

        <div
          v-if="rejectionReason"
          class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-left mb-6"
        >
          <h3 class="font-medium text-red-800 dark:text-red-300 mb-2">Motivo del rechazo:</h3>
          <p class="text-sm text-red-700 dark:text-red-200">{{ rejectionReason }}</p>
        </div>

        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Si consideras que esto es un error o deseas más información, por favor contacta con el
          soporte técnico.
        </p>

        <button
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          @click="handleLogout"
        >
          Volver al inicio de sesión
        </button>
      </div>

      <!-- Estado no reconocido -->
      <div v-else class="text-center">
        <ExclamationCircleIcon class="h-16 w-16 mx-auto text-gray-500 dark:text-gray-400 mb-4" />
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Estado desconocido</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          No podemos determinar el estado actual de tu cuenta. Por favor, intenta iniciar sesión
          nuevamente.
        </p>
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          @click="handleLogout"
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  </div>
</template>
