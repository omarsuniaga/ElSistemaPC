//AlumnosListados.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator  } from 'react-native';
import FotoPerfil from '../Interface/VerAlumnos/Cuerpo/FotoPerfil'; // Asegúrate de que la ruta a FotoPerfil es correcta
import { Ionicons } from "@expo/vector-icons";

const AlumnosListados = ({ alumnos }) => {
  const [listado, setListado] = useState(alumnos);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setListado(alumnos);
  }, [alumnos]); // Esto sincronizará el estado cada vez que el prop 'alumnos' cambie
  

const onOpen = (id) => {
    console.log('Identificador: ', id);
    }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Alumnos Listados</Text>
      <FlatList
        data={listado}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
        <TouchableOpacity style={styles.buttonContainer}
            onPress={() => onOpen(item.id)}>
            <View style={styles.container}>
                <View style={styles.avatar}>
                   <FotoPerfil avatar={item.avatar} onOpen={onOpen}/>
                    <View style={styles.contenedor}>
                        <Text style={styles.nombre}>{item.nombre} {item.apellido}</Text>
                        <Text style={styles.instrumento}>{item.instrumento}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      backgroundColor: "white",
      padding: 10,
      borderRadius: 8,
      marginTop: 1,
      margin: 0,
    },
    cabecera: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 2,
      marginBottom: 1,
    },
    nombre: {
      marginHorizontal: 15,
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "left",
    },
   instrumento: {
      marginHorizontal: 15,
      fontSize: 12,
      textAlign: "left",
    },
    image: {
        width: 70, 
        height:70,
        borderRadius: 50, 
        borderWidth: 2,
        borderColor: '#fff', 
      },
    avatar: {
        flexDirection: "row",
        alignItems: "center",

    },
    buttonContainer: {
      flex: 1,
      justifyContent: "space-between",
      marginTop: 2,
      marginBottom: 1,
    },
   
  });
  
export default AlumnosListados;