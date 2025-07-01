<template>
  <div class="virtual-list" :style="{height: `${height}px`}">
    <div class="virtual-list__container" :style="{height: `${totalSize}px`}">
      <div
        v-for="item in visibleItems"
        :key="itemKey ? item[itemKey] : item.id"
        class="virtual-list__item"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${item.offset}px)`,
        }"
      >
        <slot name="item" :item="item.data" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted, watch} from "vue"

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  itemSize: {
    type: Number,
    default: 48,
  },
  overscan: {
    type: Number,
    default: 5,
  },
  itemKey: {
    type: String,
    default: "id",
  },
})

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const height = ref(400) // Altura fija por defecto

const totalSize = computed(() => props.items.length * props.itemSize)

const visibleItems = computed(() => {
  const startIndex = Math.max(0, Math.floor(scrollTop.value / props.itemSize) - props.overscan)

  const endIndex = Math.min(
    props.items.length - 1,
    Math.ceil((scrollTop.value + height.value) / props.itemSize - 1) + props.overscan
  )

  return props.items.slice(startIndex, endIndex + 1).map((item, index) => ({
    data: item,
    offset: (startIndex + index) * props.itemSize,
  }))
})

const handleScroll = () => {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop
  }
}

const updateHeight = () => {
  if (containerRef.value) {
    height.value = containerRef.value.clientHeight
  }
}

const resizeObserver = new ResizeObserver(updateHeight)

onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener("scroll", handleScroll, {passive: true})
    resizeObserver.observe(containerRef.value)
    updateHeight()
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener("scroll", handleScroll)
  }
  resizeObserver.disconnect()
})

watch(
  () => props.items,
  () => {
    // Forzar actualización cuando cambian los elementos
    if (containerRef.value) {
      updateHeight()
    }
  },
  {deep: true}
)
</script>

<style scoped>
.virtual-list {
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
}

.virtual-list__container {
  position: relative;
  width: 100%;
}

.virtual-list__item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  will-change: transform;
}
</style>
