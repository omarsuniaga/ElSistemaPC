import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { crearModulo } from '../../Services/firebaseServices';

const AgregarCategoria = () => {
  const [modulo, setModulo] = useState({
    id: Date.now(),
    nombre: '',
    profesor: '',
    descripcion: '',
  });

  const handleNombreChange = (nombre) => {
    setModulo(prevModulo => ({ ...prevModulo, nombre }));
  };

  const handleProfesorChange = (profesor) => {
    setModulo(prevModulo => ({ ...prevModulo, profesor }));
  };

  const handleDescripcionChange = (descripcion) => {
    setModulo(prevModulo => ({ ...prevModulo, descripcion }));
  };

  const handleSubmit = async () => {
    if (!modulo.nombre || !modulo.profesor || !modulo.descripcion) {
      alert('Por favor completa todos los campos.');
      return;
    }
try {
  await crearModulo(modulo)
  alert('Módulo agregado correctamente.');
  setModulo({
    id: Date.now(),
    nombre: '',
    profesor: '',
    descripcion: '',
  });
} catch (error) {
  Alert.alert('Ocurrió un error al agregar el módulo. Por favor, inténtalo de nuevo.');

}
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nombre del Módulo:</Text>
      <TextInput
        style={styles.input}
        value={modulo.nombre}
        onChangeText={handleNombreChange}
        placeholder="Nombre del Módulo"
      />
      <Text style={styles.label}>Profesor:</Text>
      <TextInput
        style={styles.input}
        value={modulo.profesor}
        onChangeText={handleProfesorChange}
        placeholder="Profesor"
      />
      <Text style={styles.label}>Descripción del Módulo:</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={modulo.descripcion}
        onChangeText={handleDescripcionChange}
        multiline
        placeholder="Descripción del Módulo"
      />
      <Button title="Agregar Categoría" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
});

export default AgregarCategoria;

