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
import { COLORS } from '../utils/theme';
import { useMessages } from '../context/MessagesContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
      <Stack.Screen name="Chat" component={ChatScreen} />
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
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home',
            Chat: 'message-circle',
            Post: 'plus-circle',
            MyAds: 'speaker',
            Profile: 'user',
          };
          return <Icon name={icons[route.name]} size={size} color={color} />;
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
      />
      <Tab.Screen
        name="Post"
        component={PostAdScreen}
        options={{ tabBarLabel: 'Post Ad' }}
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
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
