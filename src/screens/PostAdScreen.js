// src/screens/PostAdScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from '../components/Icon';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch, API_BASE_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AiTextArea from '../components/AiTextArea';
import { checkAndPromptNotifications } from '../utils/notifications';

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
    fetch('https://api.countrystatecity.in/v1/countries/IN/states/KL/cities', {
      headers: { 'X-CSCAPI-KEY': 'NTJPRVA2dFdZTWl6ZUhCSXRzVmdWem5BRk1tdE1VbE5KUlBubGVPQg==' },
    }).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setLocations(data.map(c => ({ id: c.id, name: c.name })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const cat = categories.find(c => c.id === selectedCategory);
    setSubCategories(cat?.subCategories || []);
  }, [selectedCategory, categories]);

  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(locationSearch.toLowerCase())
  ).slice(0, 20);

  const pickImages = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 5, includeBase64: false }, res => {
      if (res.assets) {
        setImages(res.assets);
      }
    });
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
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
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
