// src/components/Icon.js
// Zero native dependencies — uses Unicode symbols
// Drop-in replacement for react-native-vector-icons/Feather

import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const ICONS = {
  'home':          '⌂',
  'search':        '⌕',
  'heart':         '♡',
  'heart-filled':  '♥',
  'plus-circle':   '✚',
  'plus':          '✚',
  'speaker':       '📃',
  'user':          '👤',
  'map-pin':       '📍',
  'eye':           '👁',
  'clock':         '🕐',
  'tag':           '🏷',
  'arrow-left':    '←',
  'chevron-right': '›',
  'send':          '➤',
  'camera':        '📷',
  'trash-2':       '🗑',
  'x':             '✕',
  'inbox':         '📭',
  'log-out':       '⎋',
  'check-circle':  '✓',
  'alert-circle':  '⚠',
  'menu':          '☰',
  'filter':        '⚙',
  'star':          '★',
  'share':         '↗',
  'edit':          '✎',
  'refresh':       '↻',
  'image':         '🖼',
  'AI':            '˙✦',
  'trending-up':   '📈',
  'award':         '🏆',
};

const ChatSvg = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HomeSvg = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 10.1433L10.3204 5.30251C11.313 4.54288 12.687 4.54288 13.6796 5.30251L20 10.1433V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V10.1433Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 21V15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AdsSvg = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 5L6 9H2V15H6L11 19V5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.54 8.46C16.4774 9.39763 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      opacity="0.5"
      d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UserSvg = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21C20 19.6739 19.4732 18.4021 18.5355 17.4645C17.5979 16.5268 16.3261 16 15 16H9C7.67392 16 6.40215 16.5268 5.46447 17.4645C4.52678 18.4021 4 19.6739 4 21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SimplePlusSvg = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V19M5 12H19"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusSvg = ({ size, color }) => (
  <View style={{ width: size * 1.4, height: size * 1.4, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size * 1.2} height={size * 1.2} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

const ArrowLeftSvg = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 19L5 12L12 5"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LockSvg = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11M5 11H19C20.1046 11 21 11.8954 21 13V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V13C3 11.8954 3.89543 11 5 11Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function Icon({ name, size = 16, color = '#000', style }) {
  if (name === 'message-circle') {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <ChatSvg size={size} color={color} />
      </View>
    );
  }
  if (name === 'home') {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <HomeSvg size={size} color={color} />
      </View>
    );
  }
  if (name === 'speaker') {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <AdsSvg size={size} color={color} />
      </View>
    );
  }
  if (name === 'user') {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <UserSvg size={size} color={color} />
      </View>
    );
  }
  if (name === 'plus') {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <SimplePlusSvg size={size} color={color} />
      </View>
    );
  }
  if (name === 'plus-circle') {
    return <PlusSvg size={size} color={color} />;
  }
  if (name === 'arrow-left') {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <ArrowLeftSvg size={size} color={color} />
      </View>
    );
  }
  if (name === 'lock') {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <LockSvg size={size} color={color} />
      </View>
    );
  }

  const symbol = ICONS[name] || '•';
  return (
    <Text
      style={[
        {
          fontSize: size,
          color,
          lineHeight: size * 1.3,
          textAlign: 'center',
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {symbol}
    </Text>
  );
}
