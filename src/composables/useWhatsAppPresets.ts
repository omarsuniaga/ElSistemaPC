import { ref, computed } from 'vue';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from '../stores/auth';

export interface WhatsAppPreset {
  id: string;
  name: string;
  category: 'disciplinary' | 'administrative' | 'reminder' | 'custom';
  template: string;
  variables: string[];
  isActive: boolean;
  createdBy: string;
  isSystem: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageData {
  studentName: string;
  representanteName: string;
  representantePhone: string;
  className: string;
  date: string;
  absences: number;
  teacherName: string;
  institutionName: string;
}

const COLLECTION_NAME = 'WHATSAPP_PRESETS';

export function useWhatsAppPresets() {
  const authStore = useAuthStore();
  const presets = ref<WhatsAppPreset[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Presets del sistema por defecto
  const defaultPresets: Omit<WhatsAppPreset, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Llamado de Atención',
      category: 'disciplinary',
      template: `🔔 *LLAMADO DE ATENCIÓN*

Estimado/a {representanteName},

Le informamos que el estudiante *{studentName}* de la clase de *{className}* ha acumulado *{absences} ausencias* durante el presente período.

📅 Fecha: {date}
👨‍🏫 Maestro: {teacherName}
🏫 Institución: {institutionName}

Es importante mantener la asistencia regular para el progreso académico del estudiante.

Esperamos su comprensión y colaboración.

*Academia Musical*`,
      variables: ['studentName', 'representanteName', 'className', 'date', 'absences', 'teacherName', 'institutionName'],
      isActive: true,
      createdBy: 'system',
      isSystem: true,
      order: 1
    },
    {
      name: 'Amonestación Formal',
      category: 'disciplinary',
      template: `⚠️ *AMONESTACIÓN FORMAL*

Estimado/a {representanteName},

Por medio de la presente, le notificamos que el estudiante *{studentName}* ha recibido una AMONESTACIÓN FORMAL por las siguientes razones:

📊 Ausencias acumuladas: *{absences}*
📅 Fecha: {date}
🎵 Clase: {className}
👨‍🏫 Maestro: {teacherName}

Esta amonestación queda registrada en el expediente del estudiante. De continuar con esta conducta, se procederá con medidas disciplinarias más severas.

Solicitamos su inmediata atención a este asunto.

*{institutionName}*
*Departamento Académico*`,
      variables: ['studentName', 'representanteName', 'className', 'date', 'absences', 'teacherName', 'institutionName'],
      isActive: true,
      createdBy: 'system',
      isSystem: true,
      order: 2
    },
    {
      name: 'Recordatorio de Instrumento',
      category: 'reminder',
      template: `🎵 *RECORDATORIO - INSTRUMENTO MUSICAL*

Estimado/a {representanteName},

Le recordamos que el estudiante *{studentName}* debe traer su instrumento musical para la clase de *{className}*.

📅 Próxima clase: {date}
👨‍🏫 Maestro: {teacherName}
🎼 Es fundamental para el desarrollo de las actividades

La práctica con el instrumento propio es esencial para el progreso del estudiante.

Gracias por su atención.

*{institutionName}*`,
      variables: ['studentName', 'representanteName', 'className', 'date', 'teacherName', 'institutionName'],
      isActive: true,
      createdBy: 'system',
      isSystem: true,
      order: 3
    },
    {
      name: 'Suspensión Temporal',
      category: 'disciplinary',
      template: `🔴 *SUSPENSIÓN TEMPORAL*

Estimado/a {representanteName},

Lamentamos informarle que el estudiante *{studentName}* ha sido SUSPENDIDO TEMPORALMENTE de las clases de *{className}* por el siguiente período:

📅 Fecha de suspensión: {date}
⏰ Duración: 1 semana
📊 Motivo: Ausencias excesivas ({absences} faltas)
👨‍🏫 Maestro: {teacherName}

Para la reincorporación, deberá:
✅ Reunión con coordinación académica
✅ Compromiso de asistencia regular
✅ Ponerse al día con el contenido perdido

*{institutionName}*
*Coordinación Académica*`,
      variables: ['studentName', 'representanteName', 'className', 'date', 'absences', 'teacherName', 'institutionName'],
      isActive: true,
      createdBy: 'system',
      isSystem: true,
      order: 4
    },
    {
      name: 'Suspensión Permanente',
      category: 'disciplinary',
      template: `⚫ *SUSPENSIÓN PERMANENTE*

Estimado/a {representanteName},

Después de múltiples advertencias y amonestaciones, lamentamos informarle que el estudiante *{studentName}* ha sido SUSPENDIDO PERMANENTEMENTE de la institución.

📅 Fecha efectiva: {date}
📊 Ausencias acumuladas: {absences}
🎵 Clase: {className}
👨‍🏫 Maestro: {teacherName}

Esta decisión se toma después de agotar todas las instancias de diálogo y compromiso.

Los documentos del estudiante estarán disponibles para retiro en coordinación.

*{institutionName}*
*Dirección Académica*`,
      variables: ['studentName', 'representanteName', 'className', 'date', 'absences', 'teacherName', 'institutionName'],
      isActive: true,
      createdBy: 'system',
      isSystem: true,
      order: 5
    }
  ];

