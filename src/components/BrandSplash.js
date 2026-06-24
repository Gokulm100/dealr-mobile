import React, { useEffect, useRef } from 'react';
import {
  Image,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { COLORS } from '../utils/theme';

const LOGO_SIZE = 140;

export default function BrandSplash({ exiting, onExitComplete }) {
  const fade = useRef(new Animated.Value(0)).current;
  const hasExited = useRef(false);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  useEffect(() => {
    if (!exiting || hasExited.current) return;
    hasExited.current = true;

    Animated.timing(fade, {
      toValue: 0,
      duration: 450,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onExitComplete?.();
    });
  }, [exiting, fade, onExitComplete]);

  return (
    <Animated.View style={[styles.root, { opacity: fade }]} pointerEvents={exiting ? 'none' : 'auto'}>
      <Image
        source={require('../../assets/splash.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Dealr"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: COLORS.splashBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
