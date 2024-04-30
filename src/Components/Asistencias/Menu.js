import React, {useState, useEffect} from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from "@expo/vector-icons";
import OrdenarListado from '../Interface/alumnosOrdenar';
import Filtros from '../Interface/alumnosFiltrar';

const MenuAsistencia = ({ onSave, alumnos, setAlumnnos }) => {
  const [listado, setListado] = useState([...alumnos]); // Guarda una copia de alumnos para filtrar
  useEffect(() => {
    setListado([...alumnos]);
  }, [alumnos]);
  
  return (
    <View style={styles.container}>
      <OrdenarListado alumnos={listado} setAlumnos={setListado} />
      <Filtros alumnos={alumnos}  setAlumnos={setListado} />
      <TouchableOpacity onPress={onSave} style={styles.option}>
        <Ionicons name="save" size={24} color="black" />
        <Text style={styles.optionText}>Guardar</Text>
      </TouchableOpacity>
      <TouchableOpacity  style={styles.filterButton} >
        <MaterialIcons name="picture-as-pdf" size={24} color="black" />
        <Text>Descargar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 10,
  },
  option: {
    alignItems: 'center',
  },
  optionText: {
    marginTop: 5,
  },
});

export default MenuAsistencia;
