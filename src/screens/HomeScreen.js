// src/screens/HomeScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, RefreshControl,
  StatusBar, Image, Animated,
} from 'react-native';
import Icon from '../components/Icon';
import AdCard from '../components/AdCard';
import { apiFetch, mapListing, API_BASE_URL } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

const LIMIT = 8;

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', name: 'All' }]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [locations, setLocations] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const isFirstLoad = useRef(true);
  const listRef = useRef(null);

  const categoriesToSearch = ["Electronics", "Furniture", "Vehicles", "Real Estate"];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setPlaceholderIndex((prev) => (prev + 1) % categoriesToSearch.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [fadeAnim]);

  // Fetch categories once
  useEffect(() => {
    apiFetch('/api/ads/listCategories')
      .then(data => {
        if (Array.isArray(data)) {
          const cats = data.map(cat => ({
            id: cat._id,
            name: cat.name,
            subCategories: cat.subCategory || [],
          }));
          setCategories([{ id: 'all', name: 'All' }, ...cats]);
        }
      })
      .catch(() => {});

    // Fetch locations
    apiFetch('/api/users/locations').then(res => {
      let data = res.data;
      if (Array.isArray(data)) {
        setLocations(data.map((c, idx) => ({
          id: c._id || c.id || `loc-${idx}`,
          name: c.locality + ',' + c.city
        })));
      }
    }).catch(() => {});
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    const cat = categories.find(c => c.name === selectedCategory);
    setSubCategories(cat?.subCategories || []);
    setSelectedSubCategory('');
  }, [selectedCategory, categories]);

  const fetchListings = useCallback(async (pageNum = 1, reset = false) => {
    // If already loading a reset/initial page, don't start another one
    if (loading && reset) return;
    if (loading && !reset) return;

    setLoading(true);
    try {
      const currentCat = categories.find(c => c.name === selectedCategory);
      const catId = (selectedCategory !== 'All' && currentCat) ? currentCat.id : undefined;

      // Clean payload: remove undefined/null values
      const payload = {
        page: pageNum,
        limit: LIMIT,
        search: searchQuery.trim() || undefined,
        location: locationQuery.trim() || undefined,
        category: catId,
        subCategory: selectedSubCategory || undefined,
        userId: user?._id || undefined,
      };

      const result = await apiFetch('/api/ads', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = result?.ads || [];
      const mapped = data.map(mapListing);

      setHasMore(data.length >= LIMIT);
      setListings(prev => {
        const current = (reset || pageNum === 1) ? [] : prev;
        const newItems = mapped.filter(newItem => !current.some(oldItem => oldItem.id === newItem.id));
        return [...current, ...newItems];
      });
    } catch (error) {
      console.error('fetchListings Error Details:', error.message || error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, locationQuery, selectedCategory, selectedSubCategory, categories, user, loading]);

  // Re-fetch when filters change
  useEffect(() => {
    setPage(1);
    setListings([]); // Clear old results immediately for visual feedback
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    fetchListings(1, true);

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, locationQuery, selectedCategory, selectedSubCategory]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const next = page + 1;
      setPage(next);
      fetchListings(next);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchListings(1, true);
  };

  const toggleFavorite = id => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleSearch = (keyword = searchInput, location = locationInput) => {
    // Selection from dropdown or submit triggers this
    // We update state which triggers the useEffect
    const cleanKeyword = String(keyword || '').trim();
    const cleanLocation = String(location || '').trim();

    setSearchQuery(cleanKeyword);
    setLocationQuery(cleanLocation);
    setShowLocationDropdown(false);
  };

  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(locationInput.toLowerCase())
  ).slice(0, 15);

  const renderHeader = () => (
    <View style={{ backgroundColor: COLORS.background, zIndex: 100 }}>
      {/* Combined Search & Location Bar */}
      <View style={[styles.searchRow, { paddingHorizontal: 16 }]}>
        <View style={styles.combinedSearchBox}>
          {/* Keyword Search Part (Left) */}
          <View style={styles.searchPart}>
            <Icon name="search" size={14} color={COLORS.textMuted} style={styles.searchIcon} />
            <View style={{ flex: 1, height: '100%', justifyContent: 'center' }}>
              {searchInput === '' && (
                <View style={styles.placeholderContainer} pointerEvents="none">
                  <Text style={styles.placeholderStatic}>Search : </Text>
                  <Animated.Text
                    style={[
                      styles.placeholderDynamic,
                      { opacity: fadeAnim, fontSize: 13 }
                    ]}
                  >
                    {categoriesToSearch[placeholderIndex]}
                  </Animated.Text>
                </View>
              )}
              <TextInput
                style={styles.searchInput}
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={() => handleSearch()}
                returnKeyType="search"
              />
            </View>
            {searchInput.length > 0 && (
              <TouchableOpacity
                onPress={() => { setSearchInput(''); setSearchQuery(''); }}
                style={{ padding: 4 }}
              >
                <Icon name="x" size={12} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.verticalSeparator} />

          {/* Location Search Part (Right) */}
          <View style={styles.locationPart}>
            <Icon name="map-pin" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
            <TextInput
              style={styles.locationInput}
              placeholder="Location"
              placeholderTextColor={COLORS.textMuted}
              value={locationInput}
              onChangeText={v => {
                setLocationInput(v);
                setShowLocationDropdown(true);
              }}
              onFocus={() => setShowLocationDropdown(true)}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
            />
            {locationInput.length > 0 && (
              <TouchableOpacity
                onPress={() => { setLocationInput(''); setLocationQuery(''); }}
                style={{ padding: 4 }}
              >
                <Icon name="x" size={12} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch()}>
          <Icon name="search" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Location Dropdown - Anchored to the right part */}
      {showLocationDropdown && locationInput.length > 0 && filteredLocations.length > 0 && (
        <View style={[styles.dropdownContainer, { right: 68, width: 200, left: undefined }]}>
          <ScrollView
            style={styles.dropdownScroll}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {filteredLocations.map((loc, idx) => (
              <TouchableOpacity
                key={loc.id || idx}
                style={styles.dropdownItem}
                onPress={() => {
                  setLocationInput(loc.name);
                  handleSearch(searchInput, loc.name);
                }}
              >
                <Icon name="map-pin" size={12} color={COLORS.textMuted} />
                <Text style={styles.dropdownText} numberOfLines={1}>{loc.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderStickyFilters = () => (
    <View style={styles.stickyContainer}>
      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={[styles.categoryContent, { paddingHorizontal: 16 }]}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.pill, selectedCategory === cat.name && styles.pillActive]}
            onPress={() => setSelectedCategory(cat.name)}
          >
            <Text style={[styles.pillText, selectedCategory === cat.name && styles.pillTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Subcategory Pills */}
      {subCategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subCategoryScroll}
          contentContainerStyle={[styles.categoryContent, { paddingHorizontal: 16 }]}
        >
          <TouchableOpacity
            style={[styles.pill, styles.pillSub, selectedSubCategory === '' && styles.pillSubActive]}
            onPress={() => setSelectedSubCategory('')}
          >
            <Text style={[styles.pillText, selectedSubCategory === '' && styles.pillTextActive]}>All</Text>
          </TouchableOpacity>
          {subCategories.map((sub, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.pill, styles.pillSub, selectedSubCategory === sub && styles.pillSubActive]}
              onPress={() => setSelectedSubCategory(sub)}
            >
              <Text style={[styles.pillText, selectedSubCategory === sub && styles.pillTextActive]}>
                {sub}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results count */}
      {searchQuery ? (
        <Text style={[styles.resultsLabel, { marginLeft: 16 }]}>Results for "{searchQuery}"</Text>
      ) : null}
    </View>
  );

  const renderFooter = () => {
    if (!loading || listings.length === 0) return null;
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.emptySubText}>Loading ads...</Text>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <Icon name="inbox" size={48} color={COLORS.border} />
        <Text style={styles.emptyText}>No ads found</Text>
        <Text style={styles.emptySubText}>Try a different search or category</Text>
      </View>
    );
  };

  const maxViews = React.useMemo(() => {
    if (!listings.length) return 0;
    return Math.max(...listings.map(l => l.views || 0));
  }, [listings]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>Dea<Text style={{ color: '#ff6666' }}>l</Text>r</Text>
          <Text style={styles.subtext}>Deal with the Right App!</Text>
        </View>
        <View style={styles.headerRight}>
          {user && (
            <Image
              source={{ uri: user.profilePic }}
              style={styles.avatar}
            />
          )}
        </View>
      </View>

      {/* Sticky Filter Section */}
      <View style={{ backgroundColor: COLORS.background, ...SHADOW.small, zIndex: 10 }}>
        {renderHeader()}
        {renderStickyFilters()}
      </View>

      <FlatList
        ref={listRef}
        data={listings}
        keyExtractor={item => item.id}
        numColumns={2}
        key="two-columns-grid"
        renderItem={({ item }) => {
          const trending = item.views > 0 && item.views === maxViews;

          return (
            <View style={styles.cardWrapper}>
              <AdCard
                item={item}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={toggleFavorite}
                onPress={() => navigation.navigate('AdDetail', { listing: item, isTrending: trending })}
                isTrending={trending}
              />
            </View>
          );
        }}
        ListHeaderComponent={null}
        ListFooterComponent={renderFooter()}
        ListEmptyComponent={renderEmpty()}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { color: 'white', fontSize: 35, fontWeight: '800', letterSpacing: 0.5 },
  subtext: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: COLORS.white },
  listContent: { paddingHorizontal: 4, paddingBottom: 20 },
  cardWrapper: { flex: 0.5 },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    height: 44,
    ...SHADOW.small,
  },
  combinedSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    height: 44,
    ...SHADOW.small,
    overflow: 'hidden',
  },
  searchPart: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    height: '100%',
  },
  locationPart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 4,
    height: '100%',
  },
  verticalSeparator: {
    width: 1,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.text, height: '100%' },
  locationInput: { flex: 1, fontSize: 13, color: COLORS.text, height: '100%' },
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 68,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    maxHeight: 250,
    zIndex: 1000,
    ...SHADOW.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownScroll: { paddingVertical: 4 },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  dropdownText: { fontSize: 13, color: COLORS.text, flex: 1 },
  placeholderContainer: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderStatic: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  placeholderDynamic: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
  },
  categoryScroll: { marginBottom: 4 },
  subCategoryScroll: { marginBottom: 10 },
  categoryContent: { paddingHorizontal: 0, gap: 8, paddingVertical: 4 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillSub: { backgroundColor: '#f0f4ff', borderColor: '#c7d4f0' },
  pillSubActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  pillText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  pillTextActive: { color: COLORS.white },
  stickyContainer: {
    backgroundColor: COLORS.background,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  resultsLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8, marginLeft: 2 },
  loader: { paddingVertical: 20, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  emptySubText: { fontSize: 13, color: COLORS.textMuted },
});
