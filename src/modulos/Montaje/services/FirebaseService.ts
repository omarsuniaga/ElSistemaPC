// Usar Firebase del proyecto principal
import { db, auth, storage } from '../../../firebase/config';
import { 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

class FirebaseService {
  // Usar las instancias de Firebase del proyecto principal
  private db = db;
  private auth = auth;
  private storage = storage;

  constructor() {
    // Firebase ya está inicializado en el proyecto principal
    console.log('🔥 FirebaseService initialized with project Firebase configuration');
  }

  // Authentication methods
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(this.auth, callback);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Firestore methods
  async getDocument(collectionName: string, documentId: string): Promise<DocumentData | null> {
    try {
      const docRef = doc(this.db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  async setDocument(collectionName: string, documentId: string, data: any): Promise<void> {
    try {
      const docRef = doc(this.db, collectionName, documentId);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting document:', error);
      throw error;
    }
  }

  async addDocument(collectionName: string, data: any): Promise<string> {
    try {
      const collectionRef = collection(this.db, collectionName);
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  async updateDocument(collectionName: string, documentId: string, data: any): Promise<void> {
    try {
      const docRef = doc(this.db, collectionName, documentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, documentId: string): Promise<void> {
    try {
      const docRef = doc(this.db, collectionName, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async getCollection(
    collectionName: string, 
    constraints: QueryConstraint[] = [],
  ): Promise<DocumentData[]> {
    try {
      const collectionRef = collection(this.db, collectionName);
      const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting collection:', error);
      throw error;
    }
  }

  onCollectionSnapshot(
    collectionName: string,
    callback: (data: DocumentData[]) => void,
    constraints: QueryConstraint[] = [],
  ): Unsubscribe {
    const collectionRef = collection(this.db, collectionName);
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
    
    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(data);
    });
  }

  // Batch operations
  async batchWrite(operations: Array<{
    type: 'set' | 'update' | 'delete',
    collection: string,
    id: string,
    data?: any
  }>): Promise<void> {
    try {
      const batch = writeBatch(this.db);
      
      operations.forEach(operation => {
        const docRef = doc(this.db, operation.collection, operation.id);
        
        switch (operation.type) {
        case 'set':
          batch.set(docRef, {
            ...operation.data,
            updatedAt: serverTimestamp(),
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...operation.data,
            updatedAt: serverTimestamp(),
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error in batch write:', error);
      throw error;
    }
  }

  // Storage methods
  async uploadFile(path: string, file: File): Promise<string> {
    try {
      const storageRef = ref(this.storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }

  // Helper methods
  createTimestamp() {
    return Timestamp.now();
  }

  serverTimestamp() {
    return serverTimestamp();
  }

  // Query helper methods
  static where(field: string, operator: any, value: any) {
    return where(field, operator, value);
  }

  static orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    return orderBy(field, direction);
  }

  static limit(count: number) {
    return limit(count);
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService;

// Export the class for testing or custom instances
export { FirebaseService };

// Export Firebase instances for direct access if needed
export { db as firebaseDb, auth as firebaseAuth, storage as firebaseStorage };