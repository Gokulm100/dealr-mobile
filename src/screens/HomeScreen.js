// src/screens/HomeScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, RefreshControl,
  StatusBar, Image, Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import AdCard from '../components/AdCard';
import { apiFetch, mapListing, API_BASE_URL } from '../utils/api';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

const LIMIT = 8;

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
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
  }, [searchQuery, locationQuery, selectedCategory, selectedSubCategory, minPrice, maxPrice]);

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

  const handleSearch = () => {
    // Updates active search states from UI input states
    setSearchQuery(searchInput.trim());
    setLocationQuery(locationInput.trim());
    setMinPrice(minPriceInput);
    setMaxPrice(maxPriceInput);
    setShowLocationDropdown(false);
    setShowFilters(false);
  };

  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(locationInput.toLowerCase())
  ).slice(0, 15);

  const hasActiveFilters = locationQuery.trim() !== '' || minPrice !== '' || maxPrice !== '';

  const renderHeader = () => (
    <View style={{ backgroundColor: COLORS.background, zIndex: 100 }}>
      {/* Search Bar Row */}
      <View style={[styles.searchRow, { paddingHorizontal: 16 }]}>
        <View style={styles.searchBox}>
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
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={() => { setSearchInput(''); }}
              style={{ padding: 4 }}
            >
              <Icon name="x" size={12} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.searchBtn, showFilters && { backgroundColor: COLORS.accent }]}
          onPress={() => {
            if (showFilters) setShowLocationDropdown(false);
            setShowFilters(!showFilters);
          }}
        >
          <Icon name="menu" size={18} color={COLORS.white} />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Filter Section */}
      {showFilters && (
        <View style={styles.filterSection}>
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.filterLabel}>Find ads in</Text>
            <View style={styles.filterInputWrapper}>
              <Icon name="map-pin" size={14} color={COLORS.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.filterTextInput}
                placeholder="City, area or locality..."
                placeholderTextColor={COLORS.textMuted}
                value={locationInput}
                onChangeText={v => {
                  setLocationInput(v);
                  setShowLocationDropdown(true);
                }}
                onFocus={() => setShowLocationDropdown(true)}
                onSubmitEditing={handleSearch}
              />
              {locationInput.length > 0 && (
                <TouchableOpacity onPress={() => setLocationInput('')}>
                  <Icon name="x" size={12} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.filterLabel}>Price Range</Text>
          <View style={styles.filterRow}>
            <View style={[styles.filterInputWrapper, { flex: 1 }]}>
              <Text style={{ color: COLORS.textMuted, fontSize: 12, marginRight: 6 }}>Min:</Text>
              <TextInput
                style={styles.filterTextInput}
                placeholder="0"
                keyboardType="numeric"
                value={minPriceInput}
                onChangeText={setMinPriceInput}
              />
            </View>
            <View style={[styles.filterInputWrapper, { flex: 1 }]}>
              <Text style={{ color: COLORS.textMuted, fontSize: 12, marginRight: 6 }}>Max:</Text>
              <TextInput
                style={styles.filterTextInput}
                placeholder="Any"
                keyboardType="numeric"
                value={maxPriceInput}
                onChangeText={setMaxPriceInput}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={() => handleSearch()}>
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Location Dropdown - Anchored to location input when filters are open */}
      {showFilters && showLocationDropdown && locationInput.length > 0 && filteredLocations.length > 0 && (
        <View style={[styles.dropdownContainer, { top: 110, left: 16, right: 16, width: undefined }]}>
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
                  setShowLocationDropdown(false);
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
            onPress={() => {
              if (cat.name === 'All') {
                // Reset all filters when 'All' is clicked
                setSearchQuery('');
                setSearchInput('');
                setLocationQuery('');
                setLocationInput('');
                setMinPrice('');
                setMinPriceInput('');
                setMaxPrice('');
                setMaxPriceInput('');
                setSelectedSubCategory('');
              }
              setSelectedCategory(cat.name);
            }}
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
  logo: { color: 'white', fontSize: 40, fontWeight: '800', letterSpacing: 0.5 },
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
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.text, height: '100%' },
  locationInput: { flex: 1, fontSize: 13, color: COLORS.text, height: '100%' },
  filterSection: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  filterInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTextInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    marginTop:1,
    height: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterInputGroup: {
    flex: 1,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
  },
  applyBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
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
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error || '#ef4444',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  categoryScroll: { marginBottom: 6 },
  subCategoryScroll: { marginBottom: 12 },
  categoryContent: { paddingHorizontal: 0, gap: 10, paddingVertical: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...SHADOW.small,
  },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillSub: { backgroundColor: '#f0f4ff', borderColor: '#c7d4f0' },
  pillSubActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  pillText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  pillTextActive: { color: COLORS.white },
  stickyContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.0)',
  },
  resultsLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8, marginLeft: 2 },
  loader: { paddingVertical: 20, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  emptySubText: { fontSize: 13, color: COLORS.textMuted },
});
