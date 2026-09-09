import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '../Icon';
import { fetchAdminActivityLog } from '../../utils/adminApi';
import {
  activityIconName,
  activityMessage,
  actorDisplayName,
  formatRelativeTime,
  pageLabel,
  shortVisitorId,
} from '../../utils/adminDisplay';
import {
  ADMIN_ACTIVITY_LIMIT,
  createRequestSeq,
  shouldStepBackEmptyPage,
} from '../../utils/adminPaging';
import AdminAvatar from './AdminAvatar';
import AdminPager from './AdminPager';
import { AdminCard, AdminEmpty, AdminPills, AdminSearch } from './AdminUi';
import { COLORS } from '../../utils/theme';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'visit', label: 'Visits' },
  { id: 'ad_view', label: 'Ad views' },
  { id: 'search', label: 'Searches' },
  { id: 'post_ad', label: 'Posts' },
  { id: 'chat', label: 'Chats' },
  { id: 'login', label: 'Sign-ins' },
];

export default function AdminActivityLog({ refreshKey, onError }) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [paging, setPaging] = useState({
    page: 1, limit: ADMIN_ACTIVITY_LIMIT, total: 0, totalPages: 0, hasMore: false,
  });
  const reqSeq = useRef(createRequestSeq());

  const load = useCallback(async (uiPage = 1, typeFilter = type) => {
    const req = reqSeq.current.begin();
    setLoading(true);
    try {
      const res = await fetchAdminActivityLog({
        page: uiPage,
        limit: ADMIN_ACTIVITY_LIMIT,
        type: typeFilter,
      });
      if (!reqSeq.current.isCurrent(req)) return;
      if (shouldStepBackEmptyPage(res.logs, uiPage)) {
        setPage(uiPage - 1);
        return;
      }
      setLogs((res.logs || []).slice(0, ADMIN_ACTIVITY_LIMIT));
      setPaging(res);
      onError('');
    } catch (err) {
      if (!reqSeq.current.isCurrent(req)) return;
      setLogs([]);
      setPaging({
        page: uiPage, limit: ADMIN_ACTIVITY_LIMIT, total: 0, totalPages: 0, hasMore: false,
      });
      onError(err.message || 'Could not load activity log.');
    } finally {
      if (reqSeq.current.isCurrent(req)) setLoading(false);
    }
  }, [type, onError]);

  useEffect(() => {
    load(page, type);
  }, [load, page, type, refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => {
      const hay = [
        actorDisplayName(log),
        log.email,
        log.adTitle,
        log.detail,
        log.type,
        activityMessage(log),
        pageLabel(log.page),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [logs, query]);

  return (
    <AdminCard>
      <View style={styles.toolbar}>
        <AdminSearch value={query} onChangeText={setQuery} placeholder="Search activity…" />
        <AdminPills
          options={FILTERS}
          value={type}
          onChange={(id) => {
            setType(id);
            setPage(1);
          }}
        />
      </View>

      {loading && logs.length === 0 ? (
        <AdminEmpty>Loading activity…</AdminEmpty>
      ) : (
        <>
          <AdminPager
            page={paging.page}
            limit={ADMIN_ACTIVITY_LIMIT}
            total={paging.total}
            totalPages={paging.totalPages}
            hasMore={paging.hasMore}
            disabled={loading}
            onPageChange={setPage}
          />
          {filtered.length === 0 ? (
            <AdminEmpty>No activity to show.</AdminEmpty>
          ) : (
            filtered.slice(0, ADMIN_ACTIVITY_LIMIT).map((log) => {
              const name = actorDisplayName(log);
              return (
                <View key={log.id} style={styles.row}>
                  <View style={styles.typeBadge}>
                    <Icon name={activityIconName(log.type)} size={14} color={COLORS.primary} />
                  </View>
                  <AdminAvatar user={{ ...log, name }} size={36} />
                  <View style={styles.copy}>
                    <Text style={styles.message}>{activityMessage(log)}</Text>
                    <Text style={styles.meta} numberOfLines={2}>
                      {name}
                      {log.isVisitor && shortVisitorId(log) ? ` · ID ${shortVisitorId(log)}` : ''}
                      {log.adTitle ? ` · ${log.adTitle}` : ''}
                      {log.page ? ` · ${pageLabel(log.page)}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.time}>{formatRelativeTime(log.createdAt)}</Text>
                </View>
              );
            })
          )}
          <AdminPager
            page={paging.page}
            limit={ADMIN_ACTIVITY_LIMIT}
            total={paging.total}
            totalPages={paging.totalPages}
            hasMore={paging.hasMore}
            disabled={loading}
            onPageChange={setPage}
          />
        </>
      )}
    </AdminCard>
  );
}

const styles = StyleSheet.create({
  toolbar: { padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  typeBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  copy: { flex: 1, minWidth: 0 },
  message: { fontSize: 14, fontWeight: '700', color: COLORS.text, lineHeight: 19 },
  meta: { fontSize: 12, color: COLORS.textMuted, marginTop: 3, lineHeight: 16 },
  time: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 4 },
});
