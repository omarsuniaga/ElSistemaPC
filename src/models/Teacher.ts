export interface Teacher {
	// Identificador único para el maestro
	id: string;
	name: string;
	email: string;
	// Horario de clases: por ejemplo, día y hora de clase
	schedule?: Array<{ day: string; time: string }>;
	// Clases: cada clase tiene un id, nombre y listado de estudiantes
	classes?: Array<{ id: string; name: string; students: Array<{ id: string; name: string }> }>;
}
