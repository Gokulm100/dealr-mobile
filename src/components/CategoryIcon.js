import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { COLORS } from '../utils/theme';

const STROKE = 1.75;

const ICONS = {
  all: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="6.5" height="6.5" rx="1.5" stroke={color} strokeWidth={STROKE} />
      <Rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" stroke={color} strokeWidth={STROKE} />
      <Rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" stroke={color} strokeWidth={STROKE} />
      <Rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" stroke={color} strokeWidth={STROKE} />
    </Svg>
  ),
  electronics: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="7" y="2.5" width="10" height="19" rx="2.2" stroke={color} strokeWidth={STROKE} />
      <Path d="M10.5 19.5H13.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  ),
  furniture: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 11V8.5C5 7.12 6.12 6 7.5 6H16.5C17.88 6 19 7.12 19 8.5V11"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 11H20V14.5C20 15.33 19.33 16 18.5 16H5.5C4.67 16 4 15.33 4 14.5V11Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Path d="M7 16V19M17 16V19" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  ),
  vehicles: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 15.5L6.8 9.8C7.15 8.75 8.12 8 9.22 8H14.78C15.88 8 16.85 8.75 17.2 9.8L19 15.5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 15.5H20V17.5C20 18.33 19.33 19 18.5 19H5.5C4.67 19 4 18.33 4 17.5V15.5Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Circle cx="8" cy="17" r="1.2" fill={color} />
      <Circle cx="16" cy="17" r="1.2" fill={color} />
    </Svg>
  ),
  'real-estate': ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20V10.5L12 4.5L20 10.5V20"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 20V14.5H14.5V20"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  fashion: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.5 5.5L10.2 3.8C11 3 12.4 3 13.2 3.8L14.9 5.5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 7.5L4 20H20L18 7.5L12 10.5L6 7.5Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  ),
  books: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 5.5C6 4.67 6.67 4 7.5 4H18V20H7.5C6.67 20 6 19.33 6 18.5V5.5Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Path d="M6 8H18" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path
        d="M9 4V20"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  ),
  sports: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="7.5" stroke={color} strokeWidth={STROKE} />
      <Path d="M12 4.5V19.5M4.5 12H19.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path
        d="M6.2 6.2C8.4 8.4 15.6 15.6 17.8 17.8M17.8 6.2C15.6 8.4 8.4 15.6 6.2 17.8"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  ),
  services: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3L17.7 9.3C18.5 10.1 18.5 11.4 17.7 12.2L12.2 17.7C11.4 18.5 10.1 18.5 9.3 17.7L6.3 14.7"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 8L16 15"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <Path
        d="M7.5 4.5L4.5 7.5L7.5 10.5L10.5 7.5L7.5 4.5Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  ),
  other: ({ size, color }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.5 12.8L13.8 19.5C13.1 20.2 12 20.2 11.3 19.5L4.5 12.7C3.8 12 3.8 10.9 4.5 10.2L11.2 3.5C11.9 2.8 13 2.8 13.7 3.5L20.5 10.3C21.2 11 21.2 12.1 20.5 12.8Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="9" r="1" fill={color} />
    </Svg>
  ),
};

const NAME_TO_ICON = {
  All: 'all',
  Electronics: 'electronics',
  Furniture: 'furniture',
  Vehicles: 'vehicles',
  'Real Estate': 'real-estate',
  Fashion: 'fashion',
  Books: 'books',
  Sports: 'sports',
  Services: 'services',
};

const CATEGORY_THEMES = {
  all: { icon: '#378cf6', bg: '#eef5ff', badge: '#60a5fa' },
  electronics: { icon: '#4f46e5', bg: '#eef2ff', badge: '#818cf8' },
  furniture: { icon: '#d97706', bg: '#fff7ed', badge: '#fbbf24' },
  vehicles: { icon: '#0284c7', bg: '#e0f2fe', badge: '#38bdf8' },
  'real-estate': { icon: '#059669', bg: '#ecfdf5', badge: '#34d399' },
  fashion: { icon: '#db2777', bg: '#fdf2f8', badge: '#f472b6' },
  books: { icon: '#7c3aed', bg: '#f5f3ff', badge: '#a78bfa' },
  sports: { icon: '#16a34a', bg: '#f0fdf4', badge: '#4ade80' },
  services: { icon: '#475569', bg: '#f1f5f9', badge: '#94a3b8' },
  other: { icon: '#378cf6', bg: '#eef5ff', badge: '#60a5fa' },
};

function resolveIconKey(name) {
  if (NAME_TO_ICON[name]) return NAME_TO_ICON[name];
  const normalized = String(name || '').trim().toLowerCase();
  if (normalized.includes('electronic')) return 'electronics';
  if (normalized.includes('furniture')) return 'furniture';
  if (normalized.includes('vehicle') || normalized.includes('car')) return 'vehicles';
  if (normalized.includes('estate') || normalized.includes('property') || normalized.includes('home')) {
    return 'real-estate';
  }
  if (normalized.includes('fashion') || normalized.includes('cloth')) return 'fashion';
  if (normalized.includes('book')) return 'books';
  if (normalized.includes('sport')) return 'sports';
  if (normalized.includes('service')) return 'services';
  return 'other';
}

export function getCategoryTheme(name) {
  const key = resolveIconKey(name);
  return CATEGORY_THEMES[key] || CATEGORY_THEMES.other;
}

export default function CategoryIcon({
  name,
  size = 16,
  color,
  active = false,
  variant = 'inline',
  colored = false,
  style,
}) {
  const iconKey = resolveIconKey(name);
  const Icon = ICONS[iconKey] || ICONS.other;
  const isTile = variant === 'tile';
  const theme = getCategoryTheme(name);

  // Browse tiles: extruded 3D badge (depth slab + colored face + sheen)
  if (isTile) {
    const badgeColor = theme.badge || theme.icon;
    return (
      <View
        style={[
          {
            width: 50,
            height: 50,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            shadowColor: badgeColor,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.48,
            shadowRadius: 14,
            elevation: 9,
            zIndex: 2,
          },
          style,
        ]}
      >
        {/* Underside slab for physical thickness */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 2,
            right: 2,
            top: 6,
            bottom: -4,
            borderRadius: 15,
            backgroundColor: theme.icon,
            opacity: 0.55,
          }}
        />
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: badgeColor,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.55)',
            borderTopColor: 'rgba(255,255,255,0.7)',
            borderBottomColor: 'rgba(15,23,42,0.28)',
            borderRightColor: 'rgba(15,23,42,0.16)',
            overflow: 'hidden',
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 22,
              backgroundColor: 'rgba(255,255,255,0.34)',
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2.5,
              backgroundColor: 'rgba(255,255,255,0.55)',
            }}
          />
          <Icon size={size} color={COLORS.white} />
        </View>
      </View>
    );
  }

  const useColor = colored || color == null;
  const iconColor = useColor ? theme.icon : (color || '#64748b');
  const badgeBg = active ? COLORS.white : (useColor ? theme.bg : '#f4f7fb');

  return (
    <View
      style={[
        {
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: badgeBg,
        },
        style,
      ]}
    >
      <Icon size={size} color={iconColor} />
    </View>
  );
}
