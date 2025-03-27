<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useClassesStore } from '../store/classes';
import { useTeachersStore } from '@/modulos/Teachers/store/teachers';
import { useStudentsStore } from '@/modulos/Students/store/students';
import ClassDetail from '../components/ClassDetail.vue';
import ClassCard from '../components/ClassCard.vue';
import ClassForm from '../components/ClassForm.vue';
import ClassStudentManager from '../components/ClassStudentManager.vue';
import UpcomingClassesList from '../components/UpcomingClassesList.vue';
import { PlusIcon, ViewColumnsIcon, ViewListIcon } from '@heroicons/vue/24/outline';
import { useToast } from '@/components/ui/toast/use-toast';
import { Dialog, DialogPanel, DialogOverlay, TransitionRoot, TransitionChild } from '@headlessui/vue';

// Stores
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();

// Toast
const { toast } = useToast();

// Estados
const loading = ref(true);
const selectedClassId = ref('');
const showDetail = ref(false);
const showForm = ref(false);
const isEditing = ref(false);
const showStudentManager = ref(false);
const viewType = ref('grid'); // 'grid' o 'list'
const isMobile = ref(window.innerWidth < 768);

// Computed
const selectedClass = computed(() => {
  if (!selectedClassId.value) return null;
  return classesStore.getClassById(selectedClassId.value);
});

// Función helper para limpiar el objeto y eliminar propiedades vacías
function cleanData(obj: any): any {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value === null || value === undefined) return;
    if (typeof value === 'string' && value.trim() === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedValue = cleanData(value);
      if (Object.keys(cleanedValue).length > 0) {
        cleaned[key] = cleanedValue;
      }
      return;
    }
    cleaned[key] = value;
  });
  return cleaned;
}

// Manejo del guardado de clase
const handleSaveClass = async (classData: any) => {
  try {
    // Validación mínima
    if (!classData.name || !classData.level) {
      toast({
        title: "Error",
        description: "El nombre y nivel son obligatorios",
        variant: "destructive"
      });
      return;
    }

    // Preparar datos y limpiar propiedades vacías
    const preparedData = cleanData({
      name: classData.name.trim(),
      description: classData.description?.trim(),
      level: classData.level,
      teacherId: classData.teacherId,
      classroom: classData.classroom?.trim(),
      instrument: classData.instrument?.trim(),
      schedule: {
        slots: (classData.schedule?.slots || []).map((slot: any) => cleanData({
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime
        }))
      },
      studentIds: classData.studentIds
    });

    if (isEditing.value) {
      // Actualizar clase existente
      await classesStore.updateClass({
        ...preparedData,
        id: selectedClassId.value
      });
      toast({
        title: "Clase Actualizada",
        description: `La clase "${preparedData.name}" ha sido actualizada exitosamente.`
      });
    } else {
      // Crear nueva clase
      const newClass = await classesStore.addClass(preparedData);
      toast({
        title: "Clase Creada",
        description: `La clase "${preparedData.name}" ha sido creada exitosamente.`
      });
      selectedClassId.value = newClass.id;
    }
    showForm.value = false;
  } catch (error) {
    console.error('Error al guardar la clase:', error);
    toast({
      title: "Error",
      description: "No se pudo guardar la clase. Intente nuevamente.",
      variant: "destructive"
    });
  }
};

// Otros métodos (handleViewClass, handleEditClass, etc.) se mantienen según tu lógica original

