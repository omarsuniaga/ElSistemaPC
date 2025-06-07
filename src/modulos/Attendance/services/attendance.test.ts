import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAttendanceByDateAndClassFirebase } from './attendance';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

// Mock de Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn()
}));

describe('Attendance Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAttendanceByDateAndClassFirebase', () => {
    it('debería aceptar fecha en formato YYYY-MM-DD', async () => {
      const mockQuerySnapshot = {
        empty: false,
        docs: [{
          id: '1',
          data: () => ({
            studentId: '123',
            classId: '456',
            Fecha: '2024-03-20',
            status: 'Presente',
            notes: 'Test'
          })
        }]
      };

      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      const result = await getAttendanceByDateAndClassFirebase('2024-03-20', '456');
      
      expect(result).toHaveLength(1);
      expect(result[0].Fecha).toBe('2024-03-20');
    });

    it('debería aceptar fecha en formato YYYYMMDD', async () => {
      const mockQuerySnapshot = {
        empty: false,
        docs: [{
          id: '1',
          data: () => ({
            studentId: '123',
            classId: '456',
            Fecha: '2024-03-20',
            status: 'Presente',
            notes: 'Test'
          })
        }]
      };

      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      const result = await getAttendanceByDateAndClassFirebase('20240320', '456');
      
      expect(result).toHaveLength(1);
      expect(result[0].Fecha).toBe('2024-03-20');
    });

    it('debería lanzar error con formato de fecha inválido', async () => {
      await expect(
        getAttendanceByDateAndClassFirebase('20-03-2024', '456')
      ).rejects.toThrow('Invalid date format. Expected YYYY-MM-DD or YYYYMMDD.');
    });

    it('debería retornar array vacío cuando no hay registros', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: []
      };

      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      const result = await getAttendanceByDateAndClassFirebase('2024-03-20', '456');
      
      expect(result).toHaveLength(0);
    });
  });
}); 