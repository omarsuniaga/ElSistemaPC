<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">🔐 Gestión de Permisos</h1>
      <p class="text-gray-600">Administra roles y permisos de los miembros del proyecto</p>
    </div>

    <!-- Roles Overview -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Roles del Sistema</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          v-for="role in systemRoles" 
          :key="role.id"
          class="border border-gray-200 rounded-lg p-4"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl">{{ role.icon }}</span>
            <h3 class="font-medium text-gray-900">{{ role.name }}</h3>
          </div>
          <p class="text-sm text-gray-600 mb-3">{{ role.description }}</p>
          <div class="text-xs text-gray-500">
            {{ role.permissions.length }} permisos
          </div>
        </div>
      </div>
    </div>

    <!-- Members and Permissions -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-gray-900">Miembros y Permisos</h2>
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          @click="showInviteModal = true"
        >
          ➕ Invitar Miembro
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Miembro
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Instrumentos
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permisos Especiales
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="member in projectMembers" 
              :key="member.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-medium">{{ member.name.charAt(0) }}</span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ member.name }}</div>
                    <div class="text-sm text-gray-500">{{ member.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <select
                  :value="member.role"
                  class="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  @change="updateMemberRole(member.id, $event.target.value)"
                >
                  <option 
                    v-for="role in systemRoles" 
                    :key="role.id" 
                    :value="role.id"
                  >
                    {{ role.name }}
                  </option>
                </select>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span 
                    v-for="instrument in member.instruments" 
                    :key="instrument"
                    class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {{ instrument }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <button
                  class="text-sm text-blue-600 hover:text-blue-800"
                  @click="openPermissionsModal(member)"
                >
                  {{ getSpecialPermissionsCount(member) }} especiales
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  :class="[
                    'px-2 py-1 text-xs rounded-full',
                    member.status === 'active' ? 'bg-green-100 text-green-800' :
                    member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  ]"
                >
                  {{ getStatusLabel(member.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex gap-2">
                  <button
                    class="text-blue-600 hover:text-blue-900"
                    @click="editMember(member)"
                  >
                    ✏️
                  </button>
                  <button
                    class="text-red-600 hover:text-red-900"
                    @click="removeMember(member.id)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Permission Matrix -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Matriz de Permisos</h2>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recurso
              </th>
              <th 
                v-for="role in systemRoles" 
                :key="role.id"
                class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {{ role.name }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="resource in permissionResources" 
              :key="resource.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ resource.name }}
              </td>
              <td 
                v-for="role in systemRoles" 
                :key="role.id"
                class="px-3 py-4 text-center"
              >
                <div class="flex flex-col gap-1">
                  <div 
                    v-for="action in resource.actions" 
                    :key="action"
                    class="flex items-center justify-center"
                  >
                    <span 
                      :class="[
                        'w-3 h-3 rounded-full',
                        hasPermission(role.id, resource.id, action) ? 'bg-green-500' : 'bg-red-300'
                      ]"
                      :title="`${action} ${resource.name}`"
                    ></span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-green-500 rounded-full"></span>
          <span>Permitido</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-red-300 rounded-full"></span>
          <span>Denegado</span>
        </div>
      </div>
    </div>

    <!-- Invite Member Modal -->
    <div v-if="showInviteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">Invitar Nuevo Miembro</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="inviteForm.email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="usuario@ejemplo.com"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              v-model="inviteForm.role"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option 
                v-for="role in systemRoles" 
                :key="role.id" 
                :value="role.id"
              >
                {{ role.name }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mensaje (opcional)</label>
            <textarea
              v-model="inviteForm.message"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Mensaje de invitación personalizado..."
            ></textarea>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button
            :disabled="!inviteForm.email || sending"
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            @click="sendInvite"
          >
            {{ sending ? 'Enviando...' : 'Enviar Invitación' }}
          </button>
          <button
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            @click="showInviteModal = false"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Permissions Detail Modal -->
    <div v-if="showPermissionsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h3 class="text-lg font-bold mb-4">
          Permisos Especiales - {{ selectedMember?.name }}
        </h3>
        
        <div class="space-y-4">
          <div 
            v-for="resource in permissionResources" 
            :key="resource.id"
            class="border border-gray-200 rounded-lg p-4"
          >
            <h4 class="font-medium text-gray-900 mb-2">{{ resource.name }}</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <label 
                v-for="action in resource.actions" 
                :key="action"
                class="flex items-center gap-2"
              >
                <input
                  v-model="memberPermissions[resource.id][action]"
                  type="checkbox"
                  class="rounded"
                >
                <span class="text-sm text-gray-700 capitalize">{{ action }}</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            @click="savePermissions"
          >
            Guardar Permisos
          </button>
          <button
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            @click="showPermissionsModal = false"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';

interface SystemRole {
  id: string
  name: string
  description: string
  icon: string
  permissions: string[]
}

interface ProjectMember {
  id: string
  name: string
  email: string
  role: string
  instruments: string[]
  status: 'active' | 'pending' | 'inactive'
  specialPermissions: Record<string, string[]>
}

interface PermissionResource {
  id: string
  name: string
  actions: string[]
}

const showInviteModal = ref(false);
const showPermissionsModal = ref(false);
const selectedMember = ref<ProjectMember | null>(null);
const sending = ref(false);

const inviteForm = reactive({
  email: '',
  role: 'musician',
  message: '',
});

const memberPermissions = reactive<Record<string, Record<string, boolean>>>({});

const systemRoles: SystemRole[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acceso completo al sistema',
    icon: '👑',
    permissions: ['*:*'],
  },
  {
    id: 'director',
    name: 'Director',
    description: 'Gestión completa del proyecto musical',
    icon: '🎼',
    permissions: [
      'works:create', 'works:read', 'works:update', 'works:delete',
      'evaluations:create', 'evaluations:read', 'evaluations:update', 'evaluations:delete',
      'reports:create', 'reports:read', 'reports:export',
      'members:read', 'members:update',
      'sessions:create', 'sessions:read', 'sessions:update', 'sessions:delete',
    ],
  },
  {
    id: 'assistant',
    name: 'Asistente',
    description: 'Apoyo en la gestión y evaluaciones',
    icon: '🎵',
    permissions: [
      'works:read', 'works:update',
      'evaluations:create', 'evaluations:read', 'evaluations:update',
      'reports:read',
      'members:read',
      'sessions:read', 'sessions:update',
    ],
  },
  {
    id: 'section_leader',
    name: 'Jefe de Sección',
    description: 'Liderazgo de sección instrumental',
    icon: '🎯',
    permissions: [
      'works:read',
      'evaluations:create', 'evaluations:read',
      'reports:read',
      'sessions:read',
    ],
  },
  {
    id: 'musician',
    name: 'Músico',
    description: 'Participante del proyecto',
    icon: '🎶',
    permissions: [
      'works:read',
      'evaluations:read',
      'sessions:read',
    ],
  },
];

const permissionResources: PermissionResource[] = [
  {
    id: 'works',
    name: 'Obras Musicales',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    id: 'evaluations',
    name: 'Evaluaciones',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    id: 'reports',
    name: 'Reportes',
    actions: ['create', 'read', 'export'],
  },
  {
    id: 'members',
    name: 'Miembros',
    actions: ['read', 'update', 'invite', 'remove'],
  },
  {
    id: 'sessions',
    name: 'Ensayos',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    id: 'settings',
    name: 'Configuración',
    actions: ['read', 'update'],
  },
];

const projectMembers = ref<ProjectMember[]>([
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    role: 'director',
    instruments: [],
    status: 'active',
    specialPermissions: {},
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria@ejemplo.com',
    role: 'section_leader',
    instruments: ['Violín I'],
    status: 'active',
    specialPermissions: {},
  },
  {
    id: '3',
    name: 'Carlos López',
    email: 'carlos@ejemplo.com',
    role: 'musician',
    instruments: ['Violonchelo'],
    status: 'pending',
    specialPermissions: {},
  },
]);

const hasPermission = (roleId: string, resourceId: string, action: string): boolean => {
  const role = systemRoles.find(r => r.id === roleId);
  if (!role) return false;
  
  return role.permissions.includes('*:*') || 
         role.permissions.includes(`${resourceId}:*`) ||
         role.permissions.includes(`${resourceId}:${action}`);
};

const getSpecialPermissionsCount = (member: ProjectMember): number => {
  return Object.values(member.specialPermissions).flat().length;
};

const getStatusLabel = (status: string): string => {
  const labels = {
    active: 'Activo',
    pending: 'Pendiente',
    inactive: 'Inactivo',
  };
  return labels[status] || status;
};

const updateMemberRole = async (memberId: string, newRole: string) => {
  const member = projectMembers.value.find(m => m.id === memberId);
  if (member) {
    member.role = newRole;
    // Save to backend
    console.log('Updated member role:', { memberId, newRole });
  }
};

const openPermissionsModal = (member: ProjectMember) => {
  selectedMember.value = member;
  
  // Initialize permissions object
  permissionResources.forEach(resource => {
    memberPermissions[resource.id] = {};
    resource.actions.forEach(action => {
      memberPermissions[resource.id][action] = 
        member.specialPermissions[resource.id]?.includes(action) || false;
    });
  });
  
  showPermissionsModal.value = true;
};

const savePermissions = async () => {
  if (!selectedMember.value) return;
  
  const newPermissions: Record<string, string[]> = {};
  
  Object.entries(memberPermissions).forEach(([resourceId, actions]) => {
    const allowedActions = Object.entries(actions)
      .filter(([_, allowed]) => allowed)
      .map(([action, _]) => action);
    
    if (allowedActions.length > 0) {
      newPermissions[resourceId] = allowedActions;
    }
  });
  
  selectedMember.value.specialPermissions = newPermissions;
  
  // Save to backend
  console.log('Saved permissions:', { memberId: selectedMember.value.id, permissions: newPermissions });
  
  showPermissionsModal.value = false;
};

const sendInvite = async () => {
  sending.value = true;
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newMember: ProjectMember = {
      id: `member_${Date.now()}`,
      name: inviteForm.email.split('@')[0],
      email: inviteForm.email,
      role: inviteForm.role,
      instruments: [],
      status: 'pending',
      specialPermissions: {},
    };
    
    projectMembers.value.push(newMember);
    
    // Reset form
    Object.assign(inviteForm, {
      email: '',
      role: 'musician',
      message: '',
    });
    
    showInviteModal.value = false;
    alert('Invitación enviada exitosamente');
  } catch (error) {
    console.error('Error sending invite:', error);
    alert('Error al enviar la invitación');
  } finally {
    sending.value = false;
  }
};

const editMember = (member: ProjectMember) => {
  console.log('Edit member:', member);
  // Implement edit functionality
};

const removeMember = async (memberId: string) => {
  if (confirm('¿Estás seguro de que quieres eliminar este miembro?')) {
    projectMembers.value = projectMembers.value.filter(m => m.id !== memberId);
    console.log('Removed member:', memberId);
  }
};
</script>