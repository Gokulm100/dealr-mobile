import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import SafeLinearGradient from './SafeLinearGradient';
import { COLORS, FONTS, SHADOW, SURFACE } from '../utils/theme';
import { useFontReady, fontFamily } from '../context/FontReadyContext';

/**
 * Premium chrome header matching the web topbar gradient.
 */
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  children,
  compact = false,
  style,
  contentStyle,
}) {
  const insets = useSafeAreaInsets();
  const fontsReady = useFontReady();

  return (
    <>
      <StatusBar backgroundColor={COLORS.primaryDeep} barStyle="light-content" />
      <SafeLinearGradient
        colors={SURFACE.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12) + (compact ? 4 : 8),
            paddingBottom: children ? 18 : compact ? 14 : 16,
          },
          style,
        ]}
      >
        {(title || onBack || right) && (
          <View style={[styles.row, contentStyle]}>
            {onBack ? (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Icon name="arrow-left" size={22} color={COLORS.white} />
              </TouchableOpacity>
            ) : (
              <View style={styles.sideSlot} />
            )}

            <View style={styles.titleBlock}>
              {!!title && (
                <Text style={[styles.title, fontFamily(fontsReady, FONTS.displayBlack)]} numberOfLines={1}>
                  {title}
                </Text>
              )}
              {!!subtitle && (
                <Text style={[styles.subtitle, fontFamily(fontsReady, FONTS.medium)]} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>

            <View style={styles.rightSlot}>
              {right || <View style={styles.sideSlot} />}
            </View>
          </View>
        )}
        {children}
      </SafeLinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    ...SHADOW.header,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginRight: 10,
  },
  sideSlot: { width: 36, height: 36 },
  titleBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 22,
    // fontWeight omitted — displayBlack already encodes weight; pairing crashes Android.
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  rightSlot: {
    marginLeft: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
