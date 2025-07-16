<!-- src/components/DynamicPermissionGuard.vue -->

<template>
  <div v-if="hasAccess || loading">
    <div v-if="loading" class="permission-loading">
      <div class="flex items-center justify-center p-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        <span class="ml-2 text-sm text-gray-600">Verificando permisos...</span>
      </div>
    </div>
    <slot v-else />
  </div>

  <div v-else-if="showFallback">
    <slot name="fallback">
      <div class="permission-denied bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Acceso denegado</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>No tienes permisos suficientes para acceder a este contenido.</p>
              <p v-if="requiredPermissions.length > 0" class="mt-1">
                <strong>Permisos requeridos:</strong> {{ requiredPermissions.join(", ") }}
              </p>
              <p v-if="requiredRoles.length > 0" class="mt-1">
                <strong>Roles requeridos:</strong> {{ requiredRoles.join(", ") }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRBAC } from '@/composables/useRBAC';
import { useAuth } from '@/modulos/Auth/composables/useAuth';

interface Props {
  permissions?: string[]
  roles?: string[]
  moduleId?: string
  componentId?: string
  requireAll?: boolean // Si true, requiere TODOS los permisos/roles. Si false, requiere AL MENOS UNO
  showFallback?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  permissions: () => [],
  roles: () => [],
  requireAll: false,
  showFallback: true,
});

const { user } = useAuth();
const {
  hasPermission,
  hasModuleAccess,
  canAccessComponent,
  userRoles,
  loading: rbacLoading,
} = useRBAC();

const loading = ref(true);
const hasAccess = ref(false);

const requiredPermissions = computed(() => props.permissions);
const requiredRoles = computed(() => props.roles);

const checkAccess = async () => {
  if (!user.value) {
    hasAccess.value = false;
    loading.value = false;
    return;
  }

  loading.value = true;

  try {
    let accessGranted = true;

    // Verificar acceso por módulo
    if (props.moduleId) {
      const moduleAccess = await hasModuleAccess(props.moduleId);
      if (!moduleAccess) {
        accessGranted = false;
      }
    }

    // Verificar acceso por componente
    if (accessGranted && props.componentId && props.moduleId) {
      const componentAccess = canAccessComponent(props.componentId, props.moduleId);
      if (!componentAccess) {
        accessGranted = false;
      }
    }

    // Verificar permisos específicos
    if (accessGranted && props.permissions.length > 0) {
      const permissionChecks = await Promise.all(
        props.permissions.map((permission) => hasPermission(permission)),
      );

      if (props.requireAll) {
        accessGranted = permissionChecks.every((check) => check);
      } else {
        accessGranted = permissionChecks.some((check) => check);
      }
    }

    // Verificar roles específicos
    if (accessGranted && props.roles.length > 0) {
      const userRolesList = userRoles.value;

      if (props.requireAll) {
        accessGranted = props.roles.every((role) => userRolesList.includes(role));
      } else {
        accessGranted = props.roles.some((role) => userRolesList.includes(role));
      }
    }

    hasAccess.value = accessGranted;
  } catch (error) {
    console.error('Error checking access:', error);
    hasAccess.value = false;
  } finally {
    loading.value = false;
  }
};

// Reactividad
watch(
  [
    () => user.value,
    () => props.permissions,
    () => props.roles,
    () => props.moduleId,
    () => props.componentId,
  ],
  () => {
    checkAccess();
  },
);

watch(rbacLoading, (newVal) => {
  if (!newVal) {
    checkAccess();
  }
});

onMounted(() => {
  checkAccess();
});
</script>

<style scoped>
.permission-loading {
  min-height: 60px;
}

.permission-denied {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
