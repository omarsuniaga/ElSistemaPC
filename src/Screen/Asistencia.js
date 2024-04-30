import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Button,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Modal
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import FotoPerfil from "../Components/Interface/VerAlumnos/Cuerpo/FotoPerfil";
import OrdenarListado from "../Components/Interface/alumnosOrdenar";
import Filtros from "../Components/Interface/alumnosFiltrar";
import { guardarAsistencia } from "../Services/firebaseServices";
import AlumnoBuscar from "../Components/Interface/alumnosBuscar";
import AlumnoItem from "../Components/Interface/AlumnosItem";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { set } from "firebase/database";

export default function Asistencia({ alumnos, categorias }) {
  const [listado, setListado] = useState([]); // Guarda una copia de alumnos para filtrar
  const [presentes, setPresentes] = useState([]);
  const [ausentes, setAusentes] = useState([]);
  const [grupo, setGrupo] = useState("");
  const [visible, setVisible] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [alumnosFiltrados, setAlumnosFiltrados] = useState(alumnos);
  const [modalVisible, setModalVisible] = useState(false);
  
  const modalWidth = Dimensions.get('window').width/2;
  const modalHeight = Dimensions.get('window').height/4;

  useEffect(() => {
    // Filtrar inicialmente los alumnos ausentes si es necesario
    setAusentes(alumnosFiltrados.filter(al => !al.presente));
}, [alumnosFiltrados]);

  useEffect(() => {
    const nuevosAusentes = listado.filter(
      al => !presentes.some(p => p.id === al.id)
    );
    setAusentes(nuevosAusentes);
  }, [listado, presentes]);

  useEffect(() => {
    setListado([...alumnos]);
  }, [alumnos]);

  const handleAsistencia = useCallback((alumno, presente) => {
    if (presente) {
      setPresentes(prev => [...prev, alumno]);
      setAusentes(prev => prev.filter(a => a.id !== alumno.id));
    } else {
      setPresentes(prev => prev.filter(p => p.id !== alumno.id));
      setAusentes(prev => [...prev, alumno]);
    }
  }, []);

  const formatDate = () => {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const actualizarAlumnos = (filtrados) => {
    setAlumnosFiltrados(filtrados);
  };
  
  const onSave = async () => {
    const Data = {
      presente: presentes.map(p => p.id),
      ausente: ausentes.map(a => a.id),
      fecha: formatDate(),
      grupo: categoriaSeleccionada,
    };
    if (Data.grupo === null || Data.grupo === "" || Data.grupo === undefined) {
        setModalVisible(true);
    } else {
      setModalVisible(false);
      // await guardarAsistencia(Data);
      Alert.alert("Asistencia guardada correctamente");
      console.log("Guardado", Data);
    }
  };

  const onFiltrar = categoria => {
    const filtered = alumnos.filter(alumno =>
      alumno.grupo.includes(categoria)
    );
    setModalVisible(false);
    setCategoriaSeleccionada(categoria);
    setListado(filtered);
  };

  const SaveButton = ({ text, icon }) => {
    return (
      <TouchableOpacity style={styles.submenuButton} onPress={() => onSave()}>
        <MaterialIcons name={icon} size={24} color="black" />
        <Text>{text}</Text>
      </TouchableOpacity>
    );
  };

  const MenuCategorias = ({ index, categoria }) => (
    <TouchableOpacity
      onPress={() => onFiltrar(categoria)}
      key={index}
      style={[
        styles.filterButton,
        categoria === categoriaSeleccionada
          ? styles.categoriaSeleccionada
          : null,
      ]}
    >
      <Text style={styles.itemMenu}>{categoria}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlumnoBuscar 
        style={styles.iconoBuscar}
        alumnos={alumnos} actualizarAlumnos={setListado}
        />
      </View>
      <View style={styles.menu}>
        {/* Menu */}
        <OrdenarListado alumnos={listado} setAlumnos={setListado} />
        <Filtros alumnos={listado} setAlumnos={setListado} grupo={grupo} />
        <SaveButton text="Guardar" icon="save" />
      </View>
      <View style={styles.subMenu}>
        {visible ? (
          <ActivityIndicator size="large" color="#0000ff" /> // Muestra el spinner mientras carga
        ) : (
          categorias.map((categoria) => (
            <MenuCategorias categoria={categoria.nombre} key={categoria.id} />
          ))
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { width: modalWidth, height: modalHeight }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close-circle" size={24} color="black" />
            </TouchableOpacity>
            <View style={styles.contentContainer}>
              <View style={styles.column}>
                <Text style={styles.modalTitle}>Elige un grupo de clase</Text>
                <ScrollView style={styles.scrollArea}>
                  {categorias.map((categoria) => (
                    <TouchableOpacity
                      key={categoria.id}
                      onPress={() => onFiltrar(categoria.nombre)}
                      style={styles.itemButton}
                    >
                      <Text>{categoria.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.listContainer}>
        <FlatList
          data={ausentes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <AlumnoItem
              item={item}
              onPress={() =>
                handleAsistencia(item, !presentes.some((p) => p.id === item.id))
              }
              presente={presentes.some((p) => p.id === item.id)}
            />
          )}
          initialNumToRender={10} // Número de items inicialmente renderizados
          maxToRenderPerBatch={10} // Número máximo de items por lote de renderización
          ListHeaderComponent={() => (
            <Text style={styles.listTitle}>Ausentes</Text>
          )}
          style={{ flex: 1, marginRight: 2 }}
        />


        <FlatList
          data={presentes}
          style={{ flex: 1, marginRight: 2 }}
          keyExtractor={(item) => item.id.toString()}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          ListHeaderComponent={() => (
            <Text style={styles.listTitle}>Presentes</Text>
          )}
          renderItem={({ item }) => (
            <AlumnoItem
              item={item}
              onPress={()=>handleAsistencia(item, !presentes.some((p) => p.id === item.id))}
              presente={presentes.some((p) => p.id === item.id)}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    position: "relative",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 10,
  },
  iconoBuscar: {
    position: "absolute",
    padding: 10,
    right: 0,
    top: 0,
  },
  menu: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    margin: 10,
  },
  subMenu: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  listContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  itemMenu: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    marginVertical: 5,
    borderRadius: 15,
  },
  filterButton: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  categoriaSeleccionada: {
    backgroundColor: "#7ADCC6",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemButton: {
    marginVertical: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  column: {
    flex: 1,
    padding: 50,
  },
  scrollArea: {
    maxHeight: 300, // Ajusta según la altura deseada
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  

});
