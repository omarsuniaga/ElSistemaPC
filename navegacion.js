import { createStackNavigator } from '@react-navigation/stack';
import Alumno from './src/Screen/Alumno';
import listarAsistencia from './src/Components/Interface/listarAsistencias';
import BuscarAlumnos from './src/Components/Interface/VerAlumnos/BuscarAlumnos';

const Stack = createStackNavigator();

export function MyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Alumno" component={Alumno} />
      <Stack.Screen name="listarAsistencia" component={listarAsistencia} />
      <Stack.Screen name="BuscarAlumnos" component={BuscarAlumnos} />
    </Stack.Navigator>
  );
}