import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import OrdenarListado from '../Components/Interface/alumnosOrdenar';
import AlumnoItem from '../Components/Alumnos/AlumnosItem';

const Alumnos = ({ alumnos }) => {
  const [listado, setListado] = useState([]);
  const navigation = useNavigation();

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    setListado(alumnos || []);
  }, [alumnos]);

  const onOpen = useCallback((item) => {
    navigation.navigate('Novedades', { item });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.cabecera}>
        <Text style={styles.headerTitle}>Listado de Alumnos</Text>
        <OrdenarListado alumnos={listado} setAlumnos={setListado} />
      </View>
      <FlatList
        data={listado}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <AlumnoItem item={item} onOpen={onOpen} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 1,
    borderRadius: 15,
    width: '100%',
    position: 'relative',
    padding: 5,
  },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: 'left',
  },
});

export default Alumnos;
