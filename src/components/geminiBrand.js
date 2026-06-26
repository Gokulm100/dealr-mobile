import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Text as SvgText, Rect } from 'react-native-svg';
import { RADIUS } from '../utils/theme';

export const GEMINI = {
  blue: '#4285f4',
  purple: '#9b72cb',
  rose: '#d96570',
  border: 'rgba(155, 114, 203, 0.18)',
  rowBorder: 'rgba(155, 114, 203, 0.1)',
};

let gradientSeq = 0;

export function useGradientId(prefix) {
  const idRef = useRef(`${prefix}-${gradientSeq += 1}`);
  return idRef.current;
}

export function SparklesIcon({ size = 18, gradientId }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={GEMINI.blue} />
          <Stop offset="45%" stopColor={GEMINI.purple} />
          <Stop offset="100%" stopColor={GEMINI.rose} />
        </LinearGradient>
      </Defs>
      <Path
        d="M9.937 15.5A2 2 0 0 0 8.5 14.062l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M20 3v4M22 5h-4M4 17v2M5 18H3" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function GradientText({
  text,
  fontSize,
  fontWeight = '700',
  width,
  height,
  gradientId,
  align = 'left',
  style,
}) {
  const textAnchor = align === 'center' ? 'middle' : 'start';
  const x = align === 'center' ? width / 2 : 0;
  const boxHeight = height || fontSize + 6;
  const y = fontSize + 1;

  return (
    <View style={[{ width, height: boxHeight }, style]}>
      <Svg width={width} height={boxHeight}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={GEMINI.blue} />
            <Stop offset="48%" stopColor={GEMINI.purple} />
            <Stop offset="100%" stopColor={GEMINI.rose} />
          </LinearGradient>
        </Defs>
        <SvgText
          fill={`url(#${gradientId})`}
          fontSize={fontSize}
          fontWeight={fontWeight}
          x={x}
          y={y}
          textAnchor={textAnchor}
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
}

export function GeminiCardBackground({ width, height }) {
  if (width <= 0 || height <= 0) return null;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="gemini-card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={GEMINI.blue} stopOpacity="0.05" />
          <Stop offset="52%" stopColor={GEMINI.purple} stopOpacity="0.07" />
          <Stop offset="100%" stopColor={GEMINI.rose} stopOpacity="0.05" />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} rx={RADIUS.lg} fill="url(#gemini-card-bg)" />
    </Svg>
  );
}

const WAVE_TILE = 96;

function buildWavePath(period, midY, amplitude, periods) {
  let d = `M 0 ${midY}`;
  for (let i = 0; i < periods; i += 1) {
    const x0 = i * period;
    d += ` C ${x0 + period * 0.25} ${midY - amplitude}, ${x0 + period * 0.75} ${midY + amplitude}, ${x0 + period} ${midY}`;
  }
  return d;
}

