// src/utils/optimization/imageOptimizer.ts
/**
 * Optimizador automático de imágenes con múltiples formatos y tamaños
 */

import {logger} from "@/utils/logging/logger"
import {smartCache} from "@/utils/cache/smartCache"

interface ImageOptimizationOptions {
  quality: number
  maxWidth: number
  maxHeight: number
  format: "webp" | "jpeg" | "png" | "auto"
  enableLazyLoading: boolean
  generateSrcSet: boolean
  sizes: number[]
}

interface OptimizedImage {
  url: string
  width: number
  height: number
  format: string
  size: number
  srcSet?: string
}

interface ImageLoadingState {
  loading: boolean
  error: string | null
  progress: number
}

class ImageOptimizer {
  private static instance: ImageOptimizer
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private loadingStates = new Map<string, ImageLoadingState>()

  private defaultOptions: ImageOptimizationOptions = {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    format: "auto",
    enableLazyLoading: true,
    generateSrcSet: true,
    sizes: [320, 640, 960, 1280, 1920],
  }

  private constructor() {
    this.canvas = document.createElement("canvas")
    this.ctx = this.canvas.getContext("2d")!
  }

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer()
    }
    return ImageOptimizer.instance
  }

  async optimizeImage(
    source: File | string | HTMLImageElement,
    options: Partial<ImageOptimizationOptions> = {}
  ): Promise<OptimizedImage> {
    const opts = {...this.defaultOptions, ...options}
    const cacheKey = this.generateCacheKey(source, opts)

    // Verificar cache primero
    const cached = smartCache.get<OptimizedImage>(cacheKey)
    if (cached) {
      logger.debug("IMAGE_OPTIMIZER", "Imagen optimizada obtenida del cache")
      return cached
    }

    try {
      // Cargar imagen
      const img = await this.loadImage(source)

      // Calcular dimensiones optimizadas
      const {width, height} = this.calculateOptimalSize(img, opts)

      // Detectar formato óptimo
      const format = this.detectOptimalFormat(opts.format, img)

      // Optimizar imagen
      const optimized = await this.processImage(img, width, height, format, opts.quality)

      // Generar srcSet si es necesario
      let srcSet: string | undefined
      if (opts.generateSrcSet) {
        srcSet = await this.generateSrcSet(img, opts)
      }

      const result: OptimizedImage = {
        url: optimized.url,
        width: optimized.width,
        height: optimized.height,
        format,
        size: optimized.size,
        srcSet,
      }

      // Guardar en cache
      smartCache.set(cacheKey, result, {
        ttl: 24 * 60 * 60 * 1000, // 24 horas
        tags: ["images"],
      })

      logger.debug("IMAGE_OPTIMIZER", `Imagen optimizada: ${result.size} bytes, ${result.format}`)
      return result
    } catch (error) {
      logger.error("IMAGE_OPTIMIZER", "Error optimizando imagen", error)
      throw error
    }
  }

  private async loadImage(source: File | string | HTMLImageElement): Promise<HTMLImageElement> {
    if (source instanceof HTMLImageElement) {
      return source
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error("Error cargando imagen"))

      if (source instanceof File) {
        const reader = new FileReader()
        reader.onload = (e) => {
          img.src = e.target?.result as string
        }
        reader.readAsDataURL(source)
      } else {
        img.src = source
      }
    })
  }

  private calculateOptimalSize(
    img: HTMLImageElement,
    options: ImageOptimizationOptions
  ): {width: number; height: number} {
    const {maxWidth, maxHeight} = options
    const aspectRatio = img.width / img.height

    let width = img.width
    let height = img.height

    // Ajustar si excede el ancho máximo
    if (width > maxWidth) {
      width = maxWidth
      height = width / aspectRatio
    }

    // Ajustar si excede la altura máxima
    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatio
    }

    return {width: Math.round(width), height: Math.round(height)}
  }

  private detectOptimalFormat(format: string, img: HTMLImageElement): string {
    if (format !== "auto") {
      return format
    }

    // Verificar soporte de WebP
    if (this.supportsWebP()) {
      return "webp"
    }

    // Por defecto usar JPEG para fotos, PNG para imágenes con transparencia
    return "jpeg"
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL("image/webp").startsWith("data:image/webp")
  }

  private async processImage(
    img: HTMLImageElement,
    width: number,
    height: number,
    format: string,
    quality: number
  ): Promise<{url: string; width: number; height: number; size: number}> {
    // Configurar canvas
    this.canvas.width = width
    this.canvas.height = height

    // Limpiar canvas
    this.ctx.clearRect(0, 0, width, height)

    // Aplicar suavizado para mejor calidad
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = "high"

    // Dibujar imagen redimensionada
    this.ctx.drawImage(img, 0, 0, width, height)

    // Convertir a formato deseado
    const mimeType = `image/${format}`
    const dataUrl = this.canvas.toDataURL(mimeType, quality)

    // Calcular tamaño
    const size = Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75)

    return {
      url: dataUrl,
      width,
      height,
      size,
    }
  }

  private async generateSrcSet(
    img: HTMLImageElement,
    options: ImageOptimizationOptions
  ): Promise<string> {
    const {sizes, quality, format} = options
    const srcSetEntries: string[] = []

    for (const size of sizes) {
      if (size <= img.width) {
        const aspectRatio = img.height / img.width
        const height = Math.round(size * aspectRatio)

        const optimized = await this.processImage(
          img,
          size,
          height,
          this.detectOptimalFormat(format, img),
          quality
        )

        srcSetEntries.push(`${optimized.url} ${size}w`)
      }
    }

    return srcSetEntries.join(", ")
  }

  private generateCacheKey(
    source: File | string | HTMLImageElement,
    options: ImageOptimizationOptions
  ): string {
    let sourceKey: string

    if (source instanceof File) {
      sourceKey = `file:${source.name}:${source.size}:${source.lastModified}`
    } else if (typeof source === "string") {
      sourceKey = `url:${source}`
    } else {
      sourceKey = `img:${source.src}:${source.width}x${source.height}`
    }

    const optionsKey = JSON.stringify(options)
    return `image:${btoa(sourceKey + optionsKey)}`
  }

  // Método para lazy loading con Intersection Observer
  setupLazyLoading(selector: string = "img[data-src]"): IntersectionObserver {
    const images = document.querySelectorAll(selector)

    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src

            if (src) {
              this.loadImageWithProgress(img, src)
              imageObserver.unobserve(img)
            }
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    )

    images.forEach((img) => imageObserver.observe(img))

    return imageObserver
  }

  private async loadImageWithProgress(img: HTMLImageElement, src: string) {
    const loadingState: ImageLoadingState = {
      loading: true,
      error: null,
      progress: 0,
    }

    this.loadingStates.set(src, loadingState)

    try {
      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        if (loadingState.progress < 90) {
          loadingState.progress += Math.random() * 20
        }
      }, 100)

      img.onload = () => {
        clearInterval(progressInterval)
        loadingState.loading = false
        loadingState.progress = 100
        img.classList.add("loaded")
      }

      img.onerror = () => {
        clearInterval(progressInterval)
        loadingState.loading = false
        loadingState.error = "Error cargando imagen"
        img.classList.add("error")
      }

      img.src = src
    } catch (error) {
      loadingState.loading = false
      loadingState.error = error instanceof Error ? error.message : "Error desconocido"
    }
  }

  getLoadingState(src: string): ImageLoadingState | null {
    return this.loadingStates.get(src) || null
  }

  // Método para optimizar imágenes en lote
  async optimizeBatch(
    sources: (File | string)[],
    options: Partial<ImageOptimizationOptions> = {}
  ): Promise<OptimizedImage[]> {
    const results: OptimizedImage[] = []
    const batchSize = 3 // Procesar 3 imágenes a la vez

    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize)
      const batchPromises = batch.map((source) =>
        this.optimizeImage(source, options).catch((error) => {
          logger.error("IMAGE_OPTIMIZER", `Error en lote: ${source}`, error)
          return null
        })
      )

      const batchResults = await Promise.all(batchPromises)
      results.push(...(batchResults.filter(Boolean) as OptimizedImage[]))
    }

    return results
  }

  // Limpiar cache de imágenes
  clearImageCache() {
    smartCache.invalidateByTag("images")
    this.loadingStates.clear()
  }
}

// Composable para Vue 3
export function useImageOptimizer() {
  const optimizer = ImageOptimizer.getInstance()

  return {
    optimizeImage: optimizer.optimizeImage.bind(optimizer),
    setupLazyLoading: optimizer.setupLazyLoading.bind(optimizer),
    optimizeBatch: optimizer.optimizeBatch.bind(optimizer),
    getLoadingState: optimizer.getLoadingState.bind(optimizer),
    clearCache: optimizer.clearImageCache.bind(optimizer),
  }
}

export const imageOptimizer = ImageOptimizer.getInstance()
export type {ImageOptimizationOptions, OptimizedImage, ImageLoadingState}
