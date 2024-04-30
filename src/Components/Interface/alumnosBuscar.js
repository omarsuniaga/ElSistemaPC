import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const AlumnosBuscar = ({ alumnos, actualizarAlumnos }) => {
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [mostrarInput, setMostrarInput] = useState(false);

  const filtrarAlumnos = (texto) => {
    setTextoBusqueda(texto);
    if (!texto.trim()) {
      actualizarAlumnos(alumnos); // Restablece la lista completa si la búsqueda está vacía
    } else {
      const textoMinuscula = texto.toLowerCase();
      const filtrados = alumnos.filter(
        alumno => alumno.nombre.toLowerCase().includes(textoMinuscula) ||
                  alumno.apellido.toLowerCase().includes(textoMinuscula)
      );
      actualizarAlumnos(filtrados); // Actualiza la lista con los resultados filtrados
    }
  };

  const cerrarBusqueda = () => {
    setTextoBusqueda("");      // Limpia el texto de búsqueda
    actualizarAlumnos(alumnos); // Restablece la lista de alumnos
    setMostrarInput(false);    // Oculta el campo de búsqueda
  };

  return (
    <View style={styles.container}>
      {mostrarInput && (
        <>
          <TextInput
            style={styles.input}
            value={textoBusqueda}
            onChangeText={filtrarAlumnos}
            placeholder="Buscar por nombre o apellido"
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={cerrarBusqueda} style={styles.botonCerrar}>
            <Ionicons name="close" size={18} color="black" />
          </TouchableOpacity>
        </>
      )}
      {!mostrarInput && (
        <TouchableOpacity
          style={styles.icono}
          onPress={() => setMostrarInput(true)}
        >
          <Ionicons name="search" size={18} color="black" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  input: {
    flex: 1,
    marginRight: 10,
    padding: 8,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  botonCerrar: {
    padding: 8,
    marginLeft: 8,
  },
  icono: {
    padding: 8,
  },
});

export default AlumnosBuscar;
