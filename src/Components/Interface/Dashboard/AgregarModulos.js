import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { addCategoria } from '../Services/firebaseServices'; // Suponiendo que tienes una función para agregar categorías en tu archivo firebaseServices

const AgregarCategoriaScreen = () => {
  const [nombreModulo, setNombreModulo] = useState('');
  const [profesor, setProfesor] = useState('');
  const [descripcionModulo, setDescripcionModulo] = useState('');

  const handleSubmit = () => {
    // Verificar que los campos requeridos no estén vacíos
    if (!nombreModulo || !profesor || !descripcionModulo) {
      alert('Por favor completa todos los campos.');
      return;
    }

    // Llamar a la función para agregar la categoría en Firebase
    addCategoria({
      nombreModulo,
      profesor,
      descripcionModulo
    }).then(() => {
      // Éxito al agregar la categoría
      alert('Categoría agregada correctamente.');
      // Limpiar los campos después de agregar la categoría
      setNombreModulo('');
      setProfesor('');
      setDescripcionModulo('');
    }).catch(error => {
      // Manejar errores si la operación falla
      console.error('Error al agregar la categoría:', error);
      alert('Ocurrió un error al agregar la categoría. Por favor, inténtalo de nuevo.');
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nombre del Módulo:</Text>
      <TextInput
        style={styles.input}
        value={nombreModulo}
        onChangeText={setNombreModulo}
        placeholder="Nombre del Módulo"
      />
      <Text style={styles.label}>Profesor:</Text>
      <TextInput
        style={styles.input}
        value={profesor}
        onChangeText={setProfesor}
        placeholder="Profesor"
      />
      <Text style={styles.label}>Descripción del Módulo:</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        value={descripcionModulo}
        onChangeText={setDescripcionModulo}
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

export default AgregarCategoriaScreen;
