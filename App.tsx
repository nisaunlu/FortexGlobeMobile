import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
// Dil Sağlayıcısını Import Et
import { LanguageProvider } from './src/i18n/LanguageContext';

// Ekranları Import Et
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import TabNavigator from './src/navigation/TabNavigator';

GoogleSignin.configure({
  webClientId: '409416631532-mu8gjhj2cv08mvuriqonb714av36crcg.apps.googleusercontent.com', // Arkadaşının sana verdiği ID
  iosClientId: '409416631532-6th92q990j5uflf3mrepdhdg5c8diegf.apps.googleusercontent.com', // iOS'ta çalışması için şarttır!
});
// Tip tanımlamaları
export type RootStackParamList = {
  Login: undefined;
  Register: { rememberMe?: boolean; email?: string } | undefined;
  Home: undefined; // Artık Home, tek bir ekran değil, TabNavigator'ın kendisi!
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    // İŞTE SİHİR BURADA: Tüm uygulamayı tek bir çatı altında sarmaladık!
    <LanguageProvider> 
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
    </LanguageProvider>
  );
}