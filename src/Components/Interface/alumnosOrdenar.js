import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Definir el orden de la orquesta
const OrdenOrquesta = [
    'Violin 1', 'Violin 2', 'Viola', 'Violoncello', 'Contrabajo',
    'Flauta', 'Oboe', 'Clarinete', 'Saxofon', 'Corno', 'Trompeta',
    'Corneta', 'Trombon', 'Tuba', 'Percusion'
];

const OrdenarListado = ({ alumnos, setAlumnos }) => {
    const [orden, setOrden] = useState('nombre');
    const [ordenMensaje, setOrdenMensaje] = useState('Por Nombre');
    const refAlumnos = useRef(alumnos);

    const limpiarYActualizarAlumnos = useCallback((alumnos) => {
        const alumnosLimpios = alumnos.map(alumno => ({
            ...alumno,
            nombre: alumno.nombre.trim(),
            instrumento: alumno.instrumento || "",
            grupo: alumno.grupo || ""
        }));
        if (JSON.stringify(refAlumnos.current) !== JSON.stringify(alumnosLimpios)) {
            setAlumnos(alumnosLimpios);
            refAlumnos.current = alumnosLimpios;
        }
    }, [setAlumnos]);

    useEffect(() => {
        limpiarYActualizarAlumnos(alumnos);
    }, [alumnos, limpiarYActualizarAlumnos]);

    const ordenarAlumnos = () => {
        let alumnosOrdenados = [...alumnos].filter(alumno => alumno.instrumento);
        switch (orden) {
            case 'nombre':
                alumnosOrdenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
                setOrden('instrumento');
                setOrdenMensaje('Por Nombre');
                break;
            case 'instrumento':
                alumnosOrdenados.sort((a, b) => a.instrumento.localeCompare(b.instrumento));
                setOrden('id');
                setOrdenMensaje('Por instrumento');
                break;
            case 'id':
                alumnosOrdenados.sort((a, b) => a.id - b.id);
                setOrden('orquesta');
                setOrdenMensaje('Por ID');
                break;
            case 'orquesta':
                alumnosOrdenados.sort((a, b) => {
                    const indexA = OrdenOrquesta.indexOf(a.instrumento);
                    const indexB = OrdenOrquesta.indexOf(b.instrumento);
                    return indexA - indexB;
                });
                setOrden('nombre');
                setOrdenMensaje('Por Orquesta');
                break;
            default:
                setOrden('nombre');
                setOrdenMensaje('Por Nombre');
                break;
        }
        setAlumnos(alumnosOrdenados);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={{ alignItems: "center", justifyContent: "center" }}
                onPress={ordenarAlumnos}
            >
                <Ionicons name="swap-vertical" size={24} color="black" />
                <Text style={styles.text}>{ordenMensaje}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
    },
    text: {
        marginLeft: 10,
        fontSize: 16
    }
});

export default OrdenarListado;
