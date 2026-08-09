// src/screens/HomeScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, RefreshControl,
  StatusBar, Image, Animated, Platform, LayoutAnimation, UIManager,
  Alert,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '../components/Icon';
import DealrLogo from '../components/DealrLogo';
import SafeLinearGradient from '../components/SafeLinearGradient';
import AdCard from '../components/AdCard';
import CategoryIcon, { getCategoryTheme } from '../components/CategoryIcon';
import SkeletonCard from '../components/SkeletonCard';
import { apiFetch, mapListing, API_BASE_URL, addAdToFavorite, removeAdFromFavorite, isAdOwnedByUser } from '../utils/api';
import {COLORS, RADIUS, SHADOW, SURFACE} from '../utils/theme';
import { useAuth } from '../context/AuthContext';

const LIMIT = 8;

const PRICE_RANGES = [
  { id: 'under5k', label: 'Under ₹5K', min: '', max: '5000' },
  { id: '5k-20k', label: '₹5K – ₹20K', min: '5000', max: '20000' },
  { id: '20k-1l', label: '₹20K – ₹1L', min: '20000', max: '100000' },
  { id: '1l+', label: '₹1L+', min: '100000', max: '' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', name: 'All' }]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categoryInput, setCategoryInput] = useState('All');
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [subCategoryInput, setSubCategoryInput] = useState('');
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
  const [recentAds, setRecentAds] = useState([]);
  const isFirstLoad = useRef(true);
  const listRef = useRef(null);
  const lastScrollY = useRef(0);
  const quickFiltersCollapsed = useRef(false);
  const quickFilterAnim = useRef(new Animated.Value(1)).current;

  const setQuickFiltersCollapsed = useCallback((collapsed) => {
    if (quickFiltersCollapsed.current === collapsed) return;
    quickFiltersCollapsed.current = collapsed;
    Animated.timing(quickFilterAnim, {
      toValue: collapsed ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [quickFilterAnim]);

  const handleListScroll = useCallback((event) => {
    const y = event.nativeEvent.contentOffset.y;
    const diff = y - lastScrollY.current;

    if (y <= 8) {
      setQuickFiltersCollapsed(false);
    } else if (diff > 6) {
      setQuickFiltersCollapsed(true);
    } else if (diff < -6) {
      setQuickFiltersCollapsed(false);
    }

    lastScrollY.current = y;
  }, [setQuickFiltersCollapsed]);

  useEffect(() => {
    loadRecentlyViewed();
    loadFavorites();
    const unsubscribe = navigation.addListener('focus', () => {
      loadRecentlyViewed();
      loadFavorites();
      loadLocations();
    });
    return unsubscribe;
  }, [navigation, user?._id]);

  const loadFavorites = async () => {
    try {
      const raw = await AsyncStorage.getItem('favorites');
      if (raw) setFavorites(JSON.parse(raw));
    } catch (err) {
      console.log('Error loading favorites:', err);
    }
  };

  const loadRecentlyViewed = async () => {
    try {
      const raw = await AsyncStorage.getItem('recently_viewed_ads');
      if (!raw) {
        setRecentAds([]);
        return;
      }
      const list = JSON.parse(raw);
      const filtered = user ? list.filter((ad) => !isAdOwnedByUser(ad, user)) : list;
      if (filtered.length !== list.length) {
        await AsyncStorage.setItem('recently_viewed_ads', JSON.stringify(filtered));
      }
      setRecentAds(filtered);
    } catch (err) {
      console.log('Error loading recent ads:', err);
    }
  };

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

  const loadLocations = () => {
    apiFetch('/api/users/locations').then(res => {
      let data = res.data;
      if (Array.isArray(data)) {
        setLocations(data.map((c, idx) => ({
          id: c._id || c.id || `loc-${idx}`,
          name: c.locality + ',' + c.city
        })));
      }
    }).catch(() => {});
  };

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

    loadLocations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update subcategories when category input changes
  useEffect(() => {
    const cat = categories.find(c => c.name === categoryInput);
    setSubCategories(cat?.subCategories || []);
    setSubCategoryInput('');
  }, [categoryInput, categories]);

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
        priceMin: minPrice !== '' ? Number(minPrice) : undefined,
        priceMax: maxPrice !== '' ? Number(maxPrice) : undefined,
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
  }, [searchQuery, locationQuery, selectedCategory, selectedSubCategory, minPrice, maxPrice, categories, user, loading]);

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

  const toggleFavorite = async (id) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add ads to your favorites.');
      return;
    }

    try {
      const isFav = favorites.includes(id);
      const updated = isFav ? favorites.filter(f => f !== id) : [...favorites, id];

      // Optimistic UI update
      setFavorites(updated);
      await AsyncStorage.setItem('favorites', JSON.stringify(updated));

      // Backend update
      if (isFav) {
        await removeAdFromFavorite(id);
      } else {
        await addAdToFavorite(id);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert on failure
      const reverted = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
      setFavorites(reverted);
      await AsyncStorage.setItem('favorites', JSON.stringify(reverted));
    }
  };

  const handleSearch = () => {
    // Updates active search states from UI input states
    setSearchQuery(searchInput.trim());
    setLocationQuery(locationInput.trim());
    setMinPrice(minPriceInput);
    setMaxPrice(maxPriceInput);
    setSelectedCategory(categoryInput);
    setSelectedSubCategory(subCategoryInput);
    setShowLocationDropdown(false);
    setShowFilters(false);
  };

  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(locationInput.toLowerCase())
  ).slice(0, 15);

  const hasActiveFilters = locationQuery.trim() !== '' || minPrice !== '' || maxPrice !== '' || selectedCategory !== 'All';

  const clearFilter = (type) => {
    if (type === 'search') {
      setSearchQuery('');
      setSearchInput('');
    } else if (type === 'location') {
      setLocationQuery('');
      setLocationInput('');
    } else if (type === 'minPrice') {
      setMinPrice('');
      setMinPriceInput('');
    } else if (type === 'maxPrice') {
      setMaxPrice('');
      setMaxPriceInput('');
    } else if (type === 'category') {
      setSelectedCategory('All');
      setCategoryInput('All');
      setSelectedSubCategory('');
      setSubCategoryInput('');
    } else if (type === 'subCategory') {
      setSelectedSubCategory('');
      setSubCategoryInput('');
    }
  };

  const renderHeader = () => (
    <View style={styles.searchSection}>
      {/* Search Bar Row */}
      <View style={styles.searchRow}>
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

      <Animated.View
        style={{
          overflow: 'hidden',
          opacity: quickFilterAnim,
          maxHeight: quickFilterAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 160],
          }),
        }}
      >
        {renderQuickCategoryFilter()}
      </Animated.View>

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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.subTrackInner, { marginBottom: 10 }]}
          >
            {PRICE_RANGES.map((range) => {
              const active = isPriceRangeActive(range);
              return (
                <TouchableOpacity
                  key={range.id}
                  style={[styles.subPill, active && styles.subPillActive]}
                  onPress={() => handlePriceRangeSelect(range)}
                  activeOpacity={0.88}
                >
                  <Text
                    style={[styles.subPillText, active && styles.subPillTextActive]}
                    numberOfLines={1}
                  >
                    {range.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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

          <Text style={styles.filterLabel}>Category</Text>
          <View style={[styles.categoryTrack, { marginBottom: 16 }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTrackInner}
            >
              {categories.map((cat) => {
                const active = categoryInput === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryPill, active && styles.categoryPillActive]}
                    onPress={() => handleCategorySelect(cat)}
                    activeOpacity={0.88}
                  >
                    {active && <View style={styles.categoryPillDot} />}
                    <Text
                      style={[styles.categoryPillText, active && styles.categoryPillTextActive]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {categoryInput !== 'All' && subCategories.length > 0 && (
            <View style={[styles.subBlock, { marginTop: 0, borderTopWidth: 0, marginBottom: 16 }]}>
              <View style={styles.subBlockHeader}>
                <View style={styles.subBlockTitleRow}>
                  <View style={styles.subBlockDot} />
                  <Text style={styles.subBlockTitle}>{categoryInput}</Text>
                </View>
                {subCategoryInput ? (
                  <TouchableOpacity
                    style={styles.subResetBtn}
                    onPress={() => setSubCategoryInput('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.subReset}>Clear</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subTrackInner}
              >
                <TouchableOpacity
                  style={[styles.subPill, subCategoryInput === '' && styles.subPillActive]}
                  onPress={() => setSubCategoryInput('')}
                  activeOpacity={0.88}
                >
                  <Text
                    style={[
                      styles.subPillText,
                      subCategoryInput === '' && styles.subPillTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {subCategories.map((sub, idx) => {
                  const active = subCategoryInput === sub;
                  return (
                    <TouchableOpacity
                      key={`${sub}-${idx}`}
                      style={[styles.subPill, active && styles.subPillActive]}
                      onPress={() => setSubCategoryInput(sub)}
                      activeOpacity={0.88}
                    >
                      <Text
                        style={[styles.subPillText, active && styles.subPillTextActive]}
                        numberOfLines={1}
                      >
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

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

  const handleCategorySelect = (cat) => {
    if (cat.name === 'All') {
      setCategoryInput('All');
      setSubCategoryInput('');
    } else {
      setCategoryInput(cat.name);
    }
  };

  const handleQuickCategorySelect = (cat) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const nextCategory = selectedCategory === cat.name && cat.name !== 'All' ? 'All' : cat.name;
    setCategoryInput(nextCategory);
    setSelectedCategory(nextCategory);
    setSelectedSubCategory('');
    setSubCategoryInput('');
    setQuickFiltersCollapsed(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleQuickSubCategorySelect = (sub) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const nextSubCategory = selectedSubCategory === sub ? '' : sub;
    setSelectedSubCategory(nextSubCategory);
    setSubCategoryInput(nextSubCategory);
    setQuickFiltersCollapsed(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const quickSubCategories = React.useMemo(() => {
    if (selectedCategory === 'All') return [];
    return categories.find((c) => c.name === selectedCategory)?.subCategories || [];
  }, [selectedCategory, categories]);

  const renderQuickSubCategoryFilter = () => {
    if (quickSubCategories.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickSubCategoryTrack}
      >
        <TouchableOpacity
          style={[styles.quickSubPill, !selectedSubCategory && styles.quickSubPillActive]}
          onPress={() => handleQuickSubCategorySelect('')}
          activeOpacity={0.85}
        >
          <Text style={[styles.quickSubPillText, !selectedSubCategory && styles.quickSubPillTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {quickSubCategories.map((sub, idx) => {
          const active = selectedSubCategory === sub;
          return (
            <TouchableOpacity
              key={`quick-sub-${sub}-${idx}`}
              style={[styles.quickSubPill, active && styles.quickSubPillActive]}
              onPress={() => handleQuickSubCategorySelect(sub)}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.quickSubPillText, active && styles.quickSubPillTextActive]}
                numberOfLines={1}
              >
                {sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderQuickCategoryFilter = () => (
    <View style={styles.quickCategorySection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickCategoryTrack}
      >
        {categories.map((cat) => {
          const active = selectedCategory === cat.name;
          const theme = getCategoryTheme(cat.name);
          return (
            <TouchableOpacity
              key={`quick-${cat.id}`}
              style={[
                styles.quickCategoryTile,
                active && styles.quickCategoryTileActive,
                active && {
                  shadowColor: theme.icon,
                  borderColor: `${theme.icon}33`,
                  backgroundColor: theme.bg,
                },
              ]}
              onPress={() => handleQuickCategorySelect(cat)}
              activeOpacity={0.88}
            >
              <CategoryIcon
                name={cat.name}
                size={16}
                active={active}
                variant="tile"
                colored
                style={styles.quickCategoryIconBadge}
              />
              <Text
                style={[
                  styles.quickCategoryText,
                  active && [styles.quickCategoryTextActive, { color: theme.icon }],
                ]}
                numberOfLines={2}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {renderQuickSubCategoryFilter()}
    </View>
  );

  const isPriceRangeActive = (range) =>
    minPriceInput === range.min && maxPriceInput === range.max;

  const handlePriceRangeSelect = (range) => {
    if (isPriceRangeActive(range)) {
      setMinPriceInput('');
      setMaxPriceInput('');
    } else {
      setMinPriceInput(range.min);
      setMaxPriceInput(range.max);
    }
  };

  const renderStickyFilters = () => {
    const activeFilters = [];
    if (searchQuery) activeFilters.push({ type: 'search', label: searchQuery });
    if (locationQuery) activeFilters.push({ type: 'location', label: locationQuery });
    if (minPrice) activeFilters.push({ type: 'minPrice', label: `Min: ₹${minPrice}` });
    if (maxPrice) activeFilters.push({ type: 'maxPrice', label: `Max: ₹${maxPrice}` });
    if (selectedCategory !== 'All') activeFilters.push({ type: 'category', label: selectedCategory });
    if (selectedSubCategory) activeFilters.push({ type: 'subCategory', label: selectedSubCategory });

    if (activeFilters.length === 0) return null;

    return (
      <View style={styles.stickyContainer}>
        <View style={styles.sectionDivider} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsScroll}
        >
          {activeFilters.map((f) => (
            <TouchableOpacity
              key={f.type}
              style={styles.filterTag}
              onPress={() => clearFilter(f.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.filterTagText} numberOfLines={1}>{f.label}</Text>
              <Icon name="x" size={10} color={COLORS.primary} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => {
              setSearchQuery(''); setSearchInput('');
              setLocationQuery(''); setLocationInput('');
              setMinPrice(''); setMinPriceInput('');
              setMaxPrice(''); setMaxPriceInput('');
              setSelectedCategory('All'); setCategoryInput('All');
              setSelectedSubCategory(''); setSubCategoryInput('');
            }}
            style={{ paddingHorizontal: 12, paddingVertical: 6, justifyContent: 'center' }}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || listings.length === 0) return null;
    // Skeleton row keeps the loading affordance consistent with the initial load.
    return (
      <View style={styles.skeletonGrid}>
        {Array.from({ length: 2 }).map((_, idx) => (
          <View key={`skeleton-more-${idx}`} style={styles.skeletonItem}>
            <SkeletonCard />
          </View>
        ))}
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      // Skeleton grid mirrors the 2-column ad layout while the first page loads.
      return (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: LIMIT }).map((_, idx) => (
            <View key={`skeleton-${idx}`} style={styles.skeletonItem}>
              <SkeletonCard />
            </View>
          ))}
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
      <StatusBar backgroundColor={COLORS.primaryDeep} barStyle="light-content" />

      {/* Top Header — premium chrome */}
      <SafeLinearGradient
        colors={SURFACE.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}
      >
        <DealrLogo variant="light" size="title" showTagline style={styles.headerBrand} />
        <View style={styles.headerRight}>
          {user && (
            <Image
              source={{ uri: user.profilePic }}
              style={styles.avatar}
            />
          )}
        </View>
      </SafeLinearGradient>

      {/* Search + categories — one continuous surface */}
      <View style={styles.stickyShell}>
        <View style={styles.filterAccent} />
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
        ListHeaderComponent={
          <View>
            {recentAds.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentTitle}>Recently Viewed</Text>
                  <TouchableOpacity onPress={async () => {
                    await AsyncStorage.removeItem('recently_viewed_ads');
                    setRecentAds([]);
                  }}>
                    <Text style={styles.clearRecentText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentScroll}
                >
                  {recentAds.map((item) => (
                    <TouchableOpacity
                      key={item.id || item._id}
                      style={styles.recentItem}
                      onPress={() => navigation.navigate('AdDetail', { listing: item })}
                    >
                      <Image
                        source={{ uri: item.images?.[0] }}
                        style={styles.recentImage}
                        resizeMode="cover"
                      />
                      <View style={styles.recentInfo}>
                        <Text style={styles.recentPrice} numberOfLines={1}>₹{Number(item.price).toLocaleString('en-IN')}</Text>
                        <Text style={styles.recentItemTitle} numberOfLines={1}>{item.title}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {listings.length > 0 && (
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationTitle}>Fresh Recommendations</Text>
                <View style={styles.recommendationLine} />
              </View>
            )}
          </View>
        }
        ListFooterComponent={renderFooter()}
        ListEmptyComponent={renderEmpty()}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        onScroll={handleListScroll}
        scrollEventThrottle={16}
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
    paddingBottom: 28,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    ...SHADOW.header,
  },
  headerBrand: {
    flexShrink: 1,
    minWidth: 0,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 2 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  listContent: { paddingHorizontal: 4, paddingBottom: 20 },
  cardWrapper: { flex: 0.5 },
  stickyShell: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 10,
    paddingBottom: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    marginTop: -18,
    marginHorizontal: 0,
    overflow: 'hidden',
    ...SHADOW.medium,
  },
  filterAccent: {
    height: 3,
    backgroundColor: COLORS.primary,
  },
  searchSection: {
    zIndex: 100,
    paddingTop: 14,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  quickCategorySection: {
    paddingBottom: 12,
  },
  quickCategoryTrack: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
    alignItems: 'flex-start',
  },
  quickSubCategoryTrack: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
    alignItems: 'center',
  },
  quickSubPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.small,
  },
  quickSubPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: 'transparent',
    shadowColor: '#1e4fd6',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  quickSubPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  quickSubPillTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  quickCategoryTile: {
    width: 70,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 6,
    paddingVertical: 11,
    borderRadius: 0,
    backgroundColor: COLORS.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  quickCategoryTileActive: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 7,
    transform: [{ translateY: -1 }],
  },
  quickCategoryIconBadge: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  quickCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: -0.1,
    textAlign: 'center',
    lineHeight: 12,
  },
  quickCategoryTextActive: {
    fontWeight: '700',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.small,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    height: '100%',
  },
  locationInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    height: '100%',
  },
  filterSection: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
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
    borderRadius: 14,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e4fd6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
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
  stickyContainer: {
    paddingBottom: 10,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  tagsScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(55, 140, 246, 0.15)',
  },
  filterTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 2,
  },
  filterPanelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  filterPanelHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: 12,
  },
  categorySummary: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'right',
  },
  collapseChevron: {
    color: COLORS.textMuted,
    width: 30,
    fontSize:30,
    textAlign: 'center',
  },
  filterPanelHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPanelLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  categoryTrack: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 5,
  },
  categoryTrackInner: {
    paddingHorizontal: 2,
    gap: 5,
    alignItems: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: 'transparent',
  },
  categoryPillActive: {
    backgroundColor: COLORS.white,
    ...SHADOW.small,
    borderWidth: 1,
    borderColor: 'rgba(55, 140, 246, 0.14)',
  },
  categoryPillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b95a5',
    letterSpacing: -0.15,
  },
  categoryPillTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  subBlock: {
    marginTop: 14,
    paddingTop: 14,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  subBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subBlockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  subBlockDot: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.5,
  },
  subBlockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  subResetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: '#eff6ff',
  },
  subReset: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
  subTrackInner: {
    paddingHorizontal: 2,
    paddingBottom: 4,
    gap: 8,
    alignItems: 'center',
  },
  subPill: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#e5e9ef',
  },
  subPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOW.small,
  },
  subPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5c6678',
  },
  subPillTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  resultsLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 2,
  },
  loader: { paddingVertical: 20, alignItems: 'center' },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 8,
  },
  skeletonItem: {
    width: '50%',
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  emptySubText: { fontSize: 13, color: COLORS.textMuted },
  recentSection: {
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    marginTop: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  clearRecentText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  recentScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  recentItem: {
    width: 100,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentImage: {
    width: '100%',
    height: 65,
    backgroundColor: COLORS.border,
  },
  recentInfo: {
    padding: 6,
  },
  recentPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: -0.2,
  },
  recentItemTitle: {
    fontSize: 10,
    color: COLORS.text,
    marginTop: 1,
  },
  recommendationHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recommendationTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  recommendationLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
});
