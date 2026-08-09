import React, { Component } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/theme';

/**
 * LinearGradient that degrades to a solid View if the native module throws.
 * Prevents release hard-crashes when Expo module versions drift.
 */
export default class SafeLinearGradient extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn('LinearGradient failed; using solid fallback', error);
  }

  render() {
    const { colors, start, end, style, children, ...rest } = this.props;
    if (this.state.failed) {
      const fallback = Array.isArray(colors) && colors.length ? colors[colors.length - 1] : COLORS.primary;
      return (
        <View {...rest} style={[style, { backgroundColor: fallback }]}>
          {children}
        </View>
      );
    }

    return (
      <LinearGradient colors={colors} start={start} end={end} style={style} {...rest}>
        {children}
      </LinearGradient>
    );
  }
}
