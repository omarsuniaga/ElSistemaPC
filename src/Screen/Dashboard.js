import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import VerCategorias from '../Components/Interface/categoriasVer';
import AgregarCategoria from '../Components/Interface/categoriasRegistrar'; 

const Stack = createStackNavigator();

const DashboardStack = () => {
  return (
    <Stack.Navigator initialRouteName="DashboardHome">
      <Stack.Screen name="Categorias" component={Dashboard} />
      <Stack.Screen name="VerCategorias" component={VerCategorias} />
      <Stack.Screen name="AgregarCategoria" component={AgregarCategoria}   />
    </Stack.Navigator>
  );
};

const Dashboard = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido al Dashboard</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Agregar Categoría"
          onPress={() => navigation.navigate('AgregarCategoria')}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Ver Categorías"
          onPress={() => navigation.navigate('VerCategorias')}        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginVertical: 10,
  },
});

export default DashboardStack;