import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import ScreenHeader from '../components/ScreenHeader';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminActivityLog from '../components/admin/AdminActivityLog';
import AdminAvatar from '../components/admin/AdminAvatar';
import AdminPager from '../components/admin/AdminPager';
import {
  AdminActionBtn, AdminCard, AdminEmpty, AdminPills, AdminSearch, AdminStatus,
} from '../components/admin/AdminUi';
import { useAuth } from '../context/AuthContext';
import {
  fetchAdminReports,
  fetchAdminUsers,
  fetchPendingReportCount,
  setUserActive,
  setUserAdmin,
  updateReportStatus,
} from '../utils/adminApi';
import { formatAdminDate } from '../utils/adminDisplay';
import {
  ADMIN_LIST_LIMIT,
  createRequestSeq,
  shouldStepBackEmptyPage,
} from '../utils/adminPaging';
import { COLORS } from '../utils/theme';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-grid' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'reports', label: 'Reports', icon: 'flag' },
  { id: 'activity', label: 'Activity', icon: 'list' },
];

function confirmAction(title, message, confirmLabel, destructive, onConfirm) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

export default function AdminScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, fetchAdminPendingCount } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [apiError, setApiError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState('pending');
  const [insightRefresh, setInsightRefresh] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userPaging, setUserPaging] = useState({
    page: 1, limit: ADMIN_LIST_LIMIT, total: 0, totalPages: 0, hasMore: false,
  });
  const [reportPage, setReportPage] = useState(1);
  const [reportPaging, setReportPaging] = useState({
    page: 1, limit: ADMIN_LIST_LIMIT, total: 0, totalPages: 0, hasMore: false,
  });
  const [pendingCount, setPendingCount] = useState(0);
  const usersReq = useRef(createRequestSeq());
  const reportsReq = useRef(createRequestSeq());

  const isAdmin = !!(user?.isAdmin);
  const currentUserId = String(user?._id || user?.id || '');

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Admin access required', 'This panel is only available to admins.');
      navigation.goBack();
    }
  }, [isAdmin, navigation]);

  const loadUsers = useCallback(async (pageNum = 1) => {
    const req = usersReq.current.begin();
    setLoading(true);
    setApiError('');
    try {
      const res = await fetchAdminUsers({ page: pageNum, limit: ADMIN_LIST_LIMIT });
      if (!usersReq.current.isCurrent(req)) return;
      if (shouldStepBackEmptyPage(res.users, pageNum)) {
        setUserPage(pageNum - 1);
        return;
      }
      setUsers(res.users);
      setUserPage(res.page);
      setUserPaging(res);
    } catch (err) {
      if (!usersReq.current.isCurrent(req)) return;
      setUsers([]);
      setUserPaging({
        page: pageNum, limit: ADMIN_LIST_LIMIT, total: 0, totalPages: 0, hasMore: false,
      });
      setApiError(err.message || 'Could not load users.');
    } finally {
      if (usersReq.current.isCurrent(req)) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const loadReports = useCallback(async (pageNum = 1, status = reportFilter) => {
    const req = reportsReq.current.begin();
    setLoading(true);
    setApiError('');
    try {
      const res = await fetchAdminReports({
        status,
        page: pageNum,
        limit: ADMIN_LIST_LIMIT,
      });
      if (!reportsReq.current.isCurrent(req)) return;
      if (shouldStepBackEmptyPage(res.reports, pageNum)) {
        setReportPage(pageNum - 1);
        return;
      }
      setReports(res.reports);
      setReportPage(res.page);
      setReportPaging(res);
      if (status === 'pending') setPendingCount(res.total);
    } catch (err) {
      if (!reportsReq.current.isCurrent(req)) return;
      setReports([]);
      setReportPaging({
        page: pageNum, limit: ADMIN_LIST_LIMIT, total: 0, totalPages: 0, hasMore: false,
      });
      setApiError(err.message || 'Could not load reports.');
    } finally {
      if (reportsReq.current.isCurrent(req)) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [reportFilter]);

  const refreshPendingBadge = useCallback(async () => {
    try {
      const count = await fetchPendingReportCount();
      setPendingCount(count);
      await fetchAdminPendingCount?.();
    } catch { /* ignore */ }
  }, [fetchAdminPendingCount]);

  const refresh = useCallback(() => {
    if (tab === 'users') loadUsers(userPage);
    else if (tab === 'reports') loadReports(reportPage);
    else {
      setApiError('');
      setRefreshing(false);
      setInsightRefresh(n => n + 1);
    }
  }, [tab, loadUsers, loadReports, userPage, reportPage]);

  useEffect(() => {
    if (!isAdmin || tab !== 'users') return;
    loadUsers(userPage);
  }, [isAdmin, tab, userPage, loadUsers]);

  useEffect(() => {
    if (!isAdmin || tab !== 'reports') return;
    loadReports(reportPage);
  }, [isAdmin, tab, reportPage, reportFilter, loadReports]);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab !== 'users' && tab !== 'reports') setLoading(false);
  }, [tab, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let cancelled = false;
    fetchAdminUsers({ page: 1, limit: ADMIN_LIST_LIMIT })
      .then((res) => {
        if (!cancelled) setUserPaging(prev => ({ ...prev, total: res.total }));
      })
      .catch(() => {});
    fetchPendingReportCount()
      .then((count) => { if (!cancelled) setPendingCount(count); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (userFilter === 'active') list = list.filter(u => u.isActive);
    if (userFilter === 'inactive') list = list.filter(u => !u.isActive);
    const q = userSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, userFilter, userSearch]);

  const handleToggleUser = (targetUser, activate) => {
    const label = activate ? 'activate' : 'deactivate';
    confirmAction(
      activate ? 'Activate user' : 'Deactivate user',
      `${activate ? 'Restore access for' : 'Suspend'} "${targetUser.name}" (${targetUser.email})?`,
      activate ? 'Activate' : 'Deactivate',
      !activate,
      async () => {
        setActionId(targetUser.id);
        try {
          await setUserActive(targetUser.id, activate);
          await loadUsers(userPage);
        } catch (err) {
          Alert.alert('Error', err.message || `Failed to ${label} user.`);
        } finally {
          setActionId(null);
        }
      }
    );
  };

  const handleSetAdmin = (targetUser, makeAdmin) => {
    if (!makeAdmin && String(targetUser.id) === currentUserId) {
      Alert.alert('Not allowed', 'You cannot remove your own admin access.');
      return;
    }
    confirmAction(
      makeAdmin ? 'Make admin' : 'Remove admin',
      makeAdmin
        ? `Grant admin access to "${targetUser.name}" (${targetUser.email})? They will be able to manage users, reports, and this panel.`
        : `Remove admin access from "${targetUser.name}" (${targetUser.email})?`,
      makeAdmin ? 'Make admin' : 'Remove',
      !makeAdmin,
      async () => {
        setActionId(targetUser.id);
        try {
          await setUserAdmin(targetUser.id, makeAdmin);
          await loadUsers(userPage);
        } catch (err) {
          Alert.alert('Error', err.message || (makeAdmin ? 'Failed to make user admin.' : 'Failed to remove admin access.'));
        } finally {
          setActionId(null);
        }
      }
    );
  };

  const handleReportAction = (report, status) => {
    const labels = {
      resolved: 'Mark as resolved',
      dismissed: 'Dismiss report',
    };
    confirmAction(
      labels[status] || 'Update report',
      `Apply "${status}" to this report about ${report.targetUserName}?`,
      status === 'dismissed' ? 'Dismiss' : 'Resolve',
      status === 'dismissed',
      async () => {
        setActionId(report.id);
        try {
          await updateReportStatus(report.id, status);
          await loadReports(reportPage);
          await refreshPendingBadge();
        } catch {
          Alert.alert('Error', 'Failed to update report.');
        } finally {
          setActionId(null);
        }
      }
    );
  };

  const handleDeactivateFromReport = (report) => {
    if (!report.targetUserId) {
      Alert.alert('Error', 'No linked user on this report.');
      return;
    }
    confirmAction(
      'Deactivate reported user',
      `Deactivate "${report.targetUserName}" based on this report?`,
      'Deactivate',
      true,
      async () => {
        setActionId(report.id);
        try {
          await setUserActive(report.targetUserId, false);
          await updateReportStatus(report.id, 'resolved', 'User deactivated by admin');
          if (tab === 'users') await loadUsers(userPage);
          await loadReports(reportPage);
          await refreshPendingBadge();
        } catch {
          Alert.alert('Error', 'Action failed.');
        } finally {
          setActionId(null);
        }
      }
    );
  };

  const changeTab = (next) => {
    setApiError('');
    setTab(next);
  };

  const onRefresh = () => {
    setRefreshing(true);
    refresh();
  };

  if (!user || !isAdmin) return null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Admin panel"
        subtitle="Dashboard, visitors, activity, users, and reports."
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            onPress={refresh}
            style={styles.refreshBtn}
            accessibilityLabel="Refresh"
          >
            <Icon name="refresh" size={18} color={COLORS.white} />
          </TouchableOpacity>
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => changeTab(item.id)}
              >
                <Icon name={item.icon} size={14} color={active ? COLORS.white : 'rgba(255,255,255,0.78)'} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
                {item.id === 'users' && userPaging.total > 0 && (
                  <View style={[styles.tabCount, active && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>{userPaging.total}</Text>
                  </View>
                )}
                {item.id === 'reports' && pendingCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 28 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {!!apiError && (
          <View style={styles.notice}>
            <Icon name="alert-circle" size={18} color="#92400e" />
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>Could not reach admin API</Text>
              <Text style={styles.noticeBody}>{apiError}</Text>
            </View>
          </View>
        )}

        {tab === 'dashboard' && (
          <AdminDashboard refreshKey={insightRefresh} onError={setApiError} />
        )}

        {tab === 'activity' && (
          <AdminActivityLog refreshKey={insightRefresh} onError={setApiError} />
        )}

        {tab === 'users' && (
          <AdminCard>
            <View style={styles.toolbar}>
              <AdminSearch
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Search by name or email…"
              />
              <AdminPills
                options={[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'inactive', label: 'Inactive' },
                ]}
                value={userFilter}
                onChange={setUserFilter}
              />
            </View>
            {loading && users.length === 0 ? (
              <AdminEmpty>Loading users…</AdminEmpty>
            ) : filteredUsers.length === 0 ? (
              <AdminEmpty>No users match your filters.</AdminEmpty>
            ) : (
              filteredUsers.map((u) => (
                <View key={u.id} style={styles.userRow}>
                  <View style={styles.userHead}>
                    <AdminAvatar user={u} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.userName} numberOfLines={1}>{u.name}</Text>
                        {u.isAdmin && <Text style={styles.adminTag}>Admin</Text>}
                      </View>
                      <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>
                      <View style={styles.userMetaRow}>
                        <AdminStatus status={u.isActive ? 'active' : 'inactive'} />
                        <Text style={styles.userMeta}>{formatAdminDate(u.createdAt)}</Text>
                        <Text style={styles.userMeta}>
                          {u.reportCounter > 0 ? `${u.reportCounter} reports` : 'No reports'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.rowActions}>
                    {u.isAdmin ? (
                      String(u.id) !== currentUserId && (
                        <AdminActionBtn
                          label="Remove admin"
                          tone="ghost"
                          disabled={actionId === u.id}
                          onPress={() => handleSetAdmin(u, false)}
                        />
                      )
                    ) : (
                      <AdminActionBtn
                        label="Make admin"
                        tone="admin"
                        disabled={actionId === u.id}
                        onPress={() => handleSetAdmin(u, true)}
                      />
                    )}
                    {u.isActive ? (
                      <AdminActionBtn
                        label="Deactivate"
                        tone="danger"
                        disabled={actionId === u.id || u.isAdmin}
                        onPress={() => handleToggleUser(u, false)}
                      />
                    ) : (
                      <AdminActionBtn
                        label="Activate"
                        tone="success"
                        disabled={actionId === u.id}
                        onPress={() => handleToggleUser(u, true)}
                      />
                    )}
                  </View>
                </View>
              ))
            )}
            <AdminPager
              page={userPaging.page}
              limit={userPaging.limit}
              total={userPaging.total}
              totalPages={userPaging.totalPages}
              hasMore={userPaging.hasMore}
              disabled={loading}
              onPageChange={setUserPage}
            />
          </AdminCard>
        )}

        {tab === 'reports' && (
          <AdminCard>
            <View style={styles.toolbar}>
              <AdminPills
                options={[
                  { id: 'pending', label: 'Pending' },
                  { id: 'all', label: 'All' },
                ]}
                value={reportFilter}
                onChange={(id) => {
                  setReportFilter(id);
                  setReportPage(1);
                }}
              />
            </View>
            {loading && reports.length === 0 ? (
              <AdminEmpty>Loading reports…</AdminEmpty>
            ) : reports.length === 0 ? (
              <AdminEmpty>No reports to show.</AdminEmpty>
            ) : (
              reports.map((report) => (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHead}>
                    <AdminStatus status={report.status} />
                    <Text style={styles.userMeta}>{formatAdminDate(report.createdAt)}</Text>
                  </View>
                  <Text style={styles.reportReason}>{report.reason}</Text>
                  {!!report.description && (
                    <Text style={styles.reportDesc}>{report.description}</Text>
                  )}
                  <View style={styles.reportMeta}>
                    <Text style={styles.metaLabel}>Reporter</Text>
                    <Text style={styles.metaValue}>
                      {report.reporterName}{report.reporterEmail ? ` · ${report.reporterEmail}` : ''}
                    </Text>
                    <Text style={styles.metaLabel}>Reported user</Text>
                    <Text style={styles.metaValue}>{report.targetUserName}</Text>
                    {!!report.adTitle && (
                      <>
                        <Text style={styles.metaLabel}>Listing</Text>
                        <Text style={styles.metaValue}>{report.adTitle}</Text>
                      </>
                    )}
                  </View>
                  {report.status === 'pending' && (
                    <View style={styles.rowActions}>
                      <AdminActionBtn
                        label="Dismiss"
                        tone="ghost"
                        disabled={actionId === report.id}
                        onPress={() => handleReportAction(report, 'dismissed')}
                      />
                      <AdminActionBtn
                        label="Resolve"
                        tone="success"
                        disabled={actionId === report.id}
                        onPress={() => handleReportAction(report, 'resolved')}
                      />
                      {!!report.targetUserId && (
                        <AdminActionBtn
                          label="Deactivate user"
                          tone="danger"
                          disabled={actionId === report.id}
                          onPress={() => handleDeactivateFromReport(report)}
                        />
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
            <AdminPager
              page={reportPaging.page}
              limit={reportPaging.limit}
              total={reportPaging.total}
              totalPages={reportPaging.totalPages}
              hasMore={reportPaging.hasMore}
              disabled={loading}
              onPageChange={setReportPage}
            />
          </AdminCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tabs: { flexDirection: 'row', gap: 8, paddingTop: 14 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  tabText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.78)' },
  tabTextActive: { color: COLORS.white },
  tabCount: {
    minWidth: 18,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  tabCountText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  tabCountTextActive: { color: COLORS.white },
  tabBadge: {
    minWidth: 18,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: COLORS.error,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.white, textAlign: 'center' },
  scroll: { padding: 16 },
  notice: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 14,
  },
  noticeTitle: { fontSize: 14, fontWeight: '800', color: '#92400e', marginBottom: 4 },
  noticeBody: { fontSize: 13, color: '#92400e', lineHeight: 18 },
  toolbar: { padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  userRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  userHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 15, fontWeight: '800', color: COLORS.text, flexShrink: 1 },
  userEmail: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  adminTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  userMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  userMeta: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reportCard: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 8 },
  reportHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportReason: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  reportDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  reportMeta: { gap: 2 },
  metaLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', marginTop: 6 },
  metaValue: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
});
