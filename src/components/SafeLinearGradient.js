import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { COLORS } from '../utils/theme';

let gradientSeq = 0;

/**
 * JS/SVG gradient — avoids expo-linear-gradient native module crashes on release.
 * Falls back to a solid fill if layout or SVG rendering fails.
 */
export default function SafeLinearGradient({
  colors = [COLORS.primary, COLORS.primaryDeep],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  children,
  ...rest
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const gradientId = useMemo(() => `sg-${++gradientSeq}`, []);
  const stops = Array.isArray(colors) && colors.length ? colors : [COLORS.primary, COLORS.primaryDeep];
  const fallback = stops[stops.length - 1] || COLORS.primary;

  const onLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  };

  return (
    <View {...rest} style={[style, { backgroundColor: fallback, overflow: 'hidden' }]} onLayout={onLayout}>
      {size.width > 0 && size.height > 0 ? (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <SvgLinearGradient
              id={gradientId}
              x1={`${(start?.x ?? 0) * 100}%`}
              y1={`${(start?.y ?? 0) * 100}%`}
              x2={`${(end?.x ?? 1) * 100}%`}
              y2={`${(end?.y ?? 1) * 100}%`}
            >
              {stops.map((color, index) => (
                <Stop
                  key={`${gradientId}-${index}`}
                  offset={`${stops.length === 1 ? 0 : (index / (stops.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.width} height={size.height} fill={`url(#${gradientId})`} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}