  // Cargar presets desde Firestore
  const loadPresets = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const loadedPresets: WhatsAppPreset[] = [];
      
      querySnapshot.forEach((doc) => {
        loadedPresets.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as WhatsAppPreset);
      });
      
      // Si no hay presets, crear los por defecto
      if (loadedPresets.length === 0) {
        await initializeDefaultPresets();
        await loadPresets(); // Recargar después de crear los defaults
        return;
      }
      
      presets.value = loadedPresets;
    } catch (err) {
      console.error('Error loading WhatsApp presets:', err);
      error.value = 'Error al cargar los presets de WhatsApp';
    } finally {
      loading.value = false;
    }
  };

  // Inicializar presets por defecto
  const initializeDefaultPresets = async () => {
    if (!authStore.user?.uid) return;
    
    try {
      for (const preset of defaultPresets) {
        await addDoc(collection(db, COLLECTION_NAME), {
          ...preset,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (err) {
      console.error('Error initializing default presets:', err);
    }
  };

  // Procesar template con datos
  const processTemplate = (template: string, data: MessageData): string => {
    let processedTemplate = template;
    
    // Reemplazar variables
    processedTemplate = processedTemplate.replace(/{studentName}/g, data.studentName);
    processedTemplate = processedTemplate.replace(/{representanteName}/g, data.representanteName);
    processedTemplate = processedTemplate.replace(/{className}/g, data.className);
    processedTemplate = processedTemplate.replace(/{date}/g, data.date);
    processedTemplate = processedTemplate.replace(/{absences}/g, data.absences.toString());
    processedTemplate = processedTemplate.replace(/{teacherName}/g, data.teacherName);
    processedTemplate = processedTemplate.replace(/{institutionName}/g, data.institutionName);
    
    return processedTemplate;
  };

  // Copiar al portapapeles
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      return false;
    }
  };

  // Agregar nuevo preset
  const addPreset = async (preset: Omit<WhatsAppPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!authStore.user?.uid) throw new Error('Usuario no autenticado');
    
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        ...preset,
        createdBy: authStore.user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await loadPresets(); // Recargar presets
    } catch (err) {
      console.error('Error adding preset:', err);
      throw err;
    }
  };

  // Actualizar preset
  const updatePreset = async (id: string, updates: Partial<WhatsAppPreset>) => {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...updates,
        updatedAt: new Date()
      });
      
      await loadPresets(); // Recargar presets
    } catch (err) {
      console.error('Error updating preset:', err);
      throw err;
    }
  };

  // Eliminar preset
  const deletePreset = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await loadPresets(); // Recargar presets
    } catch (err) {
      console.error('Error deleting preset:', err);
      throw err;
    }
  };

  // Presets agrupados por categoría
  const presetsByCategory = computed(() => {
    const grouped: Record<string, WhatsAppPreset[]> = {
      disciplinary: [],
      administrative: [],
      reminder: [],
      custom: []
    };
    
    presets.value.forEach(preset => {
      if (grouped[preset.category]) {
        grouped[preset.category].push(preset);
      }
    });
    
    return grouped;
  });

  return {
    presets,
    loading,
    error,
    presetsByCategory,
    loadPresets,
    processTemplate,
    copyToClipboard,
    addPreset,
    updatePreset,
    deletePreset
  };
}
