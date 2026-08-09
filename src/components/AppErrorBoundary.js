import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';

/**
 * Catches JS render errors so a single bad screen doesn't hard-kill the process.
 * Native crashes still won't be caught — those need logcat.
 */
export default class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.root}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            Restart the app. If this keeps happening, send a screenshot of this screen.
          </Text>
          <Text style={styles.detail} numberOfLines={6}>
            {String(this.state.error?.message || this.state.error)}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background || '#eef2f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text || '#0f172a',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: COLORS.textMuted || '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  detail: {
    fontSize: 12,
    color: COLORS.error || '#ef4444',
    textAlign: 'center',
  },
});
