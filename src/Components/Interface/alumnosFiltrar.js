import React, { useState, useEffect } from "react";
import {
  Modal,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const Filtros = ({ alumnos, setAlumnos }) => {
  const [instrumentos, setInstrumentos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [alumnosCompletos, setAlumnosCompletos] = useState([...alumnos]); // Guarda una copia de alumnos para filtrar

  const modalWidth = Dimensions.get('window').width;
  const modalHeight = Dimensions.get('window').height;

  useEffect(() => {
    const instrumentosSet = new Set();
    const gruposSet = new Set();

    alumnos.forEach((alumno) => {
      instrumentosSet.add(alumno.instrumento);
      alumno.grupo.forEach((grupo) => {
        if (grupo) gruposSet.add(grupo);
      });
    });

    setInstrumentos(Array.from(instrumentosSet));
    setGrupos(Array.from(gruposSet));
    setAlumnosCompletos([...alumnos]); // Guarda la lista completa de alumnos
  }, [alumnos]);

  const handleSelect = (categoria, valor) => {
    let alumnosFiltrados;
    if (categoria === "grupo") {
      alumnosFiltrados = alumnosCompletos.filter(
        (alumno) => alumno[categoria].includes(valor)
      );
    } else {
      alumnosFiltrados = alumnosCompletos.filter(
        (alumno) => alumno[categoria] === valor
      );
    }
    setAlumnos(alumnosFiltrados);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="filter-list" size={24} color="black" />
        <Text>Filtrar</Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setAlumnos([...alumnosCompletos]); // Restablece a la lista completa al cerrar
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
                <Text style={styles.modalTitle}>Grupos</Text>
                <ScrollView style={styles.scrollArea}>
                  {grupos.map((grupo, id) => (
                    <TouchableOpacity
                      key={id}
                      onPress={() => handleSelect("grupo", grupo)}
                      style={styles.itemButton}
                    >
                      <Text>{grupo}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.column}>
                <Text style={styles.modalTitle}>Instrumentos</Text>
                <ScrollView style={styles.scrollArea}>
                  {instrumentos.map((instrumento, id) => (
                    <TouchableOpacity
                      key={id}
                      onPress={() => handleSelect("instrumento", instrumento)}
                      style={styles.itemButton}
                    >
                      <Text>{instrumento}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
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
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  filterButton: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemButton: {
    marginVertical: 5,
  },
  contentContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  column: {
    flex: 1,
    paddingHorizontal: 10,
  },
  scrollArea: {
    maxHeight: 300, // Ajusta según la altura deseada
  },
});

export default Filtros;
