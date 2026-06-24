// src/screens/PostAdScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import Icon from '../components/Icon';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, API_BASE_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AiTextArea from '../components/AiTextArea';
import { checkAndPromptNotifications } from '../utils/notifications';

const KERALA_DISTRICTS = [
  'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
  'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
  'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod',
];

export default function PostAdScreen({ navigation, route }) {
  const { user } = useAuth();
  const scrollRef = useRef(null);

  // Use state to track if we are editing
  const [editingAd, setEditingAd] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [subCategories, setSubCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [newLocation, setNewLocation] = useState(null);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    price: '',
    description: '',
  });

  useEffect(() => {
    if (route.params?.ad) {
      const ad = route.params.ad;
      setEditingAd(ad);
      setForm({
        title: ad.title || '',
        price: ad.price?.toString() || '',
        description: ad.description || '',
      });
      setLocationSearch(ad.location || '');
      setSelectedLocation(ad.location ? { name: ad.location } : null);
      setExistingImages(ad.images || []);

      if (categories.length > 0) {
        const found = categories.find(c => c.name === ad.category || c.id === ad.category || c.id === ad.categoryId);
        if (found) {
          setSelectedCategory(found.id);
          setSelectedSubCategory(ad.subCategory || '');
        }
      }
    } else {
      // Clear form when switching from Edit to Post (triggered by Tab listener)
      setEditingAd(null);
      setForm({ title: '', price: '', description: '' });
      setLocationSearch('');
      setSelectedLocation(null);
      setImages([]);
      setExistingImages([]);
      setSelectedCategory('');
      setSelectedSubCategory('');
    }
  }, [route.params?.ad, categories]);

  const loadLocations = () => {
    apiFetch('/api/users/locations').then(res => {
      let data = res.data;
      if (Array.isArray(data)) setLocations(data.map(c => ({
        id: c._id || c.id,
        name: c.locality + ',' + c.city,
        locality: c.locality,
        city: c.city,
        district: c.district,
        state: c.state,
      })));
    }).catch(() => {});
  };

  useEffect(() => {
    // Fetch categories
    apiFetch('/api/ads/listCategories').then(data => {
      if (Array.isArray(data)) {
        const mapped = data.map(cat => ({
          id: cat._id,
          name: cat.name,
          subCategories: cat.subCategory || [],
        }));
        setCategories(mapped);
      }
    }).catch(() => {});

    // Fetch Kerala cities
    loadLocations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cat = categories.find(c => c.id === selectedCategory);
    setSubCategories(cat?.subCategories || []);
  }, [selectedCategory, categories]);

  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(locationSearch.toLowerCase())
  ).slice(0, 20);

  const queryMatchesExisting = locations.some(
    l => l.name.toLowerCase() === locationSearch.trim().toLowerCase()
  );

  const districtOptions = [...new Set(locations.map(l => l.district).filter(Boolean))];
  const districtChoices = [...new Set([...districtOptions, ...KERALA_DISTRICTS])].sort();

  const getDistrictChoicesForCity = (cityName) => {
    const city = String(cityName || '').trim().toLowerCase();
    if (!city) return districtChoices;
    const fromData = [...new Set(
      locations
        .filter(l =>
          l.city?.toLowerCase() === city
          || l.district?.toLowerCase() === city
        )
        .map(l => l.district)
        .filter(Boolean),
    )].sort();
    if (fromData.length) return fromData;
    return districtChoices;
  };

  const suggestDistrictForCity = (cityName, currentDistrict = '') => {
    const city = String(cityName || '').trim();
    if (!city) return '';
    const choices = getDistrictChoicesForCity(city);
    if (currentDistrict && choices.includes(currentDistrict)) return currentDistrict;
    const exactDistrict = KERALA_DISTRICTS.find(d => d.toLowerCase() === city.toLowerCase());
    if (exactDistrict && choices.includes(exactDistrict)) return exactDistrict;
    if (choices.length === 1) return choices[0];
    return '';
  };

  const handleNewLocationCityChange = (city) => {
    setNewLocation(p => ({ ...p, city }));
    setDistrictDropdownOpen(false);
  };

  const districtChoicesForForm = newLocation?.city
    ? getDistrictChoicesForCity(newLocation.city)
    : [];

  const filteredDistricts = districtChoicesForForm.filter(d =>
    d.toLowerCase().includes(districtSearch.toLowerCase()),
  ).slice(0, 20);

  const pickDistrict = (district) => {
    setNewLocation(p => ({ ...p, district }));
    setDistrictSearch(district);
    setDistrictDropdownOpen(false);
  };

  const handleDistrictSearchChange = (q) => {
    setDistrictSearch(q);
    setDistrictDropdownOpen(q.trim().length > 0);
    const match = districtChoicesForForm.find(
      d => d.toLowerCase() === q.trim().toLowerCase(),
    );
    setNewLocation(p => ({ ...p, district: match || '' }));
  };

  const showDistrictList = districtDropdownOpen
    && districtSearch.trim().length > 0
    && filteredDistricts.length > 0;

  const resetDistrictSearch = () => {
    setDistrictSearch('');
    setDistrictDropdownOpen(false);
  };

  const confirmCityStep = () => {
    const city = newLocation?.city?.trim();
    if (!city) {
      Alert.alert('Missing city', 'Please enter a city.');
      return;
    }
    const district = suggestDistrictForCity(city);
    setNewLocation(p => ({ ...p, step: 'district', district }));
    setDistrictSearch(district || '');
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const goBackToCityStep = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setNewLocation(p => ({ ...p, step: 'city', district: '' }));
    resetDistrictSearch();
  };

  const openNewLocationForm = () => {
    const q = locationSearch.trim();
    const parts = q.split(',').map(s => s.trim()).filter(Boolean);
    setShowLocationDropdown(false);
    resetDistrictSearch();
    slideAnim.setValue(0);
    setNewLocation({
      locality: parts[0] || q,
      city: parts[1] || '',
      district: '',
      step: 'city',
    });
  };

  const saveNewLocation = async () => {
    const { locality, district, city } = newLocation || {};
    if (!locality?.trim() || !district?.trim() || !city?.trim()) {
      Alert.alert('Missing details', 'Please enter city and district.');
      return;
    }
    setSavingLocation(true);
    try {
      const res = await apiFetch('/api/users/locations/add', {
        method: 'POST',
        body: JSON.stringify({
          locality: locality.trim(),
          district: district.trim(),
          city: city.trim(),
        }),
      });
      const saved = res?.data;
      const name = `${saved?.locality || locality.trim()},${saved?.city || city.trim()}`;
      loadLocations();
      setSelectedLocation({ id: saved?._id || null, name });
      setLocationSearch(name);
      setNewLocation(null);
      resetDistrictSearch();
      slideAnim.setValue(0);
    } catch {
      Alert.alert('Error', 'Could not add location. Please try again.');
    } finally {
      setSavingLocation(false);
    }
  };

  const MAX_IMAGES = 5;

  const addAssets = (assets = []) => {
    if (!assets.length) return;
    setImages(prev => [...prev, ...assets].slice(0, MAX_IMAGES));
  };

  const openGallery = () => {
    const remaining = MAX_IMAGES - images.length;
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: remaining, includeBase64: false },
      res => {
        if (res.didCancel || res.errorCode) return;
        addAssets(res.assets);
      }
    );
  };

  const openCamera = () => {
    launchCamera(
      { mediaType: 'photo', includeBase64: false, saveToPhotos: false, quality: 0.8 },
      res => {
        if (res.didCancel) return;
        if (res.errorCode) {
          Alert.alert(
            'Camera unavailable',
            res.errorMessage || 'Could not open the camera. Please check app permissions.'
          );
          return;
        }
        addAssets(res.assets);
      }
    );
  };

  const pickImages = () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit reached', `You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    Alert.alert(
      'Add Photos',
      'Choose how you want to add an image.',
      [
        { text: 'Take Photo', onPress: openCamera },
        { text: 'Choose from Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handlePost = async () => {
    if (!user) {
      Alert.alert('Login required', 'Please login to post an ad.');
      return;
    }
    if (!form.title || !form.price || !selectedLocation || !form.description || !selectedCategory) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    if (form.description.length < 150) {
      Alert.alert('Description too short', 'Description must be at least 150 characters.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('price', form.price);
      formData.append('location', selectedLocation.name);
      formData.append('category', selectedCategory);
      if (selectedSubCategory) formData.append('subCategory', selectedSubCategory);
      formData.append('description', form.description);

      // Add existing images that weren't removed
      if (editingAd) {
         formData.append('existingImages', JSON.stringify(existingImages));
      }

      images.forEach((img, idx) => {
        formData.append('images', {
          uri: img.uri,
          type: img.type || 'image/jpeg',
          name: img.fileName || `image_${idx}.jpg`,
        });
      });

      const url = editingAd ? `${API_BASE_URL}/api/ads/edit/${editingAd.id}` : `${API_BASE_URL}/api/ads/postAdd`;
      const res = await fetch(url, {
        method: editingAd ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        // Refresh locations so a newly entered one is available next time.
        loadLocations();
        Alert.alert('Success', editingAd ? 'Your ad has been updated!' : 'Your ad has been posted!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate(editingAd ? 'MyAds' : 'Home');
              if (!editingAd) {
                // Prompt for notifications only after a new post
                setTimeout(checkAndPromptNotifications, 500);
              }
            }
          },
        ]);
        if (!editingAd) {
          setForm({ title: '', price: '', description: '' });
          setImages([]);
          setSelectedCategory('');
          setSelectedLocation(null);
          setLocationSearch('');
        }
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      Alert.alert('Error', `Failed to ${editingAd ? 'update' : 'post'} ad. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const charCount = form.description.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{editingAd ? 'Edit Ad' : 'Post Ad'}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {!user && (
            <View style={styles.loginWarning}>
              <Icon name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.loginWarningText}>You must be logged in to post an ad.</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. iPhone 13 Pro Max"
            value={form.title}
            onChangeText={v => setForm(p => ({ ...p, title: v }))}
          />

          {/* Category */}
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, selectedCategory === cat.id && styles.pillActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.pillText, selectedCategory === cat.id && styles.pillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Subcategory */}
          {subCategories.length > 0 && (
            <>
              <Text style={styles.label}>Subcategory</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
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
            </>
          )}

          {/* Price */}
          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15000"
            keyboardType="numeric"
            value={form.price}
            onChangeText={v => setForm(p => ({ ...p, price: v }))}
          />
          {/* Location */}
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="Search city..."
            value={locationSearch}
            onChangeText={v => {
              setLocationSearch(v);
              setSelectedLocation(null);
              setShowLocationDropdown(true);
            }}
            onFocus={() => {
              setShowLocationDropdown(true);
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
            }}
          />
          {showLocationDropdown && locationSearch.length > 0 && (
            <View style={styles.dropdown}>
              <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                {filteredLocations.map(loc => (
                  <TouchableOpacity
                    key={loc.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedLocation(loc);
                      setLocationSearch(loc.name);
                      setShowLocationDropdown(false);
                    }}
                  >
                    <Icon name="map-pin" size={13} color={COLORS.textMuted} />
                    <Text style={styles.dropdownText}>{loc.name}</Text>
                  </TouchableOpacity>
                ))}
                {locationSearch.trim().length > 0 && !queryMatchesExisting && (
                  <TouchableOpacity
                    style={[styles.dropdownItem, styles.dropdownAddItem]}
                    onPress={openNewLocationForm}
                  >
                    <Icon name="plus" size={14} color={COLORS.primary} />
                    <Text style={styles.dropdownAddText}>Add “{locationSearch.trim()}” as a new location</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}

          {newLocation && (
            <View style={[styles.locCard, showDistrictList && styles.locCardDropdownOpen]}>
              <View style={styles.locAccent} />
              <View style={styles.locTop}>
                <View style={styles.locTopLeft}>
                  <Text style={styles.locEyebrow}>
                    {newLocation.locality}
                    {newLocation.step === 'district' && !!newLocation.city?.trim() && (
                      <>
                        <Text style={styles.locBreadcrumbSep}> &gt; </Text>
                        <Text style={styles.locBreadcrumbCity}>{newLocation.city.trim()}</Text>
                      </>
                    )}
                  </Text>
                  <View style={styles.locDots}>
                    <View style={[styles.locDot, newLocation.step === 'city' ? styles.locDotActive : styles.locDotDone]} />
                    <View style={[styles.locDot, newLocation.step === 'district' && styles.locDotActive]} />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.locClose}
                  onPress={() => { setNewLocation(null); resetDistrictSearch(); slideAnim.setValue(0); }}
                >
                  <Icon name="x" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.locSlider,
                  showDistrictList && styles.locSliderDropdownOpen,
                ]}
                onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
              >
                <Animated.View
                  style={{
                    flexDirection: 'row',
                    width: sliderWidth > 0 ? sliderWidth * 2 : '200%',
                    transform: [{
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, sliderWidth > 0 ? -sliderWidth : 0],
                      }),
                    }],
                  }}
                >
                  <View style={[styles.locSlide, sliderWidth > 0 && { width: sliderWidth }]}>
                    <Text style={styles.locQuestion}>What is the city?</Text>
                    <View style={styles.locFieldRow}>
                      <TextInput
                        style={styles.locFieldInput}
                        placeholder="e.g. Thiruvananthapuram"
                        placeholderTextColor={COLORS.textMuted}
                        value={newLocation.city}
                        onChangeText={handleNewLocationCityChange}
                        editable={!savingLocation}
                        returnKeyType="next"
                        onSubmitEditing={confirmCityStep}
                      />
                      <TouchableOpacity
                        style={[styles.locTickBtn, (!newLocation.city?.trim() || savingLocation) && styles.locTickBtnDisabled]}
                        onPress={confirmCityStep}
                        disabled={savingLocation || !newLocation.city?.trim()}
                        accessibilityLabel="Continue"
                      >
                        <Icon name="check" size={16} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.locSlide, sliderWidth > 0 && { width: sliderWidth }]}>
                    <TouchableOpacity
                      style={styles.locBackBtn}
                      onPress={goBackToCityStep}
                      disabled={savingLocation}
                    >
                      <Text style={styles.locBackBtnText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.locQuestion}>What is the district?</Text>
                    <View style={styles.locDistrictWrap}>
                      <View style={styles.locFieldRow}>
                        <TextInput
                          style={styles.locFieldInput}
                          placeholder="Search district..."
                          placeholderTextColor={COLORS.textMuted}
                          value={districtSearch}
                          onChangeText={handleDistrictSearchChange}
                          editable={!savingLocation}
                        />
                        <TouchableOpacity
                          style={[styles.locTickBtn, (!newLocation.district || savingLocation) && styles.locTickBtnDisabled]}
                          onPress={saveNewLocation}
                          disabled={savingLocation || !newLocation.district}
                          accessibilityLabel="Add location"
                        >
                          {savingLocation
                            ? <ActivityIndicator color={COLORS.white} size="small" />
                            : <Icon name="check" size={16} color={COLORS.white} />
                          }
                        </TouchableOpacity>
                      </View>
                      {showDistrictList && (
                        <View style={[styles.dropdown, styles.locDistrictDropdown]}>
                          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 168 }}>
                            {filteredDistricts.map(d => (
                              <TouchableOpacity
                                key={d}
                                style={styles.dropdownItem}
                                onPress={() => pickDistrict(d)}
                              >
                                <Text style={styles.dropdownText}>{d}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                </Animated.View>
              </View>
            </View>
          )}
          {/* Description */}
          <Text style={styles.label}>
            Description * <Text style={{ color: charCount < 150 ? COLORS.error : COLORS.success }}>({charCount}/150 min)</Text>
          </Text>
          <AiTextArea
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            category={categories.find(c => c.id === selectedCategory)?.name}
            subcategory={selectedSubCategory}
            title={form.title}
            price={form.price}
            location={selectedLocation?.name || locationSearch}
            onFocus={() => {
              setTimeout(() => {
                scrollRef.current?.scrollTo({ y: 1000, animated: true });
              }, 300);
            }}
          />
          <View style={{ height: 10 }} />
          {/* Images */}
          <Text style={styles.label}>Images (optional)</Text>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImages}>
            <Icon name="camera" size={18} color={COLORS.primary} />
            <Text style={styles.imagePickerText}>
              {images.length > 0 ? `${images.length} image(s) selected` : 'Add Photos'}
            </Text>
          </TouchableOpacity>
          <View style={{ height: 30 }} />
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewRow}>
              {images.map((img, idx) => (
                <View key={idx} style={styles.imagePreviewWrap}>
                  <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImg}
                    onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                  >
                    <Icon name="x" size={12} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <View style={{ height: 50 }} />
          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handlePost}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.submitText}>{editingAd ? 'Save Changes' : 'Post Ad'}</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

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
  },
  headerTitle: { color: COLORS.white, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  scroll: { padding: 16 },
  loginWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff0f0',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  loginWarningText: { color: COLORS.error, fontSize: 13 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: { minHeight: 110, lineHeight: 22 },
  pillRow: { marginBottom: 4 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillSub: { backgroundColor: '#f0f4ff', borderColor: '#c7d4f0' },
  pillSubActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  pillText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  pillTextActive: { color: COLORS.white },
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 180,
    marginTop: -1,
    ...SHADOW.small,
    zIndex: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownText: { fontSize: 14, color: COLORS.text },
  dropdownAddItem: { backgroundColor: '#f0f6ff', borderBottomWidth: 0 },
  dropdownAddText: { fontSize: 14, color: COLORS.primary, fontWeight: '700', flex: 1 },
  locCard: {
    marginTop: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#eef2f7',
    overflow: 'hidden',
    ...SHADOW.small,
  },
  locCardDropdownOpen: {
    overflow: 'visible',
    zIndex: 50,
    elevation: 12,
  },
  locAccent: {
    height: 3,
    backgroundColor: COLORS.primary,
  },
  locTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  locTopLeft: { flex: 1 },
  locEyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.2,
    textTransform: 'capitalize',
  },
  locBreadcrumbSep: { color: '#cbd5e1', fontWeight: '400', textTransform: 'none' },
  locBreadcrumbCity: { color: COLORS.primary, fontWeight: '600', textTransform: 'none' },
  locDots: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  locDot: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.full,
    backgroundColor: '#e2e8f0',
  },
  locDotActive: { width: 18, backgroundColor: COLORS.primary },
  locDotDone: { backgroundColor: COLORS.primary, opacity: 0.35 },
  locClose: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locSlider: {
    overflow: 'hidden',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  locSliderDropdownOpen: {
    overflow: 'visible',
  },
  locSlide: { flex: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 22, overflow: 'visible' },
  locQuestion: { fontSize: 16, fontWeight: '600', color: COLORS.text, letterSpacing: -0.3, marginBottom: 12 },
  locBackBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  locBackBtnText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  locFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#eef2f7',
    borderRadius: 12,
  },
  locDistrictWrap: { marginBottom: 4, zIndex: 20 },
  locDistrictDropdown: { marginTop: 6, zIndex: 300, elevation: 8 },
  locFieldInput: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 0,
    fontSize: 15,
    color: COLORS.text,
  },
  locTickBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
  },
  locTickBtnDisabled: { opacity: 0.3 },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  imagePickerText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  imagePreviewRow: { marginTop: 10, marginBottom: 4 },
  imagePreviewWrap: { marginRight: 8, position: 'relative' },
  imagePreview: { width: 80, height: 80, borderRadius: RADIUS.md },
  removeImg: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    padding: 3,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
