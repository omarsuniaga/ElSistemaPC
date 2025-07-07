import { ref, computed, onMounted, onUnmounted } from 'vue'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface BreakpointConfig {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

const breakpoints: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export function useResponsive() {
  const windowWidth = ref(0)
  const windowHeight = ref(0)

  // Update window dimensions
  const updateDimensions = () => {
    if (typeof window !== 'undefined') {
      windowWidth.value = window.innerWidth
      windowHeight.value = window.innerHeight
    }
  }

  // Current breakpoint
  const currentBreakpoint = computed((): Breakpoint => {
    const width = windowWidth.value
    
    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
  })

  // Breakpoint checks
  const isXs = computed(() => currentBreakpoint.value === 'xs')
  const isSm = computed(() => currentBreakpoint.value === 'sm')
  const isMd = computed(() => currentBreakpoint.value === 'md')
  const isLg = computed(() => currentBreakpoint.value === 'lg')
  const isXl = computed(() => currentBreakpoint.value === 'xl')
  const is2xl = computed(() => currentBreakpoint.value === '2xl')

  // Size categories
  const isMobile = computed(() => windowWidth.value < breakpoints.md)
  const isTablet = computed(() => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg)
  const isDesktop = computed(() => windowWidth.value >= breakpoints.lg)

  // Responsive utilities
  const greaterThan = (breakpoint: Breakpoint) => {
    return computed(() => windowWidth.value >= breakpoints[breakpoint])
  }

  const lessThan = (breakpoint: Breakpoint) => {
    return computed(() => windowWidth.value < breakpoints[breakpoint])
  }

  const between = (min: Breakpoint, max: Breakpoint) => {
    return computed(() => 
      windowWidth.value >= breakpoints[min] && windowWidth.value < breakpoints[max]
    )
  }

  // Grid columns based on breakpoint
  const getGridCols = (config: Partial<Record<Breakpoint, number>>) => {
    return computed(() => {
      const bp = currentBreakpoint.value
      
      // Find the appropriate column count for current breakpoint
      const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']
      
      for (const breakpoint of breakpointOrder) {
        if (windowWidth.value >= breakpoints[breakpoint] && config[breakpoint]) {
          return config[breakpoint]
        }
      }
      
      return config.xs || 1
    })
  }

  // Container classes
  const containerClasses = computed(() => {
    const base = 'mx-auto px-4 sm:px-6 lg:px-8'
    
    if (windowWidth.value >= breakpoints['2xl']) return `${base} max-w-7xl`
    if (windowWidth.value >= breakpoints.xl) return `${base} max-w-6xl`
    if (windowWidth.value >= breakpoints.lg) return `${base} max-w-5xl`
    if (windowWidth.value >= breakpoints.md) return `${base} max-w-4xl`
    if (windowWidth.value >= breakpoints.sm) return `${base} max-w-2xl`
    return `${base} max-w-full`
  })

  // Navigation classes for mobile/desktop
  const navigationClasses = computed(() => ({
    mobile: isMobile.value,
    desktop: isDesktop.value,
    sidebar: isDesktop.value ? 'w-64' : 'w-full',
    content: isDesktop.value ? 'ml-64' : 'ml-0',
    header: isMobile.value ? 'h-16' : 'h-20'
  }))

  // Modal classes
  const modalClasses = computed(() => ({
    container: isMobile.value ? 'p-4' : 'p-6',
    content: isMobile.value ? 'max-w-full' : 'max-w-2xl',
    padding: isMobile.value ? 'p-4' : 'p-6'
  }))

  // Table classes
  const tableClasses = computed(() => ({
    responsive: isMobile.value,
    container: isMobile.value ? 'overflow-x-auto' : '',
    cell: isMobile.value ? 'min-w-[120px]' : ''
  }))

  // Form classes
  const formClasses = computed(() => ({
    grid: isMobile.value ? 'grid-cols-1' : 'grid-cols-2',
    spacing: isMobile.value ? 'space-y-4' : 'space-y-6',
    button: isMobile.value ? 'w-full' : 'w-auto'
  }))

  // Card classes
  const cardClasses = computed(() => ({
    grid: getGridCols({
      xs: 1,
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
      '2xl': 4
    }).value,
    padding: isMobile.value ? 'p-4' : 'p-6',
    spacing: isMobile.value ? 'space-y-4' : 'space-y-6'
  }))

  // Text size classes
  const textClasses = computed(() => ({
    title: isMobile.value ? 'text-xl' : 'text-2xl',
    subtitle: isMobile.value ? 'text-lg' : 'text-xl',
    body: 'text-base',
    small: isMobile.value ? 'text-xs' : 'text-sm'
  }))

  // Setup event listeners
  onMounted(() => {
    updateDimensions()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateDimensions)
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateDimensions)
    }
  })

  return {
    // Dimensions
    windowWidth: computed(() => windowWidth.value),
    windowHeight: computed(() => windowHeight.value),
    
    // Breakpoints
    currentBreakpoint,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    
    // Categories
    isMobile,
    isTablet,
    isDesktop,
    
    // Utilities
    greaterThan,
    lessThan,
    between,
    getGridCols,
    
    // Classes
    containerClasses,
    navigationClasses,
    modalClasses,
    tableClasses,
    formClasses,
    cardClasses,
    textClasses,
    
    // Methods
    updateDimensions
  }
}