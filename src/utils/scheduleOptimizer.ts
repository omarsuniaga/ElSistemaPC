import { parse, isWithinInterval } from 'date-fns';

interface Schedule {
  day: string;
  startTime: string;
  endTime: string;
  teacherId?: string;
  classroom?: string;
  studentIds?: string[];
}

interface OptimizationResult {
  conflicts: {
    type: string;
    description: string;
    suggestion?: string;
  }[];
  suggestions: {
    classId: string;
    currentSchedule: Schedule;
    suggestedSchedule: Schedule;
    reason: string;
  }[];
}

export function optimizeSchedule(classes: any[]): OptimizationResult {
  const conflicts: OptimizationResult['conflicts'] = [];
  const suggestions: OptimizationResult['suggestions'] = [];

  // Agrupar clases por día
  const classesByDay = classes.reduce((acc, class_) => {
    if (!class_.schedule) return acc;
    
    const schedule = typeof class_.schedule === 'string'
      ? parseStringSchedule(class_.schedule)
      : class_.schedule;

    schedule.days?.forEach((day: string) => {
      if (!acc[day]) acc[day] = [];
      acc[day].push({
        ...class_,
        parsedSchedule: {
          day,
          startTime: schedule.startTime || schedule.start,
          endTime: schedule.endTime || schedule.end,
          teacherId: class_.teacherId,
          classroom: class_.classroom,
          studentIds: class_.studentIds
        }
      });
    });
    
    return acc;
  }, {} as Record<string, any[]>);

  // Verificar y optimizar por día
  Object.entries(classesByDay).forEach(([day, dayClasses]) => {
    // Ordenar clases por hora de inicio
    dayClasses.sort((a, b) => 
      a.parsedSchedule.startTime.localeCompare(b.parsedSchedule.startTime)
    );

    // Verificar superposiciones y sugerir cambios
    for (let i = 0; i < dayClasses.length; i++) {
      const currentClass = dayClasses[i];
      
      // Verificar siguiente clase para gaps y superposiciones
      if (i < dayClasses.length - 1) {
        const nextClass = dayClasses[i + 1];
        
        if (hasTimeConflict(currentClass.parsedSchedule, nextClass.parsedSchedule)) {
          conflicts.push({
            type: 'overlap',
            description: `Superposición entre ${currentClass.name} y ${nextClass.name} el ${day}`,
            suggestion: 'Considerar mover una de las clases a otro horario'
          });

          // Sugerir nuevo horario para la segunda clase
          const suggestedTime = findNextAvailableSlot(
            currentClass.parsedSchedule.endTime,
            dayClasses
          );

          if (suggestedTime) {
            suggestions.push({
              classId: nextClass.id,
              currentSchedule: nextClass.parsedSchedule,
              suggestedSchedule: {
                ...nextClass.parsedSchedule,
                startTime: suggestedTime.start,
                endTime: suggestedTime.end
              },
              reason: 'Evitar superposición con clase anterior'
            });
          }
        }
      }

      // Verificar carga de profesores
      const teacherClasses = dayClasses.filter(
        c => c.teacherId === currentClass.teacherId
      );

      if (teacherClasses.length > 4) {
        conflicts.push({
          type: 'teacherLoad',
          description: `El profesor tiene ${teacherClasses.length} clases el ${day}`,
          suggestion: 'Considerar redistribuir algunas clases a otros días'
        });
      }

      // Verificar uso de aulas
      const classroomClasses = dayClasses.filter(
        c => c.classroom === currentClass.classroom
      );

      if (classroomClasses.length > 8) {
        conflicts.push({
          type: 'classroomLoad',
          description: `El aula ${currentClass.classroom} tiene ${classroomClasses.length} clases el ${day}`,
          suggestion: 'Considerar usar otras aulas disponibles'
        });
      }
    }
  });

  return { conflicts, suggestions };
}

function parseStringSchedule(scheduleStr: string): Schedule {
  const [day, startTime, , endTime] = scheduleStr.split(' ');
  return { day, startTime, endTime };
}

function hasTimeConflict(schedule1: Schedule, schedule2: Schedule): boolean {
  if (schedule1.day !== schedule2.day) return false;

  const baseDate = new Date();
  const start1 = parse(schedule1.startTime, 'HH:mm', baseDate);
  const end1 = parse(schedule1.endTime, 'HH:mm', baseDate);
  const start2 = parse(schedule2.startTime, 'HH:mm', baseDate);
  const end2 = parse(schedule2.endTime, 'HH:mm', baseDate);

  return (
    isWithinInterval(start1, { start: start2, end: end2 }) ||
    isWithinInterval(end1, { start: start2, end: end2 }) ||
    isWithinInterval(start2, { start: start1, end: end1 }) ||
    isWithinInterval(end2, { start: start1, end: end1 })
  );
}

function findNextAvailableSlot(
  afterTime: string,
  existingClasses: any[]
): { start: string; end: string } | null {
  const SLOT_DURATION = 60; // duración en minutos
  const baseDate = new Date();
  const afterDateTime = parse(afterTime, 'HH:mm', baseDate);
  let proposedStart = new Date(afterDateTime);

  // Intentar encontrar el siguiente slot disponible
  while (proposedStart.getHours() < 21) { // Límite a las 21:00
    const proposedEnd = new Date(proposedStart.getTime() + SLOT_DURATION * 60000);
    const proposedSchedule = {
      day: existingClasses[0].parsedSchedule.day,
      startTime: proposedStart.toTimeString().slice(0, 5),
      endTime: proposedEnd.toTimeString().slice(0, 5)
    };

    const hasConflict = existingClasses.some(class_ =>
      hasTimeConflict(proposedSchedule, class_.parsedSchedule)
    );

    if (!hasConflict) {
      return {
        start: proposedSchedule.startTime,
        end: proposedSchedule.endTime
      };
    }

    proposedStart = proposedEnd;
  }

  return null;
}