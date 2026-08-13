import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from './Icon';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

export const FEATURE_BANNER_HEIGHT = 148;

const SLIDES = [
  {
    id: 'ai-post',
    image: require('../../assets/banners/banner-ai-post.jpg'),
    kicker: 'Gemini AI',
    title: 'Post an ad in seconds',
    subtitle: 'Snap photos — AI writes the title and description.',
    cta: 'Post an ad',
    tab: 'Post',
  },
  {
    id: 'ai-analytics',
    image: require('../../assets/banners/banner-ai-analytics.jpg'),
    kicker: 'For sellers',
    title: 'AI analytics that close deals',
    subtitle: 'Views, interest, and pricing insights on every listing.',
    cta: 'My ads',
    tab: 'MyAds',
  },
  {
    id: 'free',
    image: require('../../assets/banners/banner-free.jpg'),
    kicker: 'Always free',
    title: 'List for free. Always.',
    subtitle: 'No posting fees. No hidden charges.',
    cta: 'Start listing',
    tab: 'Post',
  },
  {
    id: 'local',
    image: require('../../assets/banners/banner-local.jpg'),
    kicker: 'Neighbourhood first',
    title: 'Deal with people nearby',
    subtitle: 'Chat in-app, meet locally, buy with confidence.',
    cta: 'Open chat',
    tab: 'Chat',
  },
];

const AUTO_MS = 4500;

export default function FeatureBannerCarousel({ onNavigate }) {
  const scrollRef = useRef(null);
  const indexRef = useRef(0);
  const pausedRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setPageWidth(window.width);
    });
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: indexRef.current * pageWidth, animated: false });
  }, [pageWidth]);

  const goTo = useCallback((next, animated = true) => {
    const clamped = ((next % SLIDES.length) + SLIDES.length) % SLIDES.length;
    indexRef.current = clamped;
    setIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * pageWidth, animated });
  }, [pageWidth]);

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      goTo(indexRef.current + 1);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [goTo]);

  const onMomentumScrollEnd = (event) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (next >= 0 && next < SLIDES.length && next !== indexRef.current) {
      indexRef.current = next;
      setIndex(next);
    }
  };

  const handlePress = (slide) => {
    if (!slide.tab || !onNavigate) return;
    onNavigate(slide.tab);
  };

  return (
    <View style={styles.wrap} accessibilityRole="adjustable">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => { pausedRef.current = true; }}
        onScrollEndDrag={() => { pausedRef.current = false; }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {SLIDES.map((slide) => (
          <TouchableOpacity
            key={slide.id}
            activeOpacity={0.92}
            onPress={() => handlePress(slide)}
            style={[styles.page, { width: pageWidth }]}
            accessibilityRole="button"
            accessibilityLabel={`${slide.title}. ${slide.subtitle}`}
          >
            <ImageBackground
              source={slide.image}
              style={styles.card}
              imageStyle={styles.cardImage}
              resizeMode="cover"
              fadeDuration={0}
            >
              <View style={styles.scrim} pointerEvents="none" />
              <View style={styles.copy}>
                <Text style={styles.kicker}>{slide.kicker}</Text>
                <Text style={styles.title} numberOfLines={2}>{slide.title}</Text>
                <Text style={styles.subtitle} numberOfLines={2}>{slide.subtitle}</Text>
                {slide.cta ? (
                  <View style={styles.cta}>
                    <Text style={styles.ctaText}>{slide.cta}</Text>
                    <Icon name="chevron-right" size={12} color={COLORS.white} />
                  </View>
                ) : null}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.dots} pointerEvents="none">
        {SLIDES.map((slide, i) => (
          <View
            key={slide.id}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 4,
  },
  page: {
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    height: FEATURE_BANNER_HEIGHT,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryDark,
    ...SHADOW.medium,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.lg,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '52%',
    backgroundColor: 'rgba(12, 24, 56, 0.28)',
  },
  copy: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    maxWidth: '58%',
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.82)',
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
    lineHeight: 20,
    marginBottom: 4,
    textShadowColor: 'rgba(15, 23, 42, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 15,
  },
  cta: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.borderStrong,
  },
  dotActive: {
    width: 16,
    backgroundColor: COLORS.primary,
  },
});
