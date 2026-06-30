import React from 'react';
import { Image } from 'react-native';

export default function DealrMark({ size = 36, style, source }) {
  return (
    <Image
      source={source || require('../../assets/app-mark.png')}
      style={[{ width: size, height: size }, style]}
      fadeDuration={0}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
