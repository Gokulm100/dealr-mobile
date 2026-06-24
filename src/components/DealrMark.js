import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';

export default function DealrMark({ size = 36 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id="dealrMarkGrad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#1d4ed8" />
          <Stop offset="0.55" stopColor="#378cf6" />
          <Stop offset="1" stopColor="#60a5fa" />
        </LinearGradient>
      </Defs>
      <Rect width="48" height="48" rx="14" fill="url(#dealrMarkGrad)" />
      <Path
        fill="#fff"
        d="M33.2 12.8c.9-.9 2.4-.9 3.3 0l1.2 1.2c.9.9.9 2.4 0 3.3l-2.1 2.1c-.7.7-1.8.9-2.7.5l-3.8-1.6-.9 3.4 2.9 1.1c1.3.5 2.2 1.7 2.2 3.1v2.6c0 1.3-1 2.4-2.3 2.4h-2.1c-1.1 0-2-.7-2.4-1.7l-1.8-4.5-1.8 4.5c-.4 1-1.3 1.7-2.4 1.7H23c-1.3 0-2.3-1.1-2.3-2.4v-2.6c0-1.4.9-2.6 2.2-3.1l2.9-1.1-.9-3.4-3.8 1.6c-.9.4-2 .2-2.7-.5L15.5 17c-.9-.9-.9-2.4 0-3.3l1.2-1.2c.9-.9 2.4-.9 3.3 0l4.5 3.2 5.8-2.9 3.4-2.3z"
      />
    </Svg>
  );
}
