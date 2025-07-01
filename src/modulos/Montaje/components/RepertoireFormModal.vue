<template>
  <div
    class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="$emit('close')"
  >
    <div
      class="modal-content bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ isEdit ? "Editar Repertorio" : "Nuevo Repertorio" }}
          </h2>
          <button class="text-gray-400 hover:text-gray-600" @click="$emit('close')">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Información Básica -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Repertorio *
              </label>
              <input
                v-model="form.nombre"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Repertorio Navideño 2024"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Tipo * </label>
              <select
                v-model="form.tipo"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar tipo</option>
                <option v-for="tipo in tiposRepertorio" :key="tipo" :value="tipo">
                  {{ tipo }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Descripción </label>
            <textarea
              v-model="form.descripcion"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del repertorio..."
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Dificultad *
              </label>
              <select
                v-model="form.nivelDificultad"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar nivel</option>
                <option v-for="nivel in [1, 2, 3, 4, 5]" :key="nivel" :value="nivel">
                  Nivel {{ nivel }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Estado </label>
              <select
                v-model="form.estado"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option v-for="estado in estadosRepertorio" :key="estado" :value="estado">
                  {{ estado.replace("_", " ") }}
                </option>
              </select>
            </div>
          </div>

          <!-- Fechas -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Fecha de Inicio </label>
              <input
                v-model="form.fechaInicio"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Fecha Objetivo </label>
              <input
                v-model="form.fechaObjetivo"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Etiquetas -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Etiquetas </label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span
                v-for="(etiqueta, index) in form.etiquetas"
                :key="index"
                class="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
              >
                {{ etiqueta }}
                <button
                  type="button"
                  class="ml-2 text-blue-600 hover:text-blue-800"
                  @click="removeEtiqueta(index)"
                >
                  ×
                </button>
              </span>
            </div>
            <div class="flex gap-2">
              <input
                v-model="newEtiqueta"
                type="text"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agregar etiqueta"
                @keyup.enter="addEtiqueta"
              />
              <button
                type="button"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                @click="addEtiqueta"
              >
                Agregar
              </button>
            </div>
          </div>

          <!-- Obras Incluidas -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Obras Incluidas </label>
            <div class="border border-gray-300 rounded-md p-4 max-h-40 overflow-y-auto">
              <div v-if="availableWorks.length === 0" class="text-gray-500 text-center py-4">
                No hay obras disponibles
              </div>
              <label
                v-for="work in availableWorks"
                :key="work.id"
                class="flex items-center space-x-2 py-1"
              >
                <input
                  v-model="form.obras"
                  type="checkbox"
                  :value="work.id"
                  class="rounded border-gray-300"
                />
                <span class="text-sm">{{ work.titulo }}</span>
                <span class="text-xs text-gray-500">({{ work.compositor }})</span>
              </label>
            </div>
          </div>

          <!-- Metadatos -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Metadatos Adicionales
            </label>
            <div class="space-y-3">
              <div v-for="(value, key) in form.metadatos" :key="key" class="flex gap-2">
                <input
                  :value="key"
                  type="text"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Clave"
                  @input="updateMetadataKey($event, key)"
                />
                <input
                  v-model="form.metadatos[key]"
                  type="text"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Valor"
                />
                <button
                  type="button"
                  class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  @click="removeMetadata(key)"
                >
                  ×
                </button>
              </div>
              <button
                type="button"
                class="text-blue-600 hover:text-blue-800 text-sm"
                @click="addMetadata"
              >
                + Agregar metadato
              </button>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              @click="$emit('close')"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import type {Repertorio, TipoRepertorio, EstadoRepertorio, Obra} from "../types"
import {useMontaje} from "../composables/useMontaje"

interface Props {
  repertoire?: Repertorio
  isEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
})

const emit = defineEmits<{
  close: []
  save: [repertoire: Repertorio]
}>()

const {getAllWorks} = useMontaje()

const loading = ref(false)
const availableWorks = ref<Obra[]>([])
const newEtiqueta = ref("")

const tiposRepertorio: TipoRepertorio[] = [
  "SINFONICA",
  "CAMARA",
  "CORAL",
  "BANDA",
  "SOLISTA",
  "CONJUNTO",
]

const estadosRepertorio: EstadoRepertorio[] = [
  "BORRADOR",
  "EN_REVISION",
  "APROBADO",
  "EN_MONTAJE",
  "SUSPENDIDO",
  "COMPLETADO",
]

const form = ref({
  nombre: props.repertoire?.nombre || "",
  descripcion: props.repertoire?.descripcion || "",
  tipo: props.repertoire?.tipo || ("" as TipoRepertorio),
  estado: props.repertoire?.estado || ("BORRADOR" as EstadoRepertorio),
  nivelDificultad: props.repertoire?.nivelDificultad || 1,
  fechaInicio: props.repertoire?.fechaInicio
    ? new Date(props.repertoire.fechaInicio).toISOString().split("T")[0]
    : "",
  fechaObjetivo: props.repertoire?.fechaObjetivo
    ? new Date(props.repertoire.fechaObjetivo).toISOString().split("T")[0]
    : "",
  etiquetas: [...(props.repertoire?.etiquetas || [])],
  obras: [...(props.repertoire?.obras || [])],
  metadatos: {...(props.repertoire?.metadatos || {})},
})

const loadWorks = async () => {
  try {
    availableWorks.value = await getAllWorks()
  } catch (error) {
    console.error("Error loading works:", error)
  }
}

const addEtiqueta = () => {
  if (newEtiqueta.value.trim() && !form.value.etiquetas.includes(newEtiqueta.value.trim())) {
    form.value.etiquetas.push(newEtiqueta.value.trim())
    newEtiqueta.value = ""
  }
}

const removeEtiqueta = (index: number) => {
  form.value.etiquetas.splice(index, 1)
}

const addMetadata = () => {
  const key = `metadata_${Object.keys(form.value.metadatos).length + 1}`
  form.value.metadatos[key] = ""
}

const removeMetadata = (key: string) => {
  delete form.value.metadatos[key]
}

const updateMetadataKey = (event: Event, oldKey: string) => {
  const newKey = (event.target as HTMLInputElement).value
  if (newKey !== oldKey && newKey.trim()) {
    const value = form.value.metadatos[oldKey]
    delete form.value.metadatos[oldKey]
    form.value.metadatos[newKey] = value
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const repertoireData: Partial<Repertorio> = {
      ...form.value,
      fechaInicio: form.value.fechaInicio ? new Date(form.value.fechaInicio) : undefined,
      fechaObjetivo: form.value.fechaObjetivo ? new Date(form.value.fechaObjetivo) : undefined,
    }

    if (props.isEdit && props.repertoire) {
      repertoireData.id = props.repertoire.id
    }

    emit("save", repertoireData as Repertorio)
  } catch (error) {
    console.error("Error saving repertoire:", error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadWorks()
})
</script>
