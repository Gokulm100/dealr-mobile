// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from '../screens/../components/Icon';

import HomeScreen from '../screens/HomeScreen';
import AdDetailScreen from '../screens/AdDetailScreen';
import PostAdScreen from '../screens/PostAdScreen';
import MyAdsScreen from '../screens/MyAdsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ConsentScreen from '../screens/ConsentScreen';
import { COLORS } from '../utils/theme';
import { useMessages } from '../context/MessagesContext';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from '../utils/navigation';
import { Alert } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

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

function TabNavigator() {
  const { messageCount } = useMessages();
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Home: 'home',
            Chat: 'message-circle',
            Post: 'plus-circle',
            MyAds: 'speaker',
            Profile: 'user',
          };
          const iconColor = route.name === 'Post' ? (focused ? '#ff6666' : COLORS.textMuted) : color;
          return <Icon name={icons[route.name]} size={size} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
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
            }
          },
        })}
      />
      <Tab.Screen
        name="Post"
        component={PostAdScreen}
        options={{ tabBarLabel: 'Post Ad' }}
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
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, hasConsented, loading } = useAuth();

  if (loading) return null;

  // Key change forces a total remount.
  // We strictly control what routes exist based on user status.
  const navKey = user ? (hasConsented ? 'app-consented' : 'app-needs-consent') : 'guest';

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator
        key={navKey}
        screenOptions={{ headerShown: false }}
        initialRouteName={user && !hasConsented ? "ConsentGuard" : "MainTabs"}
      >
        {!user ? (
          // 1. GUEST: Only main tabs available
          <RootStack.Screen name="MainTabs" component={TabNavigator} />
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
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
