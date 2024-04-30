import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Image} from 'react-native';

const FotoPerfil = ({ avatar }) => {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      {loading && (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
      <Image
        source={{ uri: avatar}}
        style={loading ? styles.hidden : styles.image}
        onLoad={() => setLoading(false)}
        onError={(e) => {
          console.log('Error al cargar la imagen:', e.nativeEvent);
          setLoading(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 55,
    width: 55
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  hidden: {
    width: 0,
    height: 0,
  }
});

export default FotoPerfil;