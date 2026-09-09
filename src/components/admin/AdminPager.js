import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { pageRangeLabel } from '../../utils/adminPaging';
import { COLORS, RADIUS } from '../../utils/theme';

export default function AdminPager({
  page = 1,
  limit = 10,
  total = 0,
  totalPages = 0,
  hasMore = false,
  onPageChange,
  disabled = false,
}) {
  const atStart = page <= 1;
  const atEnd = totalPages > 0 ? page >= totalPages : !hasMore;
  const empty = total === 0 && !hasMore && page <= 1;

  if (empty) {
    return (
      <View style={styles.pager}>
        <Text style={styles.label}>0 items</Text>
      </View>
    );
  }

  return (
    <View style={styles.pager}>
      <Text style={styles.label}>
        {total > 0 ? pageRangeLabel({ page, limit, total }) : `Page ${page}`}
      </Text>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, (disabled || atStart) && styles.btnDisabled]}
          disabled={disabled || atStart}
          onPress={() => onPageChange(page - 1)}
        >
          <Text style={styles.btnText}>Prev</Text>
        </TouchableOpacity>
        <Text style={styles.page}>
          {totalPages > 0 ? `${page} / ${totalPages}` : `Page ${page}`}
        </Text>
        <TouchableOpacity
          style={[styles.btn, (disabled || atEnd) && styles.btnDisabled]}
          disabled={disabled || atEnd}
          onPress={() => onPageChange(page + 1)}
        >
          <Text style={styles.btnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, flexShrink: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  page: { fontSize: 12, fontWeight: '700', color: COLORS.text, minWidth: 48, textAlign: 'center' },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
});
