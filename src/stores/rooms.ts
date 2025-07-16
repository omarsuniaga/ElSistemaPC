import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '@/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

interface Room {
  id: string
  name: string
  capacity: number
  description?: string
  available?: boolean
}

export const useRoomsStore = defineStore('rooms', () => {
  const rooms = ref<Room[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchRooms = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      const querySnapshot = await getDocs(collection(db, 'ROOMS'));
      rooms.value = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Room,
      );
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      error.value = err.message || 'Failed to fetch rooms';
    } finally {
      isLoading.value = false;
    }
  };

  const getRoomById = (id: string) => {
    return rooms.value.find((room) => room.id === id);
  };

  return {
    rooms,
    isLoading,
    error,
    fetchRooms,
    getRoomById,
  };
});
