import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { COLORS, SHADOW } from '../utils/theme';

const SPLASH_MARK = require('../../assets/splash-mark.png');
const CORNER_RATIO = 0.223;

export default function SplashAppIcon({ size = 136, style }) {
  const radius = Math.round(size * CORNER_RATIO);

  return (
    <View style={[styles.shadowWrap, style, SHADOW.medium]}>
      <View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: COLORS.primary,
          },
        ]}
      >
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="splashIconBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#4da3ff" />
              <Stop offset="100%" stopColor="#2f7fe8" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill="url(#splashIconBg)" />
        </Svg>
        <Image
          source={SPLASH_MARK}
          style={{ width: size, height: size }}
          fadeDuration={0}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    alignSelf: 'center',
  },
  tile: {
    overflow: 'hidden',
  },
});
