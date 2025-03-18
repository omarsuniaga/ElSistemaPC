/**
 * Firebase Storage utility service
 */
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject,
  type UploadTaskSnapshot
} from 'firebase/storage';
import { getAuth } from 'firebase/auth';

/**
 * UploadOptions interface
 */
interface UploadOptions {
  path: string;
  file: File;
  metadata?: {
    contentType?: string;
    customMetadata?: Record<string, string>;
  };
  onProgress?: (progress: number, snapshot: UploadTaskSnapshot) => void;
  generateUniqueName?: boolean;
}

/**
 * Upload a file to Firebase Storage
 * @param options Upload configuration options
 * @returns Promise resolving to the download URL
 */
export const uploadFile = async (options: UploadOptions): Promise<string> => {
  const { path, file, metadata, onProgress, generateUniqueName = true } = options;
  
  // Get current user ID for security checks
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }
  
  // Validate file
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('El archivo no puede superar los 10MB');
  }
  
  // Create file path with optional unique name
  let filePath = path;
  if (generateUniqueName) {
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    filePath = `${path}/${uniqueName}${fileExtension ? `.${fileExtension}` : ''}`;
  }
  
  // Create storage reference
  const storage = getStorage();
  const storageRef = ref(storage, filePath);
  
  // Start upload with custom metadata
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploadedBy: userId,
      originalName: file.name,
      ...metadata?.customMetadata
    },
    ...metadata
  });
  
  // Return promise that resolves when upload completes
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress, snapshot);
        }
      },
      (error) => {
        console.error('Upload failed:', error);
        reject(new Error('Error al subir el archivo. Intente nuevamente.'));
      },
      async () => {
        try {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error('Failed to get download URL:', error);
          reject(new Error('Error al obtener la URL del archivo.'));
        }
      }
    );
  });
};

/**
 * Delete a file from Firebase Storage
 * @param fileUrl Full URL of the file to delete
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  if (!fileUrl.includes('firebasestorage.googleapis.com')) {
    console.warn('Not a Firebase Storage URL:', fileUrl);
    return;
  }
  
  try {
    const storage = getStorage();
    
    // Extract path from URL
    const filePath = fileUrl.split('?')[0].split('/o/')[1];
    if (!filePath) {
      throw new Error('Invalid file URL format');
    }
    
    const decodedPath = decodeURIComponent(filePath);
    const fileRef = ref(storage, decodedPath);
    
    await deleteObject(fileRef);
    console.log('File deleted successfully:', decodedPath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Error al eliminar el archivo.');
  }
};