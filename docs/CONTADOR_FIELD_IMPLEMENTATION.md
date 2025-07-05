# Funcionalidad Contador - PDF Generator Modal

## 🔢 Nueva Funcionalidad: Campo Contador

### **Descripción**

Se ha agregado la opción "Contador" en la sección "Campos a Incluir" del generador de PDFs. Esta funcionalidad proporciona una numeración secuencial automática desde 1 hasta el total de elementos encontrados.

### **Características Implementadas**

#### **1. Campo Contador por Defecto**

- ✅ **Ubicación**: Primer campo en la lista de "Campos a Incluir"
- ✅ **Etiqueta**: "N°" (número)
- ✅ **Estado inicial**: Seleccionado por defecto
- ✅ **Posición**: Se incluye como primera columna en los reportes

#### **2. Numeración Automática**

- ✅ **Contador secuencial**: Inicia en 1 y continúa hasta el final
- ✅ **Formato**: Números enteros consecutivos
- ✅ **Persistencia**: Mantiene la secuencia en todos los tipos de reporte

#### **3. Comportamiento por Tipo de Reporte**

##### **Listado General (all_students)**

```
N° | Nombre | Apellido | Edad | Teléfono
1  | Juan   | Pérez    | 25   | 555-0001
2  | María  | García   | 22   | 555-0002
3  | Carlos | López    | 28   | 555-0003
```

##### **Por Clase (by_class)**

```
Clase de Piano (15 estudiantes)
N° | Nombre | Apellido | Edad
1  | Ana    | Martín   | 20
2  | Luis   | Ruiz     | 23
3  | Eva    | Silva    | 25

Clase de Guitarra (12 estudiantes)
N° | Nombre | Apellido | Edad
16 | Pedro  | Morales  | 19  ← Continúa la numeración
17 | Laura  | Vega     | 21
18 | David  | Torres   | 24
```

##### **Por Maestro (by_teacher)**

```
Maestro: Prof. González (8 estudiantes)
N° | Nombre | Apellido | Edad
1  | Sara   | Díaz     | 22
2  | Miguel | Herrera  | 26

Maestro: Prof. Ramírez (10 estudiantes)
N° | Nombre | Apellido | Edad
9  | Carmen | Jiménez  | 24  ← Continúa la numeración
10 | Pablo  | Castro   | 27
```

### **4. Características Técnicas**

#### **Configuración de Columna**

- ✅ **Ancho optimizado**: 15mm (columna estrecha)
- ✅ **Alineación**: Centrada
- ✅ **Fuente**: Igual al resto de la tabla
- ✅ **Compatibilidad**: Funciona con fotos y sin fotos

#### **Lógica de Numeración**

```typescript
// Para listados generales
case 'contador':
  return (index + 1).toString()

// Para agrupaciones (clases/maestros)
case 'contador':
  return (globalCounter + index).toString()

// Actualización del contador global
globalCounter += currentGroupLength
```

#### **Integración con Fotos**

- ✅ **Con fotos**: Contador aparece después de la columna de fotos
- ✅ **Sin fotos**: Contador aparece como primera columna
- ✅ **Ajuste automático**: El índice se ajusta según la presencia de fotos

### **5. Cambios en el Código**

#### **Campos Disponibles**

```typescript
const availableFields = ref([
  {id: "contador", label: "N°"}, // ← NUEVO
  {id: "nombre", label: "Nombre"},
  {id: "apellido", label: "Apellido"},
  // ... resto de campos
])
```

#### **Campos Seleccionados por Defecto**

```typescript
const selectedFields = ref<string[]>([
  "contador", // ← NUEVO - Seleccionado por defecto
  "nombre",
  "apellido",
  "edad",
  "telefono",
])
```

#### **Generación de Datos**

```typescript
// En generateStudentTablePDF
switch (fieldId) {
  case "contador":
    return (index + 1).toString() // ← NUEVO
  case "fechaNacimiento":
    return formatDate(student[fieldId])
  // ... resto de casos
}
```

#### **Configuración de Estilos**

```typescript
// Configurar ancho de columna contador
const counterIndex = selectedFields.value.indexOf("contador")
if (counterIndex !== -1) {
  const adjustedIndex = pdfOptions.value.includePhotos ? counterIndex + 1 : counterIndex
  tableConfig.columnStyles[adjustedIndex] = {
    cellWidth: 15, // ← Columna estrecha
    halign: "center", // ← Centrada
  }
}
```

### **6. Contador Global en Agrupaciones**

#### **Por Clases**

```typescript
let globalCounter = 1  // Contador global

Object.entries(groupedByClass).forEach(([className, classStudents]) => {
  // ... código de tabla ...

  case 'contador':
    return (globalCounter + index).toString()  // Usa contador global

  // Actualizar contador después de cada clase
  globalCounter += (classStudents as any[]).length
})
```

#### **Por Maestros**

```typescript
let globalCounter = 1  // Contador global

Object.entries(groupedByTeacher).forEach(([teacherName, teacherStudents]) => {
  // ... código de tabla ...

  case 'contador':
    return (globalCounter + index).toString()  // Usa contador global

  // Actualizar contador después de cada maestro
  globalCounter += (teacherStudents as any[]).length
})
```

### **7. Casos de Uso**

#### **Ejemplo 1: Listado Completo**

- **Estudiantes**: 150 total
- **Numeración**: 1, 2, 3, ..., 150
- **Resultado**: Numeración continua sin interrupciones

#### **Ejemplo 2: Agrupado por Clases**

- **Clase Piano**: 25 estudiantes (N° 1-25)
- **Clase Guitarra**: 30 estudiantes (N° 26-55)
- **Clase Violín**: 20 estudiantes (N° 56-75)
- **Total**: 75 estudiantes numerados consecutivamente

#### **Ejemplo 3: Con Filtros Aplicados**

- **Filtro**: Solo estudiantes activos
- **Resultado**: 45 estudiantes encontrados
- **Numeración**: 1, 2, 3, ..., 45 (solo para los encontrados)

### **8. Beneficios para el Usuario**

#### **Facilidad de Referencia**

- ✅ Identificación rápida de estudiantes por número
- ✅ Referencia fácil en conversaciones y reuniones
- ✅ Seguimiento de listas durante presentaciones

#### **Organización Visual**

- ✅ Estructura clara y profesional
- ✅ Navegación visual mejorada
- ✅ Conteo visual inmediato del total

#### **Compatibilidad**

- ✅ Funciona con todos los tipos de reporte
- ✅ Compatible con filtros y opciones
- ✅ Se integra con fotos y estadísticas

### **9. Configuración del Usuario**

#### **Habilitación/Deshabilitación**

- ✅ **Por defecto**: Activado automáticamente
- ✅ **Opcional**: Se puede desmarcar si no se desea
- ✅ **Persistente**: Mantiene la preferencia durante la sesión

#### **Posición Flexible**

- ✅ **Primera columna**: Posición recomendada por defecto
- ✅ **Reordenable**: Se puede mover en la lista de campos
- ✅ **Ajuste automático**: Se adapta a la presencia de fotos

---

**Estado**: ✅ IMPLEMENTADO Y FUNCIONAL
**Fecha**: Diciembre 2024
**Compatibilidad**: Todos los tipos de reporte
**Configuración**: Activado por defecto, opcional
