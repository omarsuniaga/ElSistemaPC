// mostrar el logo de nuestra app

import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

const Logo = () => (
        <Image
        source={require('../../../assets/logo.png')}
        style={styles.image}
        />
    );

const styles = StyleSheet.create({

    image: {
        width: 170,
        height: 90,
        borderWidth: 2,
        borderColor: '#fff',
    }
});

export default Logo;

