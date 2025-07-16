export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  format?: (value: any) => string
  render?: (row: any) => string
  className?: string
  headerClassName?: string
  fixed?: boolean
  ellipsis?: boolean
  show?: boolean
  filter?: boolean
  filterType?: 'select' | 'text' | 'date'
  filterPlaceholder?: string
  filterValue?: string
  filterOptions?: FilterOption[]
  filterMultiple?: boolean
  filterRender?: (h: any, { column, $index }: any) => any
  filterRenderProps?: any
}

export interface FilterOption {
  label: string
  value: string
  disabled?: boolean
  children?: FilterOption[]
  [key: string]: any
}

export interface ExportOptions {
  format: 'xlsx' | 'csv'
  filename: string
  includeHeaders: boolean
  columnIds: string[]
}