onMounted(async () => {
  loading.value = true;
  try {
    // Ejemplo: Setup del listener en tiempo real y carga de datos adicionales
    const unsubscribeClasses = classesStore.setupRealTimeListener && classesStore.setupRealTimeListener();
    await Promise.all([
      teachersStore.fetchTeachers && teachersStore.fetchTeachers(),
      studentsStore.fetchStudents && studentsStore.fetchStudents()
    ]);
  } catch (error) {
    console.error('Error cargando datos:', error);
    toast({
      title: "Error de Carga",
      description: "No se pudieron cargar todos los datos. Intente recargar la página.",
      variant: "destructive"
    });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Clases</h1>
      <div class="flex space-x-2">
        <button 
          @click="toggleViewType" 
          class="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200"
        >
          <ViewColumnsIcon v-if="viewType === 'list'" class="h-5 w-5" />
          <ViewListIcon v-else class="h-5 w-5" />
        </button>
        <button 
          @click="handleAddClass" 
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon class="w-5 h-5" />
          <span>Nueva Clase</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <!-- Class List -->
    <div v-else-if="!showDetail && !showForm && !showStudentManager" class="flex-1">
      <!-- Upcoming Classes Section -->
      <div class="mb-8" v-if="classesStore.upcomingClasses?.length > 0"></div>
        <UpcomingClassesList :classes="upcomingClasses" />
      </div>
      <!-- Main Class List -->
      <div :class="{'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6': viewType === 'grid'}">
        <template v-if="classesStore.classes.length > 0">
          <div v-for="classItem in classesStore.classes" :key="classItem.id">
            <ClassCard 
              v-if="viewType === 'grid'"
              :classData="classItem"
              :studentCount="classItem.studentIds?.length || 0"
              :topStudents="getTopStudents(classItem)"
              @edit="handleEditClass"
              @delete="handleDeleteClass"
              @manage-students="handleManageStudents"
              @click="handleViewClass(classItem.id)"
            />
            
            <div 
              v-else
              @click="handleViewClass(classItem.id)"
              class="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow cursor-pointer hover:shadow-md"
            >
              <div class="flex justify-between">
                <div>
                  <h3 class="font-medium">{{ classItem.name }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ classItem.level }} - {{ classItem.instrument || 'Sin instrumento' }}
                  </p>
                </div>
                <div class="text-right">
                  <span class="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                    {{ classItem.studentIds?.length || 0 }} estudiantes
                  </span>
                </div>
              </div>
              
              <div class="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400 z-200">
                <div>Aula: {{ classItem.classroom || 'Sin asignar' }}</div>
                <div class="flex space-x-2">
                  <button @click.stop="handleEditClass(classItem.id)" class="text-blue-600 dark:text-blue-400 ">Editar</button>
                  <button @click.stop="handleManageStudents(classItem.id)" class="text-purple-600 dark:text-purple-400">Estudiantes</button>
                  <button @click.stop="handleDeleteClass(classItem.id)" class="text-red-600 dark:text-red-400">Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <div v-else class="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
          No hay clases registradas.
          <button @click="handleAddClass" class="ml-2 text-blue-500 hover:underline">Crear una nueva clase</button>
        </div>
      </div>
    </div>

    <!-- Class Detail -->
    <ClassDetail 
      v-if="showDetail && selectedClass"
      :selectedClass="selectedClass"
      :isMobile="isMobile"
      :showMobileDetail="showDetail"
      @go-back="handleCloseDetail"
      @show-student-list="handleManageStudents"
      @handle-edit="handleEditClass"
      @handle-delete="handleDeleteClass"
    />

    <!-- Class Form Modal -->
    <TransitionRoot appear :show="showForm">
      <Dialog as="div" class="fixed inset-0 z-50 overflow-y-auto" @close="showForm = false">
        <div class="min-h-screen px-4 text-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="ease-in duration-200"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <DialogOverlay class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          </TransitionChild>

          <!-- This element is to trick the browser into centering the modal contents. -->
          <span class="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
          
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
              <h2 class="text-xl font-semibold mb-4">{{ isEditing ? 'Editar Clase' : 'Nueva Clase' }}</h2>
              <ClassForm 
                :class-data="isEditing ? selectedClass : null"
                @save="handleSaveClass"
                @cancel="showForm = false"
              />
        </div>
      </div>
    </div>

    <!-- Student Manager Modal -->
    <TransitionRoot appear :show="showStudentManager && selectedClass !== null">
      <Dialog as="div" class="fixed inset-0 z-50 overflow-y-auto" @close="showStudentManager = false">
        <div class="min-h-screen px-4 text-center">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0"
            enter-to="opacity-100"
            leave="ease-in duration-200"
            leave-from="opacity-100"
            leave-to="opacity-0"
          >
            <DialogOverlay class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          </TransitionChild>

          <!-- This element is to trick the browser into centering the modal contents. -->
          <span class="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
          
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
              <h2 class="text-xl font-semibold mb-4">Gestionar Estudiantes - {{ selectedClass?.name }}</h2>
              <ClassStudentManager 
                :class-id="selectedClass?.id"
                :student-ids="selectedClass?.studentIds || []"
                @update="handleStudentChange"
                @close="showStudentManager = false"
              />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>