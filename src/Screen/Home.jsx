import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const sharedStyles = StyleSheet.create({
  button: {
    backgroundColor: '#53A3A3',
    color: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 56,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  text: {
    color: '#4a4a4a',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  hoy: {
    fontWeight: 'bold',
    fontSize: 25,
    color: '#53A3A3',
  },
  bold: {
    fontWeight: 'bold',
  },
  container: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  margin: {
    margin: 8,
  },
  fullWidth: {
    width: '100%',
  },
});

const Home = () => {
  return (
    <ScrollView style={sharedStyles.container}>
      <Text style={[sharedStyles.hoy, sharedStyles.bold, sharedStyles.margin]}>{obtenerFechaActual()}</Text>
      <View style={sharedStyles.row}>
        <Card
          imageUrl="https://cdn.domestika.org/c_fill,dpr_1.0,f_auto,h_1200,pg_1,t_base_params,w_1200/v1609627665/project-covers/001/011/205/1011205-original.png?1609627665"
          title="Orquesta Sinfónica de Punta Cana"
          description="Listado de Asistencias"
        />
        <Card
          imageUrl="https://funeyca.org/wp-content/uploads/2024/03/photo1710901539.jpeg"
          title="Programa Coral de Punta Cana"
          description="Ver Listados de Alumnos"
        />
      </View>

      <Text style={[sharedStyles.title, sharedStyles.bold, sharedStyles.margin]}>Reporte Asistencias</Text>
      <View style={[sharedStyles.row, sharedStyles.fullWidth]}>
        <AppButton title="Con más asistencias" opciones="Abrir" routeName="MoreAttendance" />
        <AppButton title="Con menos asistencias" opciones="Logear" routeName="LessAttendance" />
      </View>

      <Text style={[sharedStyles.title, sharedStyles.bold, sharedStyles.margin]}>Reporte Diario</Text>
      <Card
        imageUrl="https://funeyca.org/wp-content/uploads/2024/03/photo1710901488.jpeg"
        title="Ya está disponible"
        showButton={true}
      />
    </ScrollView>
  );
};

const Card = ({ imageUrl, title, description, showButton }) => {
  return (
    <View style={sharedStyles.card}>
      <Image source={{ uri: imageUrl }} style={{ height: 300, width: '100%' }} />
      <View style={{ padding: 8 }}>
        <Text style={[sharedStyles.title, sharedStyles.text]}>{title}</Text>
        <Text style={sharedStyles.text}>{description}</Text>
        {showButton && <TouchableOpacity style={sharedStyles.button}><Text style={{ color: 'white' }}>Explorar</Text></TouchableOpacity>}
      </View>
    </View>
  );
};

const AppButton = ({ title, opciones, routeName }) => {
  const navigation = useNavigation();

  return (
    <View style={[sharedStyles.col, sharedStyles.margin]}>
      <Text style={[sharedStyles.title, sharedStyles.text]}>{title}</Text>
      <TouchableOpacity style={[sharedStyles.fullWidth, sharedStyles.button]} onPress={() => navigation.navigate(routeName)}>
        <Text style={{ color: 'white' }}>{opciones}</Text>
      </TouchableOpacity>
    </View>
  );
};

const obtenerFechaActual = () => {
    const fecha = new Date();
    const opciones = { month: 'long', day: 'numeric' };
    const formatoLocal = new Intl.DateTimeFormat('es-ES', opciones).format(fecha);
    return `Hoy ${formatoLocal}`;
};

export default Home;
