// src/components/Icon.js
// Zero native dependencies — uses Unicode symbols
// Drop-in replacement for react-native-vector-icons/Feather

import React from 'react';
import { Text } from 'react-native';

const ICONS = {
  'home':          '⌂',
  'search':        '⌕',
  'heart':         '♡',
  'heart-filled':  '♥',
  'message-circle':'💬',
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
  'image':         '🖼',
  'AI':            '˙✦',
};

export default function Icon({ name, size = 16, color = '#000', style }) {
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
