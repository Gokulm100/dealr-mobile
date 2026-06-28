import React from 'react';
import { Image } from 'react-native';

export default function DealrMark({ size = 36, style }) {
  return (
    <Image
      source={require('../../assets/icon.png')}
      style={[{ width: size, height: size }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
