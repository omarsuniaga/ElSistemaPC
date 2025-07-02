<template>
  <component :is="iconComponent" v-if="iconComponent" :class="['icon', iconClass]" />
  <span v-else class="icon-fallback">{{ name }}</span>
</template>

<script lang="ts">
import {defineComponent, computed} from "vue"
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ExclamationCircleIcon,
  PlusIcon,
  PlusCircleIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  CheckIcon,
  CheckCircleIcon,
  TrashIcon,
  ClockIcon,
  BoltIcon,
  ArrowPathIcon,
  XCircleIcon,
  CogIcon,
  ArrowsRightLeftIcon,
  PlayIcon,
  StopIcon,
} from "@heroicons/vue/24/outline"

export default defineComponent({
  name: "Icon",
  props: {
    name: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const iconMap: Record<string, any> = {
      // Info and alerts
      info: InformationCircleIcon,
      "alert-triangle": ExclamationTriangleIcon,
      "alert-octagon": ExclamationCircleIcon,
      phone: PhoneIcon,

      // Actions
      plus: PlusIcon,
      "plus-circle": PlusCircleIcon,
      send: PaperAirplaneIcon,
      "paper-airplane": PaperAirplaneIcon,
      x: XMarkIcon,
      check: CheckIcon,
      "check-circle": CheckCircleIcon,
      "trash-2": TrashIcon,
      trash: TrashIcon,

      // Status and time
      clock: ClockIcon,
      zap: BoltIcon,
      bolt: BoltIcon,
      refresh: ArrowPathIcon,
      "rotate-ccw": ArrowPathIcon,
      "arrow-path": ArrowPathIcon,
      "x-circle": XCircleIcon,
      cog: CogIcon,
      settings: CogIcon,

      // Media controls
      play: PlayIcon,
      stop: StopIcon,

      // Spinner (using a div for now)
      spinner: "div",
    }

    const iconComponent = computed(() => {
      return iconMap[props.name] || null
    })

    const iconClass = computed(() => {
      const baseClasses = "w-5 h-5"
      const customClasses = props.class
      const spinnerClass =
        props.name === "spinner"
          ? "animate-spin rounded-full border-2 border-current border-t-transparent"
          : ""

      return [baseClasses, customClasses, spinnerClass].filter(Boolean).join(" ")
    })

    return {
      iconComponent,
      iconClass,
    }
  },
})
</script>

<style scoped>
.icon {
  display: inline-block;
  flex-shrink: 0;
}

.icon-fallback {
  font-size: 0.8em;
  opacity: 0.7;
  font-style: italic;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
