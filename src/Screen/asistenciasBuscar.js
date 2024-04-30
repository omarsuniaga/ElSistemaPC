import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { buscarAsistenciasPorFecha, observarCambios } from '../Services/firebaseServices';
import ListarAsistencia from '../Components/Interface/listarAsistencias';

export const BuscarXFecha = ({ alumnos, categorias }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [fechasOcupadas, setFechasOcupadas] = useState({});
    const [asistencias, setAsistencias] = useState(null);
    const [presentes, setPresentes] = useState([]);
    const [ausentes, setAusentes] = useState([]);
    const [grupo, setGrupo] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const desuscribir = observarCambios('ASISTENCIAS', documentos => {
            marcarFechas(documentos);
        });
        return () => desuscribir();
    }, []);

    const marcarFechas = documentos => {
        const fechasRegistradas = {};
        documentos.forEach(e => {
            if (e.Fecha) {
                const fecha = e.Fecha;
                fechasRegistradas[fecha] = { 
                    marked: true, 
                    selected: fecha === selectedDate, 
                    selectedColor: fecha === selectedDate ? 'blue' : 'grey' };
            }
        });
        setFechasOcupadas(fechasRegistradas);
    };

    const fetchAsistencias = async () => {
        setIsLoading(true);
        try {
            const asistencias = await buscarAsistenciasPorFecha(selectedDate);
            if (asistencias) { 
                asistencias.map((asistencia) => {
                    const presentes = asistencia.Data.presentes || [];
                    const ausentes = asistencia.Data.ausentes || [];
                    const grupo = asistencia.grupo || '';
                    setPresentes(presentes);
                    setAusentes(ausentes);
                    setGrupo(grupo);
                })
                setAsistencias(asistencias);
            } else {
                setPresentes([]);
                setAusentes([]);
                setGrupo('');
                console.log('No se encontraron datos de asistencia o el formato de datos es incorrecto.');
            }
        } catch (error) {
            console.error('Error al buscar asistencias:', error);
        }
        setIsLoading(false);
    };
    
    useEffect(() => {
        if (selectedDate) {
            fetchAsistencias();
        }
    }, [selectedDate]);

    const onDayPress = (day) => {
        setSelectedDate(day.dateString);
    };

    return (
        <View style={styles.container}>
            <Calendar
                style={styles.Calendar}
                onDayPress={onDayPress}
                markedDates={{
                    ...fechasOcupadas,
                    [selectedDate]: 
                    {
                      ...fechasOcupadas[selectedDate], 
                      selected: true, 
                      selectedColor: 'green' 
                    }
                }}
            />
            {isLoading 
            ? (<ActivityIndicator size="large" color="#0000ff" />) 
            : (asistencias && 
            <ListarAsistencia 
                alumnos={alumnos} 
                presentes={presentes} 
                ausentes={ausentes} 
                categorias={categorias} 
            />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    Calendar: {
        marginHorizontal: 30,
        padding: 30,
    },
});

export default BuscarXFecha;
