// Exportar todos los componentes PDF para facilitar las importaciones
export { default as ReportTypeSelector } from './ReportTypeSelector.vue';
export { default as FilterOptions } from './FilterOptions.vue';
export { default as FieldsSelector } from './FieldsSelector.vue';
export { default as PDFOptions } from './PDFOptions.vue';
export { default as AdvancedOptions } from './AdvancedOptions.vue';
export { default as LogoCustomization } from './LogoCustomization.vue';
export { default as PreviewSection } from './PreviewSection.vue';

// Exportar tipos comunes
export interface PDFOptions {
  orientation: 'portrait' | 'landscape'
  pageSize: 'letter' | 'a4' | 'legal' | 'tabloid'
  includeHeader: boolean
  includeDate: boolean
  includePhotos: boolean
  groupByClass: boolean
  includeStatistics: boolean
  includeLogo: boolean
  sortBy: 'name' | 'age' | 'class' | 'instrument' | 'enrollment'
}

export interface ReportType {
  id: string
  title: string
  description: string
  icon: any
  color: string
}

export interface FieldOption {
  id: string
  label: string
}
