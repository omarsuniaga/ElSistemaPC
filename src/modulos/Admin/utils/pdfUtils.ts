import type { jsPDF } from 'jspdf';

export interface PDFHeaderInfo {
  title: string
  subtitle: string
  detail: string
  date: string
}

export interface HeaderContext {
  teacherName?: string
  studentName?: string
  className?: string
  day?: string
  classCount?: number
  totalStudents?: number
  studentCount?: number
  instrument?: string
  level?: string
}

export const getDayName = (day: string | number): string => {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  if (typeof day === 'number') {
    return dayNames[day] || 'Día inválido';
  }

  const dayLower = day.toLowerCase();
  const dayIndex =
    dayNamesShort.findIndex((d) => d.toLowerCase() === dayLower) ||
    dayNames.findIndex((d) => d.toLowerCase() === dayLower);

  return dayIndex !== -1 ? dayNames[dayIndex] : day;
};

export const getDayIndex = (day: string | number): number => {
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const dayNamesShort = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  if (typeof day === 'number') {
    return day >= 0 && day <= 6 ? day : 0;
  }

  const dayLower = day.toLowerCase().trim();
  let dayIndex = dayNames.findIndex((d) => d === dayLower);

  if (dayIndex === -1) {
    dayIndex = dayNamesShort.findIndex((d) => d === dayLower);
  }

  if (dayIndex === -1) {
    // Intentar mapear días en inglés también
    const englishDays = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    dayIndex = englishDays.findIndex((d) => d === dayLower);
  }

  return dayIndex !== -1 ? dayIndex : 1; // Default a lunes si no se encuentra
};

export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${startTime} - ${endTime}`;
};

export const calculateClassDuration = (startTime: string, endTime: string): number => {
  const start = new Date(`1970-01-01 ${startTime}`);
  const end = new Date(`1970-01-01 ${endTime}`);
  return (end.getTime() - start.getTime()) / (1000 * 60); // Duration in minutes
};

export const removeAccents = (text: string): string => {
  if (!text) return '';

  const normalized = text.normalize('NFD');

  const specialChars: {[key: string]: string} = {
    á: 'a',
    à: 'a',
    ä: 'a',
    â: 'a',
    ā: 'a',
    ã: 'a',
    å: 'a',
    é: 'e',
    è: 'e',
    ë: 'e',
    ê: 'e',
    ē: 'e',
    ę: 'e',
    ė: 'e',
    í: 'i',
    ì: 'i',
    ï: 'i',
    î: 'i',
    ī: 'i',
    į: 'i',
    ı: 'i',
    ó: 'o',
    ò: 'o',
    ö: 'o',
    ô: 'o',
    ō: 'o',
    õ: 'o',
    ø: 'o',
    ú: 'u',
    ù: 'u',
    ü: 'u',
    û: 'u',
    ū: 'u',
    ų: 'u',
    ů: 'u',
    ñ: 'n',
    ń: 'n',
    ç: 'c',
    ć: 'c',
    č: 'c',
    ß: 'ss',
    æ: 'ae',
    œ: 'oe',
    Á: 'A',
    À: 'A',
    Ä: 'A',
    Â: 'A',
    Ā: 'A',
    Ã: 'A',
    Å: 'A',
    É: 'E',
    È: 'E',
    Ë: 'E',
    Ê: 'E',
    Ē: 'E',
    Ę: 'E',
    Ė: 'E',
    Í: 'I',
    Ì: 'I',
    Ï: 'I',
    Î: 'I',
    Ī: 'I',
    Į: 'I',
    İ: 'I',
    Ó: 'O',
    Ò: 'O',
    Ö: 'O',
    Ô: 'O',
    Ō: 'O',
    Õ: 'O',
    Ø: 'O',
    Ú: 'U',
    Ù: 'U',
    Ü: 'U',
    Û: 'U',
    Ū: 'U',
    Ų: 'U',
    Ů: 'U',
    Ñ: 'N',
    Ń: 'N',
    Ç: 'C',
    Ć: 'C',
    Č: 'C',
    Æ: 'AE',
    Œ: 'OE',
  };

  let result = normalized;
  for (const [accented, plain] of Object.entries(specialChars)) {
    result = result.replace(new RegExp(accented, 'g'), plain);
  }

  result = result.replace(/[\u0300-\u036f]/g, '');

  return result;
};

export const sanitizeTextForPDF = (text: string): string => {
  if (!text) return '';

  let cleanText = removeAccents(text);

  cleanText = cleanText
    .replace(/[{}()<>]/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[^\x20-\x7E\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText || cleanText.length < 1) {
    return 'Sin nombre';
  }

  return cleanText;
};

export const generatePDFHeader = (
  reportType: string,
  context: HeaderContext = {},
): PDFHeaderInfo => {
  const currentDate = new Date();
  const formattedDate = `${currentDate.toLocaleDateString('es-ES')} - ${currentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

  switch (reportType) {
  case 'teacher':
  case 'schedule_by_teacher':
    return {
      title: 'HORARIO DE CLASES POR MAESTRO',
      subtitle: `Maestro: ${sanitizeTextForPDF(context.teacherName || 'No especificado')}`,
      detail: `Total de clases: ${context.classCount || 0} | Total de estudiantes: ${context.totalStudents || 0}`,
      date: `Generado el: ${formattedDate}`,
    };

  case 'student':
  case 'schedule_by_student':
    return {
      title: 'HORARIO DE CLASES POR ESTUDIANTE',
      subtitle: `Estudiante: ${sanitizeTextForPDF(context.studentName || 'No especificado')}`,
      detail: `Total de clases: ${context.classCount || 0}`,
      date: `Generado el: ${formattedDate}`,
    };

  case 'day':
  case 'schedule_by_day':
    return {
      title: 'HORARIO DE CLASES POR DIA',
      subtitle: `Dia: ${context.day || 'No especificado'}`,
      detail: `Total de clases: ${context.classCount || 0} | Total de estudiantes: ${context.totalStudents || 0}`,
      date: `Generado el: ${formattedDate}`,
    };

  case 'class':
  case 'schedule_by_class':
    return {
      title: 'HORARIO DE CLASES POR MATERIA',
      subtitle: `Clase: ${sanitizeTextForPDF(context.className || 'No especificado')}`,
      detail: `Instrumento: ${sanitizeTextForPDF(context.instrument || 'No especificado')} | Nivel: ${sanitizeTextForPDF(context.level || 'No especificado')} | Estudiantes: ${context.studentCount || 0}`,
      date: `Generado el: ${formattedDate}`,
    };

  default:
    return {
      title: 'REPORTE DE ACADEMIA DE MUSICA',
      subtitle: 'Reporte General',
      detail: 'Informacion academica',
      date: `Generado el: ${formattedDate}`,
    };
  }
};

export const addPDFHeader = (
  doc: jsPDF,
  headerInfo: PDFHeaderInfo,
  startY: number = 20,
): number => {
  let currentY = startY;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(headerInfo.title, 20, currentY);
  currentY += 12;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(headerInfo.subtitle, 20, currentY);
  currentY += 8;

  // Detail
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(headerInfo.detail, 20, currentY);
  currentY += 6;

  // Date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(headerInfo.date, 20, currentY);
  currentY += 15;

  return currentY;
};
