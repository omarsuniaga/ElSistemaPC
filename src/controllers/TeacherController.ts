import { Request, Response } from 'express';
import { Teacher } from '../models/Teacher';

let teachers: Teacher[] = [];

// Registrar un nuevo maestro
export const registerTeacher = (req: Request, res: Response) => {
	// Supone que la validación se realiza previamente
	const newTeacher: Teacher = req.body;
	teachers.push(newTeacher);
	res.status(201).json(newTeacher);
};

// Actualizar la información de un maestro existente
export const updateTeacher = (req: Request, res: Response) => {
	const teacherId = req.params.id;
	const index = teachers.findIndex(t => t.id === teacherId);
	if (index === -1) {
		return res.status(404).json({ message: 'Teacher not found' });
	}
	teachers[index] = { ...teachers[index], ...req.body };
	res.json(teachers[index]);
};

// Eliminar un maestro
export const deleteTeacher = (req: Request, res: Response) => {
	const teacherId = req.params.id;
	teachers = teachers.filter(t => t.id !== teacherId);
	res.status(204).send();
};

// Obtener perfil del maestro, incluyendo clases, estudiantes y horario
export const getTeacherProfile = (req: Request, res: Response) => {
	const teacherId = req.params.id;
	const teacher = teachers.find(t => t.id === teacherId);
	if (!teacher) {
		return res.status(404).json({ message: 'Teacher not found' });
	}
	res.json(teacher);
};
