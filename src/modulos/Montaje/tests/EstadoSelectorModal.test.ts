import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import EstadoSelectorModal from '../components/EstadoSelectorModal.vue';
import { EstadoCompass } from '../types';

// Mock del store de Attendance
const mockAttendanceStore = {
  fetchAttendanceForSession: vi.fn().mockResolvedValue(true),
  getPresentStudentIds: vi.fn().mockReturnValue(['alumno-1', 'alumno-3']),
  getAbsentStudentIds: vi.fn().mockReturnValue(['alumno-2'])
};

vi.mock('@/modulos/Attendance/store/attendance', () => ({
  useAttendanceStore: () => mockAttendanceStore
}));

describe('EstadoSelectorModal', () => {
  let wrapper: VueWrapper<any>;

  const mockAlumnosDisponibles = [
    { id: 'alumno-1', nombre: 'Juan Pérez' },
    { id: 'alumno-2', nombre: 'María García', ausente: true },
    { id: 'alumno-3', nombre: 'Carlos López' }
  ];

  const mockCompasesSeleccionados = [
    { numero: 5, instrumento: 'violin_i' },
    { numero: 6, instrumento: 'violin_i' }
  ];

  const defaultProps = {
    isOpen: true,
    compasesSeleccionados: mockCompasesSeleccionados,
    alumnosDisponibles: mockAlumnosDisponibles,
    alumnosPreseleccionados: ['alumno-1'],
    classeId: 'clase-123',
    showAttendanceFilter: true,
    fechaSesion: new Date('2024-01-15')
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = (props = {}) => {
    return mount(EstadoSelectorModal, {
      props: { ...defaultProps, ...props }
    });
  };

  describe('Renderizado básico', () => {
    it('debe renderizarse cuando isOpen es true', () => {
      wrapper = createWrapper();
      
      expect(wrapper.find('.fixed.inset-0').exists()).toBe(true);
      expect(wrapper.find('h3').text()).toBe('Asignar estado');
    });

    it('no debe renderizarse cuando isOpen es false', () => {
      wrapper = createWrapper({ isOpen: false });
      
      expect(wrapper.find('.fixed.inset-0').exists()).toBe(false);
    });

    it('debe mostrar el resumen de selección correctamente', () => {
      wrapper = createWrapper();
      
      const summary = wrapper.find('p.text-sm.text-gray-500');
      expect(summary.text()).toContain('2 compases del instrumento violin_i seleccionados');
    });

    it('debe mostrar un solo compás en el resumen cuando hay uno', () => {
      wrapper = createWrapper({
        compasesSeleccionados: [{ numero: 5, instrumento: 'violin_i' }]
      });
      
      const summary = wrapper.find('p.text-sm.text-gray-500');
      expect(summary.text()).toContain('Compás 5 (violin_i)');
    });
  });

  describe('Selección de estados', () => {
    it('debe mostrar todos los estados disponibles', () => {
      wrapper = createWrapper();
      
      const stateButtons = wrapper.findAll('button').filter(btn => 
        ['Sin trabajar', 'Leído', 'Con dificultad', 'Logrado'].includes(btn.text())
      );
      
      expect(stateButtons.length).toBe(4);
    });

    it('debe seleccionar un estado al hacer clic', async () => {
      wrapper = createWrapper();
      
      const leidoButton = wrapper.findAll('button').find(btn => btn.text() === 'Leído');
      await leidoButton!.trigger('click');
      
      // Verificar que el botón tiene la clase de seleccionado
      expect(leidoButton!.classes()).toContain('border-blue-500');
      expect(leidoButton!.classes()).toContain('bg-blue-50');
    });

    it('debe mostrar textarea de observaciones solo para estado "Con dificultad"', async () => {
      wrapper = createWrapper();
      
      // Inicialmente no debe mostrar textarea
      expect(wrapper.find('textarea').exists()).toBe(false);
      
      // Seleccionar "Con dificultad"
      const dificultadButton = wrapper.findAll('button').find(btn => btn.text() === 'Con dificultad');
      await dificultadButton!.trigger('click');
      
      // Ahora debe mostrar textarea
      expect(wrapper.find('textarea').exists()).toBe(true);
      expect(wrapper.find('label').text()).toBe('Observaciones');
    });
  });

  describe('Selección de alumnos', () => {
    it('debe mostrar la lista de alumnos disponibles', () => {
      wrapper = createWrapper();
      
      const alumnoNames = wrapper.findAll('.text-sm').filter(el => 
        ['Juan Pérez', 'María García', 'Carlos López'].includes(el.text())
      );
      
      expect(alumnoNames.length).toBe(3);
    });

    it('debe marcar alumnos preseleccionados', () => {
      wrapper = createWrapper({ alumnosPreseleccionados: ['alumno-1', 'alumno-3'] });
      
      const checkedBoxes = wrapper.findAll('input[type="checkbox"]:checked');
      expect(checkedBoxes.length).toBe(2); // Sin contar el "select all"
    });

    it('debe mostrar alumnos ausentes con estilo diferente', () => {
      wrapper = createWrapper();
      
      // Buscar el elemento que contiene "María García" (ausente)
      const mariaElement = wrapper.findAll('.flex.items-center').find(el => 
        el.text().includes('María García')
      );
      
      expect(mariaElement!.classes()).toContain('opacity-50');
      expect(mariaElement!.text()).toContain('Ausente');
    });

    it('debe permitir seleccionar/deseleccionar alumnos individualmente', async () => {
      wrapper = createWrapper({ alumnosPreseleccionados: [] });
      
      const firstCheckbox = wrapper.findAll('input[type="checkbox"]')[1]; // Saltar el "select all"
      await firstCheckbox.setChecked(true);
      
      // Verificar cambio en estado interno
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.alumnosSeleccionados).toContain('alumno-1');
    });

    it('debe implementar "Seleccionar todos" correctamente', async () => {
      wrapper = createWrapper({ alumnosPreseleccionados: [] });
      
      const selectAllCheckbox = wrapper.find('#select-all');
      await selectAllCheckbox.setChecked(true);
      
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.alumnosSeleccionados).toHaveLength(3);
    });
  });

  describe('Filtro por asistencia', () => {
    it('debe mostrar botón de filtro por asistencia cuando está habilitado', () => {
      wrapper = createWrapper({ showAttendanceFilter: true });
      
      const filterButton = wrapper.find('button').filter(btn => 
        btn.text().includes('Solo presentes')
      );
      
      expect(filterButton.exists()).toBe(true);
    });

    it('debe filtrar por asistencia al hacer clic', async () => {
      wrapper = createWrapper({ alumnosPreseleccionados: [] });
      
      const filterButton = wrapper.find('button').filter(btn => 
        btn.text().includes('Solo presentes')
      );
      
      await filterButton.trigger('click');
      await wrapper.vm.$nextTick();
      
      // Debe seleccionar solo alumnos presentes (alumno-1 y alumno-3)
      expect(wrapper.vm.alumnosSeleccionados).toEqual(['alumno-1', 'alumno-3']);
      expect(mockAttendanceStore.fetchAttendanceForSession).toHaveBeenCalledWith(
        'clase-123', 
        defaultProps.fechaSesion
      );
    });

    it('no debe mostrar botón de filtro cuando está deshabilitado', () => {
      wrapper = createWrapper({ showAttendanceFilter: false });
      
      const filterButton = wrapper.find('button').filter(btn => 
        btn.text().includes('Solo presentes')
      );
      
      expect(filterButton.exists()).toBe(false);
    });
  });

  describe('Emisión de eventos', () => {
    it('debe emitir evento "update" al confirmar selección', async () => {
      wrapper = createWrapper();
      
      // Seleccionar estado
      const leidoButton = wrapper.findAll('button').find(btn => btn.text() === 'Leído');
      await leidoButton!.trigger('click');
      
      // Confirmar
      const confirmButton = wrapper.findAll('button').find(btn => btn.text() === 'Aplicar');
      await confirmButton!.trigger('click');
      
      const updateEvents = wrapper.emitted('update') as any[][];
      expect(updateEvents).toBeTruthy();
      
      const eventData = updateEvents[0][0];
      expect(eventData.estado).toBe(EstadoCompass.LEIDO);
      expect(eventData.compases).toEqual(mockCompasesSeleccionados);
      expect(eventData.alumnosIds).toEqual(['alumno-1']); // Preseleccionado
    });

    it('debe emitir evento "close" al cancelar', async () => {
      wrapper = createWrapper();
      
      const cancelButton = wrapper.findAll('button').find(btn => btn.text() === 'Cancelar');
      await cancelButton!.trigger('click');
      
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('debe emitir evento "close" al hacer clic en X', async () => {
      wrapper = createWrapper();
      
      const closeButton = wrapper.find('button svg').element.closest('button');
      await wrapper.findComponent(closeButton!).trigger('click');
      
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('debe emitir evento "close" al hacer clic fuera del modal', async () => {
      wrapper = createWrapper();
      
      const backdrop = wrapper.find('.fixed.inset-0');
      await backdrop.trigger('click');
      
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Validaciones', () => {
    it('debe deshabilitar botón "Aplicar" si no hay estado seleccionado', () => {
      wrapper = createWrapper();
      
      const confirmButton = wrapper.findAll('button').find(btn => btn.text() === 'Aplicar');
      expect(confirmButton!.attributes('disabled')).toBeDefined();
    });

    it('debe habilitar botón "Aplicar" cuando hay estado seleccionado', async () => {
      wrapper = createWrapper();
      
      // Seleccionar estado
      const leidoButton = wrapper.findAll('button').find(btn => btn.text() === 'Leído');
      await leidoButton!.trigger('click');
      
      const confirmButton = wrapper.findAll('button').find(btn => btn.text() === 'Aplicar');
      expect(confirmButton!.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Reset del formulario', () => {
    it('debe limpiar el formulario al cerrar', async () => {
      wrapper = createWrapper();
      
      // Configurar estado
      const dificultadButton = wrapper.findAll('button').find(btn => btn.text() === 'Con dificultad');
      await dificultadButton!.trigger('click');
      
      const textarea = wrapper.find('textarea');
      await textarea.setValue('Observación de prueba');
      
      // Cancelar
      const cancelButton = wrapper.findAll('button').find(btn => btn.text() === 'Cancelar');
      await cancelButton!.trigger('click');
      
      // Verificar que se resetea
      expect(wrapper.vm.selectedEstado).toBe('');
      expect(wrapper.vm.observacion).toBe('');
      expect(wrapper.vm.alumnosSeleccionados).toEqual(['alumno-1']); // Vuelve a preseleccionados
    });

    it('debe restaurar alumnos preseleccionados al abrir el modal', async () => {
      wrapper = createWrapper({ 
        isOpen: false,
        alumnosPreseleccionados: ['alumno-2', 'alumno-3']
      });
      
      // Simular apertura del modal
      await wrapper.setProps({ isOpen: true });
      
      expect(wrapper.vm.alumnosSeleccionados).toEqual(['alumno-2', 'alumno-3']);
    });
  });

  describe('Integración con observaciones', () => {
    it('debe incluir observación en el evento para estado CON_DIFICULTAD', async () => {
      wrapper = createWrapper();
      
      // Seleccionar "Con dificultad"
      const dificultadButton = wrapper.findAll('button').find(btn => btn.text() === 'Con dificultad');
      await dificultadButton!.trigger('click');
      
      // Escribir observación
      const textarea = wrapper.find('textarea');
      await textarea.setValue('Problemas de afinación en esta sección');
      
      // Confirmar
      const confirmButton = wrapper.findAll('button').find(btn => btn.text() === 'Aplicar');
      await confirmButton!.trigger('click');
      
      const updateEvents = wrapper.emitted('update') as any[][];
      const eventData = updateEvents[0][0];
      
      expect(eventData.estado).toBe(EstadoCompass.CON_DIFICULTAD);
      expect(eventData.observacion).toBe('Problemas de afinación en esta sección');
    });

    it('debe limpiar observación para otros estados', async () => {
      wrapper = createWrapper();
      
      // Primero seleccionar "Con dificultad" y escribir observación
      const dificultadButton = wrapper.findAll('button').find(btn => btn.text() === 'Con dificultad');
      await dificultadButton!.trigger('click');
      
      const textarea = wrapper.find('textarea');
      await textarea.setValue('Observación a limpiar');
      
      // Cambiar a "Logrado"
      const logradoButton = wrapper.findAll('button').find(btn => btn.text() === 'Logrado');
      await logradoButton!.trigger('click');
      
      expect(wrapper.vm.observacion).toBe('');
    });
  });
});
