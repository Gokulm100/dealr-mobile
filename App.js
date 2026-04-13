// App.js
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { MessagesProvider } from './src/context/MessagesContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MessagesProvider>
          <AppNavigator />
        </MessagesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
