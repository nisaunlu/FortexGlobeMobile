import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Ekranları Import Et
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import TabNavigator from './src/navigation/TabNavigator'; // YENİ EKLENDİ

// Tip tanımlamaları (TabNavigator'ı Home olarak tanımlıyoruz)
export type RootStackParamList = {
  Login: undefined;
  Register: { rememberMe?: boolean; email?: string } | undefined;
  Home: undefined; // Artık Home, tek bir ekran değil, TabNavigator'ın kendisi!
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Giriş ve Kayıt Ekranları */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* ANA UYGULAMA (Alt Sekmeler) */}
        <Stack.Screen 
          name="Home" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}