import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const HANDSHAKE_MARK = require('../../assets/handshake-mark.png');

export default function SplashHandshake({ size = 118, style }) {
  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Image
        source={HANDSHAKE_MARK}
        style={{ width: size, height: size }}
        fadeDuration={0}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
