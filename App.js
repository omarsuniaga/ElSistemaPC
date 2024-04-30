import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createStackNavigator } from '@react-navigation/stack';
import Home from "./src/Screen/Home";
// import Alumnos from "./src/Screen/Alumnos";
import Asistencia from "./src/Screen/Asistencia";
import Dashboard from "./src/Screen/Dashboard";
import {BuscarXFecha} from "./src/Screen/asistenciasBuscar";
import { cargarAlumnos, observarCambios, cargarCategorias } from "./src/Services/firebaseServices";
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerCategoriasScreen from './src/Components/Interface/categoriasVer';
import AgregarCategoriaScreen from './src/Components/Interface/categoriasRegistrar'; 

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();


export default function App() {
  const [listadoAlumnos, setListadoAlumnos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  useEffect(() => {
    let desuscribir = () => {};
    async function fetchData() {
      try {
        // Intenta obtener los alumnos guardados en AsyncStorage
        const alumnosGuardados = await AsyncStorage.getItem('alumnos');
        if (alumnosGuardados) {
          // Si hay alumnos guardados, establece el estado con esos datos
          setListadoAlumnos(JSON.parse(alumnosGuardados));
        } else {
          // Si no hay datos guardados, carga los alumnos desde Firebase
          const alumnosCargados = await cargarAlumnos() || [];
          // Actualiza el estado con los datos cargados
          setListadoAlumnos(alumnosCargados);
          // Observa los cambios en Firebase y actualiza los datos si es necesario
          desuscribir = observarCambios('ALUMNOS', setListadoAlumnos);
          // Guarda los alumnos en AsyncStorage para su uso futuro
          await AsyncStorage.setItem('alumnos', JSON.stringify(alumnosCargados));
        }
        const categoriasGuardadas = await AsyncStorage.getItem('categorias');
        if (categoriasGuardadas) {
          // Si hay categorias guardadas, establece el estado con esos datos
          setCategorias(JSON.parse(categoriasGuardadas));
        } else {
          // Si no hay datos guardados, carga los alumnos desde Firebase
          const categoriasCargadas = await cargarCategorias() || [];
          // Actualiza el estado con los datos cargados
          setCategorias(categoriasCargadas);
          // Guarda los alumnos en AsyncStorage para su uso futuro
          await AsyncStorage.setItem('categorias', JSON.stringify(categoriasCargadas));
        }
      } catch (error) {
        // Manejo de errores en la carga de alumnos
        console.error("Error al cargar los alumnos:", error);
        setListadoAlumnos([]);
      }
    }
    // Llama a la función fetchData al inicio de la aplicación
    fetchData();
    // Retorna la función de desuscripción para limpiar los efectos
    return () => desuscribir();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons name={iconName(route.name, focused)} color={color} size={size} />
          ),
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        {/* <Tab.Screen 
        name="Alumnos"
        options={{
          // tabBarLabel: 'Alumnos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
          // tabBarBadge: 3,
          // headerShown:false
        }}
        >
          {() => <Alumnos alumnos={listadoAlumnos} setAlumnos={setListadoAlumnos} />}
        </Tab.Screen> */}
        <Tab.Screen name="Home" options={{
            headerShown: false,
          }}>
          {() => <Home alumnos={listadoAlumnos} setAlumnos={setListadoAlumnos} />}
        </Tab.Screen>
        <Tab.Screen name="Asistencia">
          {() => <Asistencia alumnos={listadoAlumnos} setAlumnos={setListadoAlumnos} categorias={categorias}/>}
        </Tab.Screen>
        <Tab.Screen name="Buscar">
          {() => <BuscarXFecha alumnos={listadoAlumnos} setAlumnos={setListadoAlumnos}  categorias={categorias}/>}
        </Tab.Screen>
        <Tab.Screen name="Dashboard" component={Dashboard} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Función para obtener el nombre del icono basado en el nombre de la ruta y si está enfocado
function iconName(routeName, focused) {
  const icons = {
    'Alumnos': focused ? 'account-group' : 'account-group-outline',
    'Asistencia': focused ? 'calendar-check' : 'calendar-check-outline',
    'Dashboard': focused ? 'view-dashboard' : 'view-dashboard-outline',
  };
  return icons[routeName] || 'account-group';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
