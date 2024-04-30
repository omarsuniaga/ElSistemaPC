import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList } from 'react-native';
import { obtenerModulos } from '../../Services/firebaseServices';
import { FAB } from 'react-native-paper'; // Para el botón circular
import { useNavigation } from '@react-navigation/native';


const VerCategorias = () => {
  const [modulos, setModulos] = useState([]);

  useEffect(() => {
    obtenerModulos().then(setModulos);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={modulos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.label}>Nombre del Módulo: {item.nombre}</Text>
            <Text style={styles.label}>Profesor: {item.profesor}</Text>
            <Text style={styles.label}>Descripción del Módulo: {item.descripcion}</Text>
          </View>
        )}
      />
      {/* <FAB
        style={styles.fab}
        small
        icon="plus"
        onPress={() => navigation.navigate('AgregarCategoriaScreen')}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  item: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default VerCategorias;