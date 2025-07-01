/**
 * Storage helpers for profile and user-related uploads
 */
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type UploadTaskSnapshot,
} from "firebase/storage"

/**
 * Upload a file to Firebase Storage with progress tracking
 * @param file The file to upload
 * @param path The path where the file should be stored
 * @param onProgress Optional callback for upload progress
 * @returns Promise resolving to download URL
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Validate file
  if (file.size > 5 * 1024 * 1024) {
    // 5MB limit
    throw new Error("El archivo no puede superar los 5MB")
  }

  // Create storage reference
  const storage = getStorage()
  const storageRef = ref(storage, path)

  // Start upload
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  })

  // Return promise that resolves when upload completes
  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        const progress = snapshot.bytesTransferred / snapshot.totalBytes
        if (onProgress) {
          onProgress(progress)
        }
      },
      (error) => {
        console.error("Error al subir foto:", error)
        reject(error)
      },
      async () => {
        try {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(downloadURL)
        } catch (error) {
          console.error("Error al obtener URL de descarga:", error)
          reject(error)
        }
      }
    )
  })
}
