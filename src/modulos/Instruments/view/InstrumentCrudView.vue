<template>
  <div class="max-w-2xl mx-auto p-6 bg-white rounded shadow">
    <h1 class="text-xl font-bold mb-4">
      {{ isEdit ? "Editar Instrumento" : "Registrar Instrumento" }}
    </h1>
    <form @submit.prevent="onSubmit">
      <div class="mb-4">
        <label class="block mb-1">Nombre</label>
        <input v-model="form.nombre" type="text" class="w-full border rounded px-2 py-1" required />
      </div>
      <div class="mb-4">
        <label class="block mb-1">Serial</label>
        <input v-model="form.serial" type="text" class="w-full border rounded px-2 py-1" required />
      </div>
      <div class="mb-4">
        <label class="block mb-1">Marca</label>
        <input v-model="form.marca" type="text" class="w-full border rounded px-2 py-1" required />
      </div>
      <div class="mb-4">
        <label class="block mb-1">Modelo</label>
        <input v-model="form.model" type="text" class="w-full border rounded px-2 py-1" />
      </div>
      <div class="mb-4">
        <label class="block mb-1">Tamaño</label>
        <input v-model="form.size" type="text" class="w-full border rounded px-2 py-1" />
      </div>
      <div class="mb-4">
        <label class="block mb-1">Estado</label>
        <select v-model="form.state" class="w-full border rounded px-2 py-1" required>
          <option value="">Seleccione</option>
          <option value="disponible">Disponible</option>
          <option value="asignado">Asignado</option>
          <option value="dañado">Dañado</option>
          <option value="en reparación">En reparación</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="block mb-1">Familia</label>
        <select v-model="form.familia" class="w-full border rounded px-2 py-1" required>
          <option value="">Seleccione</option>
          <option v-for="fam in familias" :key="fam" :value="fam">{{ fam }}</option>
        </select>
      </div>
      <!-- Accesorios (puedes mejorar con un componente aparte) -->
      <div class="mb-4">
        <label class="block mb-1">Accesorios</label>
        <div v-for="(acc, i) in form.accesorios" :key="i" class="flex gap-2 mb-2">
          <input
            v-model="acc.nombre"
            placeholder="Nombre"
            class="border rounded px-2 py-1 flex-1"
          />
          <input
            v-model="acc.estado"
            placeholder="Estado"
            class="border rounded px-2 py-1 flex-1"
          />
          <input
            v-model="acc.observaciones"
            placeholder="Observaciones"
            class="border rounded px-2 py-1 flex-1"
          />
          <button type="button" class="text-red-600" @click="removeAccesorio(i)">Eliminar</button>
        </div>
        <button type="button" class="px-2 py-1 bg-gray-200 rounded" @click="addAccesorio">
          Agregar accesorio
        </button>
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <button type="button" class="px-3 py-1 bg-gray-300 rounded" @click="onCancel">
          Cancelar
        </button>
        <button type="submit" class="px-3 py-1 bg-blue-600 text-white rounded">
          {{ isEdit ? "Guardar Cambios" : "Registrar" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import {ref} from "vue"
import type {InstrumentFirestore, InstrumentAccessory} from "../../../types/instrumento"
import {createInstrument, updateInstrument} from "../service/instruments"
import {useRouter} from "vue-router"

const router = useRouter()
const saving = ref(false)
const saveError = ref<string | null>(null)

const props = defineProps<{instrument?: InstrumentFirestore}>()
const emit = defineEmits(["save", "cancel"])

const isEdit = !!props.instrument

const familias = ["cuerdas", "maderas", "metales", "percusion", "coro", "accesorios"]

const form = ref<InstrumentFirestore>({
  nombre: props.instrument?.nombre || "",
  serial: props.instrument?.serial || "",
  marca: props.instrument?.marca || "",
  model: props.instrument?.model || "",
  size: props.instrument?.size || "",
  state: props.instrument?.state || "",
  familia: props.instrument?.familia || "",
  accesorios: props.instrument?.accesorios ? [...props.instrument.accesorios] : [],
})

function addAccesorio() {
  form.value.accesorios = form.value.accesorios || []
  form.value.accesorios.push({nombre: "", estado: "", observaciones: ""})
}
function removeAccesorio(i: number) {
  form.value.accesorios?.splice(i, 1)
}

async function onSubmit() {
  if (
    !form.value.nombre ||
    !form.value.serial ||
    !form.value.marca ||
    !form.value.state ||
    !form.value.familia
  )
    return
  saving.value = true
  saveError.value = null
  try {
    if (isEdit && props.instrument?.id) {
      await updateInstrument(props.instrument.id, form.value)
    } else {
      await createInstrument(form.value)
    }
    router.push({name: "InstrumentList"})
  } catch (e: any) {
    saveError.value = e.message || "Error al guardar"
  } finally {
    saving.value = false
  }
}

function onCancel() {
  router.push({name: "InstrumentList"})
}
</script>
