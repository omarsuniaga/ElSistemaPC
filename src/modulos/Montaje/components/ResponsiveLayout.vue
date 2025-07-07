<template>
  <div :class="[
    'min-h-screen transition-colors duration-200',
    themeClasses.background
  ]">
    <!-- Mobile Header -->
    <header 
      v-if="isMobile"
      :class="[
        'sticky top-0 z-40 border-b',
        navigationClasses.header,
        themeClasses.surface,
        themeClasses.border
      ]"
    >
      <div class="flex items-center justify-between h-full px-4">
        <div class="flex items-center gap-3">
          <button
            @click="toggleMobileSidebar"
            :class="[
              'p-2 rounded-lg',
              themeClasses.hover,
              themeClasses.text.primary
            ]"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 :class="['text-lg font-bold', themeClasses.text.primary]">
            {{ title }}
          </h1>
        </div>
        
        <div class="flex items-center gap-2">
          <slot name="header-actions" />
          <ThemeSelector />
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Desktop Sidebar -->
      <aside 
        v-if="isDesktop"
        :class="[
          'fixed inset-y-0 left-0 z-30 border-r transition-transform duration-200',
          navigationClasses.sidebar,
          themeClasses.surface,
          themeClasses.border
        ]"
      >
        <div class="flex flex-col h-full">
          <!-- Desktop Header -->
          <div :class="['flex items-center justify-between p-6 border-b', themeClasses.border]">
            <h1 :class="['text-xl font-bold', themeClasses.text.primary]">
              {{ title }}
            </h1>
            <ThemeSelector />
          </div>
          
          <!-- Sidebar Content -->
          <div class="flex-1 overflow-y-auto">
            <slot name="sidebar" />
          </div>
        </div>
      </aside>

      <!-- Mobile Sidebar Overlay -->
      <div 
        v-if="isMobile && showMobileSidebar"
        class="fixed inset-0 z-50 flex"
      >
        <!-- Backdrop -->
        <div 
          @click="closeMobileSidebar"
          class="fixed inset-0 bg-black bg-opacity-50"
        ></div>
        
        <!-- Sidebar -->
        <aside :class="[
          'relative w-80 max-w-[80vw] h-full border-r',
          themeClasses.surface,
          themeClasses.border
        ]">
          <div class="flex flex-col h-full">
            <!-- Mobile Sidebar Header -->
            <div :class="['flex items-center justify-between p-4 border-b', themeClasses.border]">
              <h1 :class="['text-lg font-bold', themeClasses.text.primary]">
                {{ title }}
              </h1>
              <button
                @click="closeMobileSidebar"
                :class="[
                  'p-2 rounded-lg',
                  themeClasses.hover,
                  themeClasses.text.primary
                ]"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- Mobile Sidebar Content -->
            <div class="flex-1 overflow-y-auto">
              <slot name="sidebar" />
            </div>
          </div>
        </aside>
      </div>

      <!-- Main Content -->
      <main :class="[
        'flex-1 min-h-screen',
        navigationClasses.content,
        isMobile ? 'pt-0' : 'pt-0'
      ]">
        <div :class="containerClasses">
          <div :class="cardClasses.spacing">
            <slot name="content" />
          </div>
        </div>
      </main>
    </div>

    <!-- Mobile Bottom Navigation (if needed) -->
    <nav 
      v-if="isMobile && showBottomNav"
      :class="[
        'fixed bottom-0 left-0 right-0 z-40 border-t',
        themeClasses.surface,
        themeClasses.border
      ]"
    >
      <div class="flex items-center justify-around h-16 px-4">
        <slot name="bottom-nav" />
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '../composables/useTheme'
import { useResponsive } from '../composables/useResponsive'
import ThemeSelector from './ThemeSelector.vue'

interface Props {
  title?: string
  showBottomNav?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Montaje',
  showBottomNav: false
})

const { themeClasses } = useTheme()
const { 
  isMobile, 
  isDesktop, 
  containerClasses, 
  navigationClasses, 
  cardClasses 
} = useResponsive()

const showMobileSidebar = ref(false)

const toggleMobileSidebar = () => {
  showMobileSidebar.value = !showMobileSidebar.value
}

const closeMobileSidebar = () => {
  showMobileSidebar.value = false
}
</script>