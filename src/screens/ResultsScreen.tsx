import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getExcelDownloadUrl } from '../services/scraper';

export default function ResultsScreen() {
  const route = useRoute();
  
  // HomeScreen'den gelen verileri alıyoruz
  const { businesses, jobId } = (route.params as any) || { businesses: [], jobId: null };

  // Web sitesine veya maile gitme fonksiyonu
  const handleOpenLink = (url: string, type: 'web' | 'email' = 'web') => {
    if (!url || url === 'Not Found') return;
    
    let finalUrl = url;
    if (type === 'web' && !url.startsWith('http')) finalUrl = `https://${url}`;
    if (type === 'email' && !url.startsWith('mailto:')) finalUrl = `mailto:${url}`;

    Linking.openURL(finalUrl).catch(() => Alert.alert("Hata", "Link açılamadı"));
  };

  // EXCEL İNDİRME FONKSİYONU 📊
  const handleDownloadExcel = async () => {
    if (!jobId) {
      Alert.alert("Hata", "Bu aramanın kimliği (ID) bulunamadı. Lütfen aramayı tekrarlayın.");
      return;
    }

    try {
      const downloadUrl = await getExcelDownloadUrl(jobId);
      Linking.openURL(downloadUrl).catch(() => {
        Alert.alert("Hata", "Tarayıcı açılamadı veya indirme başlatılamadı.");
      });
    } catch (error) {
      console.log("Excel İndirme Hatası:", error);
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

  // Ekranda gösterilecek tablo kolonları
  const renderCell = (content: string, width: number, isLink: boolean = false, linkType: 'web' | 'email' = 'web') => {
    const isEmpty = !content || content === 'Not Found' || content === '';
    const displayContent = isEmpty ? 'Not Found' : content;

    return (
      <View style={[styles.cell, { width }]}>
        {isLink && !isEmpty ? (
          <TouchableOpacity onPress={() => handleOpenLink(content, linkType)}>
            <Text style={styles.linkText} numberOfLines={2}>{displayContent}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.cellText, isEmpty && styles.emptyText]} numberOfLines={3}>
            {displayContent}
          </Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* --- ÜST BİLGİ VE BUTONLAR --- */}
      <View style={styles.headerArea}>
        {/* Başlık */}
        <View style={styles.titleRow}>
          <Text style={styles.checkIcon}>✅</Text>
          <Text style={styles.titleText}>
            {businesses.length} Firma Bulundu!
          </Text>
        </View>

        {/* Kredi Rozeti */}
        <View style={styles.badgeWrapper}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1 kredi kullanıldı</Text>
          </View>
        </View>

        {/* Aksiyon Butonu (Sadece Excel Kaldı) */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.excelButton} onPress={handleDownloadExcel}>
            <Text style={styles.buttonIcon}>📥</Text>
            <Text style={styles.excelButtonText}>Excel'e Aktar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- YATAY KAYDIRILABİLİR TABLO ALANI --- */}
      <View style={styles.tableCardWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} bounces={false}>
          <View style={styles.tableInner}>
            {/* Tablo Başlığı (Header) */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: 180 }]}>Company Name</Text>
              <Text style={[styles.tableHeaderCell, { width: 220 }]}>Address</Text>
              <Text style={[styles.tableHeaderCell, { width: 160 }]}>Website</Text>
              <Text style={[styles.tableHeaderCell, { width: 160 }]}>Email</Text>
              <Text style={[styles.tableHeaderCell, { width: 130 }]}>Phone</Text>
              <Text style={[styles.tableHeaderCell, { width: 130 }]}>Mobile</Text>
              <Text style={[styles.tableHeaderCell, { width: 100 }]}>City</Text>
              <Text style={[styles.tableHeaderCell, { width: 100 }]}>Country</Text>
            </View>

            {/* Tablo Satırları (Data Rows) */}
            {businesses.map((item: any, index: number) => (
              <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                
                {/* Company Name (Mavi ve Kalın) */}
                <View style={[styles.cell, { width: 180 }]}>
                  <Text style={styles.companyNameText} numberOfLines={3}>
                    {item.businessName || 'Not Found'}
                  </Text>
                </View>

                {/* Address */}
                {renderCell(item.address, 220)}

                {/* Website */}
                {renderCell(item.website, 160, true, 'web')}

                {/* Email */}
                {renderCell(item.email, 160, true, 'email')}

                {/* Phone & Mobile */}
                {renderCell(item.phone, 130)}
                {renderCell(item.mobile, 130)}

                {/* City & Country */}
                {renderCell(item.city, 100)}
                {renderCell(item.country || 'Turkey', 100)}

              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Genel
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  // Üst Alan
  headerArea: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkIcon: { fontSize: 28, marginRight: 8 },
  titleText: { fontSize: 24, fontWeight: '800', color: '#1E3A8A' },

  badgeWrapper: { flexDirection: 'row', marginBottom: 20 },
  badge: { backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#065F46', fontWeight: '700', fontSize: 13 },

  // Butonlar
  buttonContainer: { marginBottom: 10 },
  buttonIcon: { fontSize: 18, marginRight: 8 },
  
  excelButton: { flexDirection: 'row', backgroundColor: '#22C55E', paddingVertical: 14, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  excelButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Tablo Stilleri
  tableCardWrapper: { 
    marginHorizontal: 16, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    overflow: 'hidden',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  tableInner: { paddingBottom: 10 },
  
  // Tablo Başlığı
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#E0F2FE', borderBottomWidth: 1, borderBottomColor: '#BAE6FD', paddingVertical: 14 },
  tableHeaderCell: { fontSize: 14, fontWeight: '700', color: '#0369A1', paddingHorizontal: 12 },

  // Tablo Satırları
  tableRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tableRowAlt: { backgroundColor: '#F9FAFB' },
  
  // Hücreler
  cell: { paddingHorizontal: 12, justifyContent: 'center' },
  cellText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  emptyText: { color: '#9CA3AF', fontStyle: 'italic' },
  
  companyNameText: { fontSize: 14, fontWeight: '700', color: '#1E40AF', lineHeight: 20 },
  linkText: { fontSize: 13, color: '#2563EB', textDecorationLine: 'underline', lineHeight: 20 }
});