function WaveLayer({ gradientId, midY, amplitude, opacity, strokeWidth, duration, delay = 0 }) {
  const flow = useRef(new Animated.Value(0)).current;
  const periods = 3;
  const svgWidth = WAVE_TILE * periods;
  const path = buildWavePath(WAVE_TILE, midY, amplitude, periods);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(flow, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [delay, duration, flow]);

  const translateX = flow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -WAVE_TILE],
  });

  return (
    <Animated.View style={[waveStyles.layer, { opacity, transform: [{ translateX }] }]}>
      <Svg width={svgWidth} height={40} viewBox={`0 0 ${svgWidth} 40`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={GEMINI.blue} stopOpacity="0.35" />
            <Stop offset="50%" stopColor={GEMINI.purple} stopOpacity="1" />
            <Stop offset="100%" stopColor={GEMINI.rose} stopOpacity="0.45" />
          </LinearGradient>
        </Defs>
        <Path
          d={path}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

/** Flowing Gemini gradient waves — seamless horizontal loop */
export function GeminiWaveAnimation({ width = 200, height = 40, style }) {
  const grad1 = useGradientId('gem-wave-1');
  const grad2 = useGradientId('gem-wave-2');
  const grad3 = useGradientId('gem-wave-3');

  return (
    <View style={[waveStyles.wrap, { width, height }, style]}>
      <WaveLayer gradientId={grad1} midY={22} amplitude={7} opacity={0.55} strokeWidth={2.2} duration={2800} />
      <WaveLayer gradientId={grad2} midY={18} amplitude={5} opacity={0.38} strokeWidth={1.8} duration={3600} delay={180} />
      <WaveLayer gradientId={grad3} midY={26} amplitude={4} opacity={0.24} strokeWidth={1.4} duration={4400} delay={320} />
    </View>
  );
}

const waveStyles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignSelf: 'center',
  },
  layer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

/** Rounded aurora wash + twinkling stars — no rings or circular frames */
export function GeminiAnalyzingVisual({ style }) {
  const shift = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const iconGradId = useGradientId('gem-analyze-icon');

  useEffect(() => {
    const shiftLoop = Animated.loop(
      Animated.timing(shift, {
        toValue: 1,
        duration: 3800,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    shiftLoop.start();
    breatheLoop.start();

    return () => {
      shiftLoop.stop();
      breatheLoop.stop();
    };
  }, [breathe, shift]);

  const blueOpacity = shift.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.22, 0.07, 0.05, 0.22],
  });
  const purpleOpacity = shift.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.06, 0.26, 0.08, 0.06],
  });
  const roseOpacity = shift.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.05, 0.08, 0.24, 0.05],
  });
  const iconScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const washScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  const stars = [
    { top: 4, left: 8, color: GEMINI.blue, delay: 0 },
    { top: 10, right: 6, color: GEMINI.purple, delay: 400 },
    { bottom: 8, left: 6, color: GEMINI.rose, delay: 800 },
    { bottom: 4, right: 12, color: GEMINI.blue, delay: 1200 },
  ];

  return (
    <View style={[analyzeStyles.wrap, style]}>
      <Animated.View style={[analyzeStyles.wash, { transform: [{ scale: washScale }] }]}>
        <Animated.View style={[analyzeStyles.washLayer, { backgroundColor: GEMINI.blue, opacity: blueOpacity }]} />
        <Animated.View style={[analyzeStyles.washLayer, { backgroundColor: GEMINI.purple, opacity: purpleOpacity }]} />
        <Animated.View style={[analyzeStyles.washLayer, { backgroundColor: GEMINI.rose, opacity: roseOpacity }]} />
      </Animated.View>

      {stars.map((star, index) => (
        <TwinkleStar key={index} {...star} />
      ))}

      <Animated.View style={[analyzeStyles.iconWrap, { transform: [{ scale: iconScale }] }]}>
        <SparklesIcon size={26} gradientId={iconGradId} />
      </Animated.View>
    </View>
  );
}

function TwinkleStar({ top, left, right, bottom, color, delay }) {
  const twinkle = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const twinkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {
          toValue: 1,
          duration: 1100,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(twinkle, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 2200,
          delay: delay / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    twinkleLoop.start();
    driftLoop.start();

    return () => {
      twinkleLoop.stop();
      driftLoop.stop();
    };
  }, [delay, drift, twinkle]);

  const opacity = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const scale = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] });
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });

  const position = { position: 'absolute' };
  if (top != null) position.top = top;
  if (left != null) position.left = left;
  if (right != null) position.right = right;
  if (bottom != null) position.bottom = bottom;

  return (
    <Animated.View style={[position, { opacity, transform: [{ translateY }, { scale }] }]}>
      <Svg width={10} height={10} viewBox="0 0 10 10">
        <Path
          d="M5 0.5 L5.8 3.6 L9 4.2 L5.8 4.8 L5 7.9 L4.2 4.8 L1 4.2 L4.2 3.6 Z"
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
}

const analyzeStyles = StyleSheet.create({
  wrap: {
    width: 88,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    top: 6,
    bottom: 6,
    left: 4,
    right: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  washLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
