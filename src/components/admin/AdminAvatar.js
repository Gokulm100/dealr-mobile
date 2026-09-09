import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

export default function AdminAvatar({ user, size = 40 }) {
  const letter = user?.isVisitor ? 'V' : (user?.name?.charAt(0)?.toUpperCase() || '?');
  if (!user?.isVisitor && user?.profilePic) {
    return (
      <Image
        source={{ uri: user.profilePic }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: COLORS.primarySoft }}
      />
    );
  }
  return (
    <View
      style={[
        styles.fallback,
        user?.isVisitor && styles.visitor,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size < 36 ? 12 : 14 }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  visitor: {
    backgroundColor: '#e2e8f0',
  },
  letter: {
    fontWeight: '800',
    color: COLORS.primary,
  },
});
