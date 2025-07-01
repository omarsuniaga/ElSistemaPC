<template>
  <div
    v-if="props.show"
    class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded shadow-lg p-6 w-full max-w-md">
      <h2 class="text-lg font-bold mb-4">Buscar Instrumento</h2>
      <form @submit.prevent="applySearch">
        <input
          v-model="searchTerm"
          type="text"
          class="w-full border rounded px-2 py-1 mb-4"
          placeholder="Buscar por nombre, serial o marca..."
          autofocus
        />
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="px-3 py-1 bg-gray-300 rounded"
            @click="emit('update:show', false)"
          >
            Cancelar
          </button>
          <button type="submit" class="px-3 py-1 bg-green-600 text-white rounded">Buscar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref, watch} from "vue"
const props = defineProps<{show: boolean}>()
const emit = defineEmits(["update:show", "apply-search"])

const searchTerm = ref("")

function applySearch() {
  emit("apply-search", searchTerm.value)
}

watch(
  () => props.show,
  (val) => {
    if (!val) {
      searchTerm.value = ""
    }
  }
)
</script>
