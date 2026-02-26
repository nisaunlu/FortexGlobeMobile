import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Sayfaları import ediyoruz
import HomeScreen from '../screens/HomeScreen';
import ResultsScreen from '../screens/ResultsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Alt çubuktaki ikonları belirliyoruz (Şimdilik Emoji kullanıyoruz)
        tabBarIcon: ({ focused }) => {
          let icon = '';
          if (route.name === 'Ara') icon = '🔍';
          else if (route.name === 'Sonuçlar') icon = '📋';
          else if (route.name === 'Geçmiş') icon = '⏳';
          else if (route.name === 'Profil') icon = '👤';
          
          // Seçili olan tab daha net görünür
          return (
            <Text style={{ fontSize: 26, opacity: focused ? 1 : 0.4 }}>
              {icon}
            </Text>
          );
        },
        tabBarActiveTintColor: '#2563EB', // FGS Trade Mavi Rengi
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // HomeScreen'in kendi üst barı (header) olduğu için bunu kapatıyoruz
        tabBarStyle: { 
          height: 90, // 70'ten 90'a yükseltildi
          paddingBottom: 25, // 10'dan 25'e yükseltildi (iPhone home indicator için)
          paddingTop: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB'
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5, // Etiketi biraz daha yukarı çek
        },
      })}
    >
      {/* 4 Ana Sekme */}
      <Tab.Screen name="Ara" component={HomeScreen} />
      <Tab.Screen name="Sonuçlar" component={ResultsScreen} />
      <Tab.Screen name="Geçmiş" component={HistoryScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}