import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getExcelDownloadUrl } from '../services/scraper'; // Servisimizi içeri aldık

export default function ResultsScreen() {
  const route = useRoute();
  // HomeScreen'den gelen verileri alıyoruz (jobId'yi de ekledik)
  const { businesses, message, jobId } = (route.params as any) || { businesses: [], message: "", jobId: null };

  // Web sitesine gitme fonksiyonu
  const handleOpenLink = (url: string) => {
    if (url) Linking.openURL(url).catch(() => Alert.alert("Hata", "Link açılamadı"));
  };

  // EXCEL İNDİRME FONKSİYONU 📊
  const handleDownloadExcel = async () => {
    if (!jobId) {
      Alert.alert("Hata", "Bu aramanın kimliği (ID) bulunamadı. Lütfen aramayı tekrarlayın.");
      return;
    }

    try {
      // scraper.ts'deki fonksiyonumuzdan token eklenmiş güvenli indirme linkini alıyoruz
      const downloadUrl = await getExcelDownloadUrl(jobId);
      
      // Telefonun tarayıcısını açıp otomatik indirmeyi başlatıyoruz
      Linking.openURL(downloadUrl).catch(() => {
        Alert.alert("Hata", "Tarayıcı açılamadı veya indirme başlatılamadı.");
      });
    } catch (error) {
      console.log("Excel İndirme Hatası:", error); // <-- ESLint artık mutlu!
      Alert.alert("Hata", "Excel indirme linki oluşturulamadı.");
    }
  };

  if (!businesses || businesses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>Henüz Sonuç Yok</Text>
        <Text style={styles.emptyDesc}>Lütfen "Ara" sekmesinden yeni bir scraping işlemi başlatın.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>📋 Arama Sonuçları</Text>
          <Text style={styles.subtitle}>{message}</Text>
        </View>
        
        {/* YENİ EXCEL BUTONU */}
        <TouchableOpacity style={styles.excelButton} onPress={handleDownloadExcel}>
          <Text style={styles.excelButtonIcon}>📥</Text>
          <Text style={styles.excelButtonText}>Excel</Text>
        </TouchableOpacity>
      </View>

      {businesses.map((item: any, index: number) => (
        <View key={index} style={styles.card}>
          <Text style={styles.businessName}>{item.businessName}</Text>
          <Text style={styles.cityText}>📍 {item.city || "Belirtilmemiş"}</Text>
          
          <View style={styles.contactRow}>
            {item.phone ? <Text style={styles.contactText}>📞 {item.phone}</Text> : null}
            {item.email ? <Text style={styles.contactText}>✉️ {item.email}</Text> : null}
          </View>

          {item.website ? (
            <TouchableOpacity style={styles.webButton} onPress={() => handleOpenLink(item.website)}>
              <Text style={styles.webButtonText}>Web Sitesine Git</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  
  // Header kısmını yan yana dizmek için güncelledik
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 30 },
  headerTextContainer: { flex: 1, paddingRight: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E40AF', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#10B981', fontWeight: '600' },
  
  // Excel Butonu Stili
  excelButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  excelButtonIcon: { fontSize: 18, marginRight: 6 },
  excelButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  businessName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  cityText: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  contactRow: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 12, gap: 8 },
  contactText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  webButton: { backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  webButtonText: { color: '#2563EB', fontWeight: '600', fontSize: 14 }
});