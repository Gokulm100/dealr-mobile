// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from '../components/Icon';

import HomeScreen from '../screens/HomeScreen';
import AdDetailScreen from '../screens/AdDetailScreen';
import PostAdScreen from '../screens/PostAdScreen';
import MyAdsScreen from '../screens/MyAdsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AboutScreen from '../screens/AboutScreen';
import ContactScreen from '../screens/ContactScreen';
import ConsentScreen from '../screens/ConsentScreen';
import SellerProfileScreen from '../screens/SellerProfileScreen';
import { COLORS } from '../utils/theme';
import { useMessages } from '../context/MessagesContext';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from '../utils/navigation';
import { Alert, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

// G-03: deep / universal links. Opens dealrapp.in/ad/:id and dealr://ad/:id
// straight to the listing (AdDetailScreen fetches by id when no listing object
// is passed). Full Android App Link auto-verification also needs an
// assetlinks.json hosted at https://dealrapp.in/.well-known/ (web/hosting step).
const linking = {
  prefixes: ['dealr://', 'https://dealrapp.in', 'https://www.dealrapp.in'],
  config: {
    screens: {
      AdDetail: 'ad/:id',
      SellerProfile: 'seller/:id',
      MainTabs: {
        screens: {
          Home: { screens: { AllAds: 'home' } },
        },
      },
    },
  },
};

// Stack for Home tab (Home → Ad Detail)
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AllAds" component={HomeScreen} />
      <Stack.Screen name="AdDetail" component={AdDetailScreen} />
    </Stack.Navigator>
  );
}

// Stack for Messages tab (Messages list → Chat)
function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MessagesList" component={MessagesScreen} />
      <Stack.Screen name="ChatDetail" component={ChatScreen} />
    </Stack.Navigator>
  );
}

// Stack for MyAds tab
function MyAdsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyAdsList" component={MyAdsScreen} />
      <Stack.Screen name="AdDetail" component={AdDetailScreen} />
    </Stack.Navigator>
  );
}

// Stack for Profile tab
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  const { messageCount } = useMessages();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primaryDark,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          borderTopColor: 'rgba(226, 232, 240, 0.95)',
          height: 62 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: -0.1,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home',
            Chat: 'message-circle',
            MyAds: 'speaker',
            Profile: 'user',
          };

          if (route.name === 'Post') {
            return (
              <View style={styles.postButton}>
                <Icon name="plus" size={32} color={COLORS.white} />
              </View>
            );
          }

          return <Icon name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Home', { screen: 'AllAds' });
          },
        })}
      />
      <Tab.Screen
        name="Chat"
        component={MessagesStack}
        options={{
          tabBarBadge: messageCount > 0 ? messageCount : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.badgeBg },
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (user?.isBlocked) {
              e.preventDefault();
              Alert.alert(
                "Account Blocked",
                "You have been blocked due to repeated suspicious activity. Please wait for another 30 days to access messages.",
                [{ text: "OK" }]
              );
            } else {
              e.preventDefault();
              navigation.navigate('Chat', { screen: 'MessagesList' });
            }
          },
        })}
      />
      <Tab.Screen
        name="Post"
        component={PostAdScreen}
        options={{
          tabBarLabel: ' ',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          }
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (user?.isBlocked) {
              e.preventDefault();
              Alert.alert(
                "Account Blocked",
                "You have been blocked due to repeated suspicious activity. Please wait for another 30 days to post any new ads.",
                [{ text: "OK" }]
              );
            } else {
              // Prevent default and force navigation with empty params
              e.preventDefault();
              navigation.navigate('Post', { ad: undefined });
            }
          },
        })}
      />
      <Tab.Screen
        name="MyAds"
        component={MyAdsStack}
        options={{ tabBarLabel: 'My Ads' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('MyAds', { screen: 'MyAdsList' });
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Profile', { screen: 'ProfileMain' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  postButton: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -4,
    elevation: 8,
    shadowColor: '#1e4fd6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
});

export default function AppNavigator() {
  const { user, hasConsented, loading } = useAuth();

  if (loading) return null;

  // Key change forces a total remount.
  // We strictly control what routes exist based on user status.
  const navKey = user ? (hasConsented ? 'app-consented' : 'app-needs-consent') : 'guest';

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <RootStack.Navigator
        key={navKey}
        screenOptions={{ headerShown: false }}
        initialRouteName={user && !hasConsented ? "ConsentGuard" : "MainTabs"}
      >
        {!user ? (
          // 1. GUEST: Only main tabs available
          <>
            <RootStack.Screen name="MainTabs" component={TabNavigator} />
            <RootStack.Screen name="SellerProfile" component={SellerProfileScreen} />
            <RootStack.Screen name="AdDetail" component={AdDetailScreen} />
            <RootStack.Screen name="Consent" component={ConsentScreen} />
          </>
        ) : !hasConsented ? (
          // 2. LOGGED IN, NO CONSENT: Lock to Consent screen ONLY
          // We use "ConsentGuard" name here to avoid React Navigation trying to
          // preserve the screen when we transition to the main app.
          <RootStack.Screen name="ConsentGuard" component={ConsentScreen} />
        ) : (
          // 3. LOGGED IN, CONSENTED: Full access
          <>
            <RootStack.Screen name="MainTabs" component={TabNavigator} />
            <RootStack.Screen name="Consent" component={ConsentScreen} />
            <RootStack.Screen name="SellerProfile" component={SellerProfileScreen} />
            <RootStack.Screen name="AdDetail" component={AdDetailScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
