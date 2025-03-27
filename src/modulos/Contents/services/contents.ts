import { db } from '../../../firebase';
import type { Content } from '../types/content';
import { 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    serverTimestamp,
    query,
    orderBy
} from 'firebase/firestore';

const contentsCollection = 'CONTENTS';

// Fetch all contents
export const fetchContents = async (): Promise<Content[]> => {
    try {
        const q = query(collection(db, contentsCollection), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data
            } as unknown as Content;
        });
    } catch (error) {
        console.error("Error fetching contents:", error);
        throw new Error('Failed to fetch contents');
    }
};

// Fetch a single content by ID
export const fetchContentById = async (id: string): Promise<Content> => {
    try {
        const docRef = doc(db, contentsCollection, id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error(`Content with ID ${id} not found`);
        }
        
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data
        } as unknown as Content;
    } catch (error) {
        console.error(`Error fetching content with ID ${id}:`, error);
        throw new Error('Failed to fetch content');
    }
};

// Create a new content
export const createContent = async (content: Omit<Content, 'id'>): Promise<Content> => {
    try {
        const contentWithTimestamp = {
            ...content,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, contentsCollection), contentWithTimestamp);
        
        return {
            id: docRef.id,
            ...content,
            // When returning, make sure createdAt and updatedAt are included correctly
            // since they were added to contentWithTimestamp but not included in the return
            createdAt: contentWithTimestamp.createdAt,
            updatedAt: contentWithTimestamp.updatedAt
        } as unknown as Content;
    } catch (error) {
        console.error("Error creating content:", error);
        throw new Error('Failed to create content');
    }
};

// Update an existing content
export const updateContent = async (id: string, contentData: Partial<Content>): Promise<Content> => {
    try {
        const docRef = doc(db, contentsCollection, id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error(`Content with ID ${id} not found`);
        }

        const updateData = {
            ...contentData,
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(docRef, updateData);
        
        // Get the updated document
        const updatedDocSnap = await getDoc(docRef);
        
        return {
            id: updatedDocSnap.id,
            ...updatedDocSnap.data()
        } as unknown as Content;
    } catch (error) {
        console.error(`Error updating content with ID ${id}:`, error);
        throw new Error('Failed to update content');
    }
};

// Delete a content
export const deleteContent = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, contentsCollection, id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error(`Content with ID ${id} not found`);
        }
        
        await deleteDoc(docRef);
    } catch (error) {
        console.error(`Error deleting content with ID ${id}:`, error);
        throw new Error('Failed to delete content');
    }
};