import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from '../Icon';
import { fetchAdminAdViewers, fetchAdminVisitors } from '../../utils/adminApi';
import { actorDisplayName, formatRelativeTime, shortVisitorId } from '../../utils/adminDisplay';
import {
  ADMIN_LIST_LIMIT,
  EMPTY_ADMIN_PAGE,
  createRequestSeq,
  shouldStepBackEmptyPage,
} from '../../utils/adminPaging';
import AdminAvatar from './AdminAvatar';
import AdminPager from './AdminPager';
import { AdminCard, AdminEmpty, AdminPills, AdminSearch } from './AdminUi';
import { COLORS, RADIUS } from '../../utils/theme';

function StatCard({ label, value, icon }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Icon name={icon} size={16} color={COLORS.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ViewerRow({ viewer }) {
  const name = actorDisplayName(viewer);
  return (
    <View style={styles.viewerRow}>
      <AdminAvatar user={{ ...viewer, name }} size={32} />
      <View style={styles.viewerCopy}>
        <View style={styles.nameRow}>
          <Text style={styles.userName} numberOfLines={1}>{name}</Text>
          {viewer.isVisitor && <Text style={styles.visitorTag}>Visitor</Text>}
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>
          {viewer.isVisitor
            ? (shortVisitorId(viewer) ? `ID ${shortVisitorId(viewer)}` : 'Not signed in')
            : (viewer.email || 'Signed-in user')}
        </Text>
      </View>
      <View style={styles.viewerMeta}>
        <Text style={styles.metaText}>{viewer.viewCount} {viewer.viewCount === 1 ? 'view' : 'views'}</Text>
        <Text style={styles.metaText}>{formatRelativeTime(viewer.lastViewedAt)}</Text>
      </View>
    </View>
  );
}

export default function AdminDashboard({ refreshKey, onError }) {
  const [ads, setAds] = useState([]);
  const [adStats, setAdStats] = useState({ totalViews: 0, uniqueViewers: 0, adsViewed: 0 });
  const [adPage, setAdPage] = useState(1);
  const [adPaging, setAdPaging] = useState(EMPTY_ADMIN_PAGE);
  const [adsLoading, setAdsLoading] = useState(true);

  const [visitors, setVisitors] = useState([]);
  const [visitorStats, setVisitorStats] = useState({ total: 0, signedIn: 0, anonymous: 0 });
  const [visitorPage, setVisitorPage] = useState(1);
  const [visitorPaging, setVisitorPaging] = useState(EMPTY_ADMIN_PAGE);
  const [visitorsLoading, setVisitorsLoading] = useState(true);

  const [adQuery, setAdQuery] = useState('');
  const [visitorFilter, setVisitorFilter] = useState('all');
  const [openAdId, setOpenAdId] = useState(null);
  const adsReq = useRef(createRequestSeq());
  const visitorsReq = useRef(createRequestSeq());

  const loadAds = useCallback(async (pageNum = 1) => {
    const req = adsReq.current.begin();
    setAdsLoading(true);
    try {
      const res = await fetchAdminAdViewers({ page: pageNum, limit: ADMIN_LIST_LIMIT });
      if (!adsReq.current.isCurrent(req)) return;
      if (shouldStepBackEmptyPage(res.ads, pageNum)) {
        setAdPage(pageNum - 1);
        return;
      }
      setAds(res.ads);
      setAdPage(res.page);
      setAdPaging(res);
      setAdStats(res.stats);
      onError('');
    } catch (err) {
      if (!adsReq.current.isCurrent(req)) return;
      setAds([]);
      setAdPaging({ ...EMPTY_ADMIN_PAGE, page: pageNum });
      onError(err.message || 'Could not load ad viewers.');
    } finally {
      if (adsReq.current.isCurrent(req)) setAdsLoading(false);
    }
  }, [onError]);

  const loadVisitors = useCallback(async (pageNum = 1) => {
    const req = visitorsReq.current.begin();
    setVisitorsLoading(true);
    try {
      const res = await fetchAdminVisitors({ page: pageNum, limit: ADMIN_LIST_LIMIT });
      if (!visitorsReq.current.isCurrent(req)) return;
      if (shouldStepBackEmptyPage(res.visitors, pageNum)) {
        setVisitorPage(pageNum - 1);
        return;
      }
      setVisitors(res.visitors);
      setVisitorPage(res.page);
      setVisitorPaging(res);
      setVisitorStats(res.stats);
      onError('');
    } catch (err) {
      if (!visitorsReq.current.isCurrent(req)) return;
      setVisitors([]);
      setVisitorPaging({ ...EMPTY_ADMIN_PAGE, page: pageNum });
      onError(err.message || 'Could not load visitors.');
    } finally {
      if (visitorsReq.current.isCurrent(req)) setVisitorsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadAds(adPage);
  }, [loadAds, adPage, refreshKey]);

  useEffect(() => {
    loadVisitors(visitorPage);
  }, [loadVisitors, visitorPage, refreshKey]);

  const filteredAds = useMemo(() => {
    const q = adQuery.trim().toLowerCase();
    const list = q ? ads.filter(ad => ad.title.toLowerCase().includes(q)) : ads;
    return [...list].sort((a, b) => (b.views - a.views) || (new Date(b.lastViewedAt || 0) - new Date(a.lastViewedAt || 0)));
  }, [ads, adQuery]);

  const filteredVisitors = useMemo(() => {
    let list = visitors;
    if (visitorFilter === 'signed-in') list = list.filter(v => !v.isVisitor);
    if (visitorFilter === 'visitors') list = list.filter(v => v.isVisitor);
    return [...list].sort((a, b) => new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0));
  }, [visitors, visitorFilter]);

  return (
    <View>
      <View style={styles.statsRow}>
        <StatCard label="Ad views" value={adStats.totalViews} icon="eye" />
        <StatCard label="Listings viewed" value={adStats.adsViewed} icon="eye" />
        <StatCard label="Site visitors" value={visitorStats.total} icon="globe" />
        <StatCard label="Anonymous" value={visitorStats.anonymous} icon="users" />
      </View>

      <AdminCard>
        <View style={styles.widgetHead}>
          <Text style={styles.widgetTitle}>Who viewed each ad</Text>
          <Text style={styles.widgetSub}>Signed-in users by name. Everyone else is listed as Visitor.</Text>
          <AdminSearch value={adQuery} onChangeText={setAdQuery} placeholder="Search listings…" />
        </View>
        {adsLoading && ads.length === 0 ? (
          <AdminEmpty>Loading ad views…</AdminEmpty>
        ) : filteredAds.length === 0 ? (
          <AdminEmpty>No ad views recorded yet.</AdminEmpty>
        ) : (
          filteredAds.map((ad) => {
            const open = openAdId === ad.id;
            return (
              <View key={ad.id} style={styles.adItem}>
                <TouchableOpacity style={styles.adToggle} onPress={() => setOpenAdId(open ? null : ad.id)}>
                  {ad.image ? (
                    <Image source={{ uri: ad.image }} style={styles.adThumb} />
                  ) : (
                    <View style={[styles.adThumb, styles.adThumbFallback]}>
                      <Text style={styles.adThumbText}>Ad</Text>
                    </View>
                  )}
                  <View style={styles.adCopy}>
                    <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text>
                    <Text style={styles.muted}>
                      {ad.views} {ad.views === 1 ? 'view' : 'views'} · {ad.uniqueViewers} {ad.uniqueViewers === 1 ? 'person' : 'people'}
                      {ad.lastViewedAt ? ` · ${formatRelativeTime(ad.lastViewedAt)}` : ''}
                    </Text>
                  </View>
                  <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
                {open && (
                  ad.viewers.length === 0
                    ? <AdminEmpty>No viewer details for this listing.</AdminEmpty>
                    : ad.viewers.map((viewer) => <ViewerRow key={viewer.id} viewer={viewer} />)
                )}
              </View>
            );
          })
        )}
        <AdminPager
          page={adPaging.page}
          limit={adPaging.limit}
          total={adPaging.total}
          totalPages={adPaging.totalPages}
          hasMore={adPaging.hasMore}
          disabled={adsLoading}
          onPageChange={setAdPage}
        />
      </AdminCard>

      <AdminCard>
        <View style={styles.widgetHead}>
          <Text style={styles.widgetTitle}>Site visitors</Text>
          <Text style={styles.widgetSub}>People who opened the app, including guests.</Text>
          <AdminPills
            options={[
              { id: 'all', label: 'All' },
              { id: 'signed-in', label: 'Signed in' },
              { id: 'visitors', label: 'Visitors' },
            ]}
            value={visitorFilter}
            onChange={setVisitorFilter}
          />
        </View>
        {visitorsLoading && visitors.length === 0 ? (
          <AdminEmpty>Loading visitors…</AdminEmpty>
        ) : filteredVisitors.length === 0 ? (
          <AdminEmpty>No visitors recorded yet.</AdminEmpty>
        ) : (
          filteredVisitors.map((visitor) => {
            const name = actorDisplayName(visitor);
            return (
              <View key={visitor.id} style={styles.visitorRow}>
                <AdminAvatar user={{ ...visitor, name }} />
                <View style={styles.viewerCopy}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName} numberOfLines={1}>{name}</Text>
                    {visitor.isVisitor && <Text style={styles.visitorTag}>Visitor</Text>}
                  </View>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {visitor.isVisitor
                      ? (shortVisitorId(visitor) ? `ID ${shortVisitorId(visitor)}` : 'Not signed in')
                      : visitor.email}
                  </Text>
                </View>
                <View style={styles.viewerMeta}>
                  <Text style={styles.metaText}>
                    {visitor.pageViews ? `${visitor.pageViews} pages` : 'Active'}
                    {visitor.adViews ? ` · ${visitor.adViews} ads` : ''}
                  </Text>
                  <Text style={styles.metaText}>{formatRelativeTime(visitor.lastSeenAt)}</Text>
                </View>
              </View>
            );
          })
        )}
        <AdminPager
          page={visitorPaging.page}
          limit={visitorPaging.limit}
          total={visitorPaging.total}
          totalPages={visitorPaging.totalPages}
          hasMore={visitorPaging.hasMore}
          disabled={visitorsLoading}
          onPageChange={setVisitorPage}
        />
      </AdminCard>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  stat: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.95)',
    padding: 14,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  widgetHead: { padding: 14, gap: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  widgetTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  widgetSub: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  adItem: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  adToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  adThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#e2e8f0' },
  adThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  adThumbText: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  adCopy: { flex: 1, minWidth: 0 },
  adTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  muted: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingLeft: 20,
    backgroundColor: '#f8fafc',
  },
  visitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  viewerCopy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 14, fontWeight: '700', color: COLORS.text, flexShrink: 1 },
  userEmail: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  visitorTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  viewerMeta: { alignItems: 'flex-end', maxWidth: 92 },
  metaText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
});
