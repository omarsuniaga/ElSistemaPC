import { Router } from 'express';
import { registerTeacher, updateTeacher, deleteTeacher, getTeacherProfile } from '../controllers/TeacherController';

const router = Router();

router.post('/', registerTeacher);          // Registrar maestros
router.put('/:id', updateTeacher);            // Editar/Modificar maestros
router.delete('/:id', deleteTeacher);         // Eliminar maestros
router.get('/:id/profile', getTeacherProfile); // Obtener perfil de un maestro

export default router;
