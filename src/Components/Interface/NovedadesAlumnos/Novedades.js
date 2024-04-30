import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Novedades = ({ route, onBack }) => {
    const [novedad, setNovedad] = useState('');
    const { item } = route.params;
    const navigation = useNavigation();

    
    

    if (!item) {
        return <Text>No se proporcionó ningún alumno.</Text>;
      }
    

    return (
        <View style={styles.container}>
            <View style={styles.cabecera}>
                <TouchableOpacity style={styles.icon}  onPress={() => navigation.navigate('Alumnos')}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.perfilContainer} onPress={() => console.log('Abrir perfil')}>
                    <Image style={styles.fotoPerfil} source={{ uri: item.avatar }} />
                    <View>
                        <Text style={styles.nombre}>{item.nombre} {item.apellido}</Text>
                        <Text>{item.instrumento}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.icon}  onPress={() => console.log('Abrir Ajustes')}>
                    <MaterialCommunityIcons name="dots-vertical" size={24} color="black"  />
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.cuerpo}>
                {/* Aquí se podrían renderizar las novedades actuales del alumno */}
            </ScrollView>
            <View style={styles.pie}>
                <TouchableOpacity style={styles.icon}>
                    <Ionicons name="happy-outline" size={24} color="black" />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    value={novedad}
                    onChangeText={setNovedad}
                    placeholder="Añadir una novedad..."
                />
                <TouchableOpacity style={styles.icon} onPress={() => console.log('Enviar novedad')}>
                    <Ionicons name="send" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.icon}>
                    <MaterialCommunityIcons name="chart-line-stacked" size={24} color="black" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    cabecera: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        height: '15%',
        backgroundColor: '#C2F3D3',
    },
    cuerpo: {
        flex: 1,
        backgroundColor: '#F3F3F3',
    },
    pie: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '15%',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        padding: 10,
        backgroundColor: '#C2F3D3',
    },
    icon: {
        width: '13%',
        justifyContent: 'center',
        alignItems: 'center',

    },
    perfilContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '74%',
    },
    fotoPerfil: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    nombre: {
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        borderRadius: 5,
        flex: 1,
    }
});

export default Novedades;
