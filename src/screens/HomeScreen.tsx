import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from "react-native";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { scrapeWithGemini } from '../services/scraper'; // YENİ YAZDIĞIMIZ SERVİSİ İÇERİ ALIYORUZ

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  // Arama Formu State'leri
  const [product, setProduct] = useState("");
  const [country, setCountry] = useState("Türkiye");
  const [city, setCity] = useState("");
  const [companyCount, setCompanyCount] = useState("5"); // Varsayılanı 5 yaptık

  // Dinamik Kullanıcı State'leri
  const [userName, setUserName] = useState("Gezgin");
  const [credits, setCredits] = useState(0);

  // Butona basıldığında dönecek olan yüklenme animasyonu durumu
  const [isSearching, setIsSearching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch('http://localhost:5210/api/Auth/me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits); 
        const firstName = data.fullName ? data.fullName.split(' ')[0] : "Gezgin";
        setUserName(firstName); 
      }
    } catch (error) {
      console.log("Kullanıcı verisi çekilemedi:", error);
    }
  };

  // ======================================================
  // İŞTE SİHİRLİ DOKUNUŞ: GERÇEK ARAMA FONKSİYONU 🤖
  // ======================================================
  const handleSearch = async () => {
    if (!product || !city) {
      Alert.alert("Uyarı", "Lütfen 'Ne satıyorsunuz?' ve 'Hedef Şehir' alanlarını doldurun.");
      return;
    }

    // Butonu pasif hale getir ve yükleme çarkını döndür
    setIsSearching(true);

    try {
      // 1. scraper.ts içindeki metodumuzu çağırıp arka plana istek atıyoruz
      const maxResults = parseInt(companyCount) || 5;
      const data = await scrapeWithGemini(product, city, country, maxResults);

      // 2. İşlem başarılıysa krediyi güncelle
      fetchUserData();

      // 3. Kullanıcıyı ve GELEN VERİLERİ Sonuçlar sayfasına gönder
      navigation.navigate("Sonuçlar" as any, { 
        businesses: data.businesses,
        message: data.message,
        jobId: data.jobId
      } as any);

    } catch (error: any) {
      // 402 Yetersiz Kredi veya 500 Sunucu hataları buraya düşer
      Alert.alert("Arama Başarısız", error.message || "Beklenmeyen bir hata oluştu.");
    } finally {
      // İşlem bitince yükleme çarkını durdur
      setIsSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require("../assets/logo3.png")} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>FGS Trade</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.creditsButton}>
            <Text style={styles.creditsIcon}>⚡</Text>
            <Text style={styles.creditsText}>{credits} Kredi</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Merhaba, {userName} 👋</Text>
          <Text style={styles.greetingSubtitle}>Bugün hangi pazarı keşfetmek istiyorsun?</Text>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchHeader}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchTitle}>Hedef Pazar Araması</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ne satıyorsunuz? (Ürün İsmi) *</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🏷️</Text>
              <TextInput style={styles.input} placeholder="Örn: mobilya, tekstil..." placeholderTextColor="#9CA3AF" value={product} onChangeText={setProduct} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hedef Ülke</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🌍</Text>
              <TextInput style={styles.input} placeholder="Türkiye" placeholderTextColor="#9CA3AF" value={country} onChangeText={setCountry} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hedef Şehir *</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🏙️</Text>
              <TextInput style={styles.input} placeholder="Örn: Samsun, Berlin..." placeholderTextColor="#9CA3AF" value={city} onChangeText={setCity} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kaç Firma Aranacak?</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🏢</Text>
              <TextInput style={styles.input} placeholder="5" placeholderTextColor="#9CA3AF" value={companyCount} onChangeText={setCompanyCount} keyboardType="number-pad" />
            </View>
            <Text style={styles.helperText}>En az 1, en fazla 1000 firma</Text>
          </View>

          <TouchableOpacity 
            style={[styles.searchButton, isSearching && { opacity: 0.7 }]} 
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.searchButtonIcon}>🔍</Text>
                <Text style={styles.searchButtonText}>Firma Ara</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Tasarım Stilleri (Senin tasarladığın gibi)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2FE" }, header: { backgroundColor: "#2563EB", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, paddingTop: 50 }, headerLeft: { flexDirection: "row", alignItems: "center" }, headerLogo: { width: 36, height: 36, marginRight: 12 }, headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" }, headerRight: { flexDirection: "row", alignItems: "center", gap: 12 }, creditsButton: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.2)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 }, creditsIcon: { fontSize: 16 }, creditsText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" }, content: { flex: 1 }, greetingSection: { padding: 24, paddingBottom: 16 }, greetingTitle: { fontSize: 28, fontWeight: "700", color: "#1E293B", marginBottom: 8 }, greetingSubtitle: { fontSize: 15, color: "#64748B" }, searchCard: { backgroundColor: "#FFFFFF", marginHorizontal: 20, marginBottom: 20, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }, searchHeader: { flexDirection: "row", alignItems: "center", marginBottom: 24 }, searchIcon: { fontSize: 24, marginRight: 12 }, searchTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" }, inputGroup: { marginBottom: 20 }, label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }, inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB", paddingHorizontal: 16, height: 52 }, inputIcon: { marginRight: 12, fontSize: 18 }, input: { flex: 1, fontSize: 15, color: "#111827" }, helperText: { fontSize: 12, color: "#6B7280", marginTop: 6 }, searchButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#2563EB", borderRadius: 12, height: 52, gap: 8, marginTop: 8, shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }, searchButtonIcon: { fontSize: 18 }, searchButtonText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" }
});