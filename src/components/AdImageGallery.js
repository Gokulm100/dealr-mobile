import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const THUMB_SIZE = 52;

export default function AdImageGallery({ images = [], onBack }) {
  const insets = useSafeAreaInsets();
  const galleryHeight = SCREEN_WIDTH + insets.top;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const carouselRef = useRef(null);
  const fullscreenRef = useRef(null);
  const thumbRef = useRef(null);

  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;

  const scrollToIndex = useCallback((index, animated = true) => {
    const x = index * SCREEN_WIDTH;
    carouselRef.current?.scrollTo({ x, animated });
    fullscreenRef.current?.scrollTo({ x, animated });
    setCurrentIndex(index);

    if (thumbRef.current && hasMultiple) {
      const thumbOffset = Math.max(0, index * (THUMB_SIZE + 8) - SCREEN_WIDTH / 2 + THUMB_SIZE);
      thumbRef.current.scrollTo({ x: thumbOffset, animated });
    }
  }, [hasMultiple]);

  const handleCarouselScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      if (thumbRef.current && hasMultiple) {
        const thumbOffset = Math.max(0, index * (THUMB_SIZE + 8) - SCREEN_WIDTH / 2 + THUMB_SIZE);
        thumbRef.current.scrollTo({ x: thumbOffset, animated: true });
      }
    }
  };

  const openFullscreen = (index = currentIndex) => {
    setFullscreen(true);
    requestAnimationFrame(() => {
      fullscreenRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: false });
    });
  };

  const heroImageStyle = {
    width: SCREEN_WIDTH,
    height: galleryHeight,
  };

  if (!hasImages) {
    return (
      <View style={[styles.gallery, styles.emptyGallery, { height: galleryHeight }]}>
        <View style={[styles.galleryControls, { paddingTop: insets.top + 8 }]}>
          {onBack && (
            <TouchableOpacity style={styles.backBtnLight} onPress={onBack} activeOpacity={0.8}>
              <Icon name="arrow-left" size={20} color={COLORS.text} />
            </TouchableOpacity>
          )}
        </View>
        <Icon name="image" size={40} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>No photos</Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.gallery, { height: galleryHeight }]}>
        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleCarouselScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
        >
          {images.map((uri, index) => (
            <TouchableOpacity
              key={`${uri}-${index}`}
              activeOpacity={0.95}
              onPress={() => openFullscreen(index)}
              style={{ width: SCREEN_WIDTH }}
            >
              <Image source={{ uri }} style={heroImageStyle} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.topScrim} pointerEvents="none" />
        <View style={[styles.bottomScrim, { height: hasMultiple ? 110 : 72 }]} pointerEvents="none" />

        <View style={[styles.galleryControls, { paddingTop: insets.top + 8 }]}>
          {onBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
              <Icon name="arrow-left" size={20} color={COLORS.text} />
            </TouchableOpacity>
          )}

          <View style={styles.controlsRight}>
            {hasMultiple && (
              <View style={styles.counterPill}>
                <Text style={styles.counterText}>
                  {currentIndex + 1}/{images.length}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.expandBtn}
              onPress={() => openFullscreen()}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="image" size={15} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {hasMultiple && (
          <ScrollView
            ref={thumbRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbStrip}
            style={styles.thumbScroll}
          >
            {images.map((uri, index) => (
              <TouchableOpacity
                key={`thumb-${index}`}
                onPress={() => scrollToIndex(index)}
                activeOpacity={0.9}
                style={[
                  styles.thumbWrap,
                  currentIndex === index && styles.thumbWrapActive,
                ]}
              >
                <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <Modal
        visible={fullscreen}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          setFullscreen(false);
          scrollToIndex(currentIndex, false);
        }}
      >
        <View style={styles.fullscreen}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <ScrollView
            ref={fullscreenRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleCarouselScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
          >
            {images.map((uri, index) => (
              <View key={`fs-${index}`} style={styles.fullscreenPage}>
                <Image source={{ uri }} style={styles.fullscreenImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>

          <View style={[styles.fullscreenBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setFullscreen(false);
                scrollToIndex(currentIndex, false);
              }}
              activeOpacity={0.85}
            >
              <Icon name="x" size={20} color={COLORS.white} />
            </TouchableOpacity>
            {hasMultiple && (
              <Text style={styles.fullscreenCounterText}>
                {currentIndex + 1} / {images.length}
              </Text>
            )}
            <View style={styles.barSpacer} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  gallery: {
    backgroundColor: '#111',
    position: 'relative',
    overflow: 'hidden',
  },
  emptyGallery: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  galleryControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
  },
  backBtnLight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  counterPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  counterText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  expandBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbScroll: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    maxHeight: THUMB_SIZE + 12,
  },
  thumbStrip: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    opacity: 0.55,
    transform: [{ scale: 0.92 }],
  },
  thumbWrapActive: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  fullscreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenPage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullscreenBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barSpacer: {
    width: 40,
  },
  fullscreenCounterText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    fontWeight: '600',
  },
});
