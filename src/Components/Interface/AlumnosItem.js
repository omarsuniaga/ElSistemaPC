import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import FotoPerfil from './VerAlumnos/Cuerpo/FotoPerfil';  // Ajusta la ruta de importación según la estructura de tu proyecto

const AlumnoItem = React.memo(({ item, onPress, presente }) => (
  <TouchableOpacity
    style={[
      styles.card,
      presente ? styles.presente : styles.ausente,
    ]}
    onPress={onPress}>
    <Text style={styles.titulo}>
      {item.nombre} {item.apellido} {" "}
    </Text>
    <Text style={styles.instrumento}>{item.instrumento}</Text>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    marginVertical: 2,
    borderRadius: 15,
  },
  titulo: {
    marginLeft: 10,
    fontWeight: "bold",
  },
  subtitulo: {
    marginHorizontal: 15,
    paddingTop: 10,
    fontSize: 12,
    textAlign: "left",
  },
  presente: {
    backgroundColor: "#7ADCC6",
  },
  ausente: {
    backgroundColor: "#D46652",
  },
  instrumento: {
    fontSize: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
});

export default AlumnoItem;
