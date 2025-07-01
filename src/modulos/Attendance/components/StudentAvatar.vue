<script setup lang="ts">
import {computed, ref} from "vue"
import AppImage from "@/components/ui/AppImage.vue"

const props = defineProps({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "md",
    validator: (value: string) => ["sm", "md", "lg"].includes(value),
  },
})

const showFallback = ref(false)

const initials = computed(() => {
  const first = props.firstName?.charAt(0) || ""
  const last = props.lastName?.charAt(0) || ""
  return `${first}${last}`.toUpperCase()
})

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
}

const backgroundColor = computed(() => {
  const name = `${props.firstName} ${props.lastName}`.toLowerCase()
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-teal-500",
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
})

const handleImageError = () => {
  showFallback.value = true
}
</script>

<template>
  <div class="relative">
    <!-- Fallback a iniciales cuando no hay imagen o falla la carga -->
    <div
      v-if="!imageUrl || showFallback"
      :class="[
        'rounded-full flex items-center justify-center text-white overflow-hidden',
        sizeClasses[size],
        backgroundColor,
      ]"
    >
      {{ initials }}
    </div>

    <!-- Imagen de perfil -->
    <div v-else :class="['rounded-full overflow-hidden', sizeClasses[size]]">
      <AppImage
        :src="imageUrl"
        :alt="`Foto de ${firstName} ${lastName}`"
        :rounded="true"
        :img-class="'w-full h-full object-cover'"
        @error="handleImageError"
      >
        <template #fallback>
          <div :class="['w-full h-full flex items-center justify-center', backgroundColor]">
            <span class="text-white">{{ initials }}</span>
          </div>
        </template>
      </AppImage>
    </div>
  </div>
</template>
