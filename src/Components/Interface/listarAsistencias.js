import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { obtenerModulos, cargarCategorias } from "../../Services/firebaseServices";


export default function listarAsistencia({ alumnos, ausentes, presentes, categorias, isLoading }) {
  const [listado, setListado] = useState([...alumnos]);


  const onFiltrar = (categoria) => {
    // Buscar en la lista de alumnos los que pertenecen al grupo seleccionado
    const alumnosFiltrados = listado.filter(alumno => alumno.grupo.some(e => e === categoria));
    // Buscamos quienes de los alumnos filtrados están presentes y ausentes
    const alumnosPresentes = alumnosFiltrados.filter(alumno => presentes.includes(alumno.id));
    const alumnosAusentes = alumnosFiltrados.filter(alumno => ausentes.includes(alumno.id));
    presentes = alumnosPresentes
    ausentes = alumnosAusentes

    // Actualiza el estado con los alumnos filtrados
    setListado(alumnosFiltrados);
};
useEffect(() => {
  setListado([...alumnos]);
}, [alumnos]);

  const obtenerAlumnoPorId = (id) => {
    // Filtra el listado para eliminar los alumnos cuya id no esté definida
    const alumnosFiltrados = listado.filter(alumno => alumno.id);
    // setListado(alumnosFiltrados);

    // Busca en el listado filtrado el alumno con la id proporcionada
    const alumno = alumnosFiltrados.find(e => e.id === id);
    
    // Devuelve el nombre, apellido e instrumento del alumno, o 'N/A' si no se encuentra ningún alumno
    return alumno ? `${alumno.nombre} ${alumno.apellido} - ${alumno.instrumento}` : id;
};

  const handleAsistencia = (id) => {
    console.log('ID:', id);
  }

  const AlumnoItem = React.memo(({item}) => (
    <TouchableOpacity
       style={[
          styles.card,
          presentes.some((p) => p === item)
            ? styles.presente
            : ausentes.some((a) => a === item)
            ? styles.ausente
            : null
      ]}
      onPress={() => handleAsistencia(item)}>
    <Text style={styles.titulo}>{obtenerAlumnoPorId(item)}</Text>
    <Text style={styles.instrumento}>{item.instrumento}</Text>
    </TouchableOpacity>
  ));


  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
          styles.card,
          presentes.some((p) => p === item)
            ? styles.presente
            : ausentes.some((a) => a === item)
            ? styles.ausente
            : null
      ]}
      onPress={() => handleAsistencia(item)}
    >
      <Text style={styles.titulo}>{obtenerAlumnoPorId(item)}</Text>
      <Text style={styles.subTitulo}>{obtenerAlumnoPorId(item)}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.menu}>
        {categorias.map((categoria) => (
          <TouchableOpacity 
              key={categoria.id} 
              style={styles.filterButton} 
              onPress={()=>onFiltrar(categoria.nombre)}>
            <Text style={styles.titulo}>{categoria.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.listContainer}>
      <FlatList
          data={ausentes}
          style={{ flex: 1, marginRight: 2 }}
          keyExtractor={(item) => item}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          ListHeaderComponent={() => (
            <Text style={styles.listTitle}>Ausentes</Text>
          )}
          renderItem={({ item }) => (
            <AlumnoItem
              item={item}
              onPress={()=>handleAsistencia(item)}
              presente={ausentes.some((p) => p.id === item.id)}
            />
          )}
        />
        <FlatList
          data={presentes}
          style={{ flex: 1, marginRight: 2 }}
          keyExtractor={(item) => item}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          ListHeaderComponent={() => (
            <Text style={styles.listTitle}>Presentes</Text>
          )}
          renderItem={({ item }) => (
            <AlumnoItem
              item={item}
              onPress={()=>handleAsistencia(item)}
              presente={presentes.some((p) => p.id === item.id)}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 5,
  },
  menu: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  listContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    margin: 10,
  },
  filterButton: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
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
    alignItems: "flex-end",
    justifyContent: "flex-end",
    marginVertical: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
