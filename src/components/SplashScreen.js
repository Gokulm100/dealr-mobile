import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import SplashHandshake from './SplashHandshake';
import { BRAND, COLORS } from '../utils/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WORD_SIZE = 44;
const TAGLINE_SIZE = 15;

function SplashGradient() {
  return (
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#5ba8ff" />
          <Stop offset="55%" stopColor={COLORS.splashBg} />
          <Stop offset="100%" stopColor={COLORS.primaryDeep || '#1a3fbf'} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#splashBg)" />
    </Svg>
  );
}

function SplashDecorations({ arcOpacity, arcScale, waveShift }) {
  const waveTranslateX = waveShift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH * 0.08],
  });

  return (
    <>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: arcOpacity,
            transform: [{ scale: arcScale }],
          },
        ]}
      >
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
          <Circle
            cx={SCREEN_WIDTH * 0.08}
            cy={SCREEN_HEIGHT * 0.06}
            r={SCREEN_WIDTH * 0.42}
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={SCREEN_WIDTH * 0.09}
          />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: waveTranslateX }] }]}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
          <Path
            d={`M ${SCREEN_WIDTH * 0.18} ${SCREEN_HEIGHT * 0.78}
                C ${SCREEN_WIDTH * 0.42} ${SCREEN_HEIGHT * 0.72}, ${SCREEN_WIDTH * 0.58} ${SCREEN_HEIGHT * 0.86}, ${SCREEN_WIDTH * 1.05} ${SCREEN_HEIGHT * 0.8}`}
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <Path
            d={`M ${SCREEN_WIDTH * 0.12} ${SCREEN_HEIGHT * 0.86}
                C ${SCREEN_WIDTH * 0.38} ${SCREEN_HEIGHT * 0.8}, ${SCREEN_WIDTH * 0.62} ${SCREEN_HEIGHT * 0.94}, ${SCREEN_WIDTH * 1.08} ${SCREEN_HEIGHT * 0.88}`}
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </>
  );
}

export default function SplashScreen() {
  const arcOpacity = useRef(new Animated.Value(0.55)).current;
  const arcScale = useRef(new Animated.Value(1)).current;
  const waveShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const arcPulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(arcOpacity, {
            toValue: 1,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(arcOpacity, {
            toValue: 0.55,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(arcScale, {
            toValue: 1.04,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(arcScale, {
            toValue: 1,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const waveDrift = Animated.loop(
      Animated.sequence([
        Animated.timing(waveShift, {
          toValue: 1,
          duration: 5600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveShift, {
          toValue: 0,
          duration: 5600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    arcPulse.start();
    waveDrift.start();

    return () => {
      arcPulse.stop();
      waveDrift.stop();
    };
  }, [arcOpacity, arcScale, waveShift]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor={COLORS.splashBg} />
      <SplashGradient />
      <SplashDecorations arcOpacity={arcOpacity} arcScale={arcScale} waveShift={waveShift} />
      <View style={styles.content} pointerEvents="none">
        <SplashHandshake size={118} style={styles.mark} />
        <Text
          style={[
            styles.wordmark,
            {
              fontSize: WORD_SIZE,
              lineHeight: WORD_SIZE + 6,
              fontFamily: BRAND.wordmarkFont,
            },
          ]}
          accessibilityRole="header"
        >
          <Text style={styles.wordLead}>Dea</Text>
          <Text style={styles.wordAccent}>l</Text>
          <Text style={styles.wordLead}>r</Text>
        </Text>
        <Text style={styles.tagline}>Deal with the Right App!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.splashBg,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -24,
  },
  mark: {
    marginBottom: 30,
  },
  wordmark: {
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
  },
  wordLead: {
    color: COLORS.white,
  },
  wordAccent: {
    color: BRAND.accentL,
  },
  tagline: {
    marginTop: 10,
    color: COLORS.white,
    fontSize: TAGLINE_SIZE,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
