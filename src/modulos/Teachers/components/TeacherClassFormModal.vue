<script setup lang="ts">
import { Dialog, DialogPanel, DialogOverlay, TransitionRoot, TransitionChild } from '@headlessui/vue';
import ClassForm from '@/modulos/Classes/components/ClassForm.vue';
import type { ClassData } from '../types/teacherTypes'; // Assuming types are moved

const props = defineProps<{ 
  show: boolean;
  isEditing: boolean;
  classData: Partial<ClassData> | null;
}>();
const emit = defineEmits(['update:show', 'save', 'cancel']);

const closeModal = () => {
  emit('update:show', false);
  emit('cancel'); // Also emit cancel for consistency
};

const handleSave = (data: Partial<ClassData>) => {
  emit('save', data);
  // Optionally close modal on save, or let the parent handle it
  // closeModal(); 
};
</script>

<template>
  <TransitionRoot appear :show="show">
    <Dialog as="div" class="fixed inset-0 z-50 overflow-y-auto" @close="closeModal">
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
              :class-data="classData"
              @save="handleSave"
              @cancel="closeModal"
            />
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
