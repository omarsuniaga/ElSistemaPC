import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { useAuthStore } from '../stores/auth'

const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  scores: ['application/pdf', 'application/xml', 'text/xml']
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export class StorageError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'StorageError'
  }
}

export const validateFile = (file: File, types: keyof typeof ALLOWED_FILE_TYPES) => {
  if (!file) {
    throw new StorageError('No se ha seleccionado ningún archivo')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new StorageError('El archivo excede el tamaño máximo permitido (10MB)')
  }

  if (!ALLOWED_FILE_TYPES[types].includes(file.type)) {
    throw new StorageError(`Tipo de archivo no permitido. Tipos permitidos: ${ALLOWED_FILE_TYPES[types].join(', ')}`)
  }

  return true
}

export const uploadFile = async (file: File, path: string, types: keyof typeof ALLOWED_FILE_TYPES) => {
  try {
    validateFile(file, types)
    
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) {
      throw new StorageError('Usuario no autenticado')
    }

    // Generar nombre único para el archivo
    const extension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extension}`
    const fullPath = `${path}/${fileName}`

    // Crear referencia al archivo
    const fileRef = ref(storage, fullPath)

    // Subir archivo
    const snapshot = await uploadBytes(fileRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    return {
      url: downloadURL,
      path: fullPath,
      fileName
    }
  } catch (error: any) {
    console.error('Error al subir archivo:', error)
    throw new StorageError(
      error.name === 'StorageError' ? error.message : 'Error al subir el archivo',
      error.code
    )
  }
}

export const deleteFile = async (path: string) => {
  try {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) {
      throw new StorageError('Usuario no autenticado')
    }

    const fileRef = ref(storage, path)
    await deleteObject(fileRef)
  } catch (error: any) {
    console.error('Error al eliminar archivo:', error)
    throw new StorageError(
      'Error al eliminar el archivo',
      error.code
    )
  }
}

export const getFileUrl = async (path: string) => {
  try {
    const fileRef = ref(storage, path)
    return await getDownloadURL(fileRef)
  } catch (error: any) {
    console.error('Error al obtener URL del archivo:', error)
    throw new StorageError(
      'Error al obtener la URL del archivo',
      error.code
    )
  }
}