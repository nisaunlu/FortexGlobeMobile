import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Linking 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getScrapingHistory, getExcelDownloadUrl } from '../services/scraper';
import { useLanguage } from '../i18n/LanguageContext'; // Çeviri motorumuz

export default function HistoryScreen() {
  const { t, language } = useLanguage();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sayfa her açıldığında verileri yenile
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getScrapingHistory();
      
      // SİHİRLİ FİLTRE: Sadece durumu "Completed" (Başarılı) olanları göster!
      const successfulJobs = data.filter((job: any) => job.status === 'Completed');
      
      setHistory(successfulJobs);
    } catch (error) {
      console.log("Geçmiş çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // EXCEL İNDİRME FONKSİYONU 📊
  const handleDownload = async (jobId: number) => {
    try {
      const downloadUrl = await getExcelDownloadUrl(jobId);
      Linking.openURL(downloadUrl).catch(() => {
        Alert.alert(t('alerts.warning'), "Tarayıcı açılamadı.");
      });
    } catch (error) {
      console.error("Something went wrong:", error);
      Alert.alert(t('alerts.warning'), "Excel indirme linki oluşturulamadı.");
    }
  };

  // Tarihi güzel bir formata çevirme (Örn: 23.02.2026 23:36)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: any }) => {
    // SİHİRLİ DOKUNUŞ: Veritabanındaki 'Turkey' yazısını dille uyumlu hale getir
    const displayCountry = item.country === 'Turkey' && language === 'tr' ? 'Türkiye' : item.country;
    
    // İŞTE EKSİK OLAN RETURN BURADA! 👇
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.jobTitle}>{item.category} - {item.city}</Text>
            <Text style={styles.countryText}>🌍 {displayCountry}</Text>
          </View>
          
          {/* Sağ Üstteki Yeşil Tamamlandı Rozeti */}
          <View style={styles.statusBadge}>
            <Text style={styles.statusIcon}>✓</Text>
            <Text style={styles.statusText}>{t('history.completed')}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 {t('history.date')}:</Text>
            <Text style={styles.infoValue}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🏢 {t('history.found')}:</Text>
            <Text style={styles.infoValue}>{item.totalResults}</Text>
          </View>
        </View>

        {/* WEBBDEKİ GİBİ YEŞİL İNDİR BUTONU */}
        <TouchableOpacity 
          style={styles.downloadButton} 
          onPress={() => handleDownload(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.downloadButtonIcon}>📥</Text>
          <Text style={styles.downloadButtonText}>{t('history.download')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🕒 {t('history.title')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={styles.emptyText}>{t('history.noHistory')}</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#2563EB', padding: 20, paddingTop: 60, paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  
  // Kart Tasarımı
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleContainer: { flex: 1, paddingRight: 10 },
  jobTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  countryText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusIcon: { color: '#059669', fontWeight: 'bold', marginRight: 4, fontSize: 12 },
  statusText: { color: '#059669', fontSize: 12, fontWeight: '700' },
  
  cardBody: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  infoLabel: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '700' },
  
  // İndir Butonu (Web'deki gibi yeşil)
  downloadButton: { flexDirection: 'row', backgroundColor: '#22C55E', paddingVertical: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  downloadButtonIcon: { fontSize: 16, marginRight: 8, color: '#FFFFFF' },
  downloadButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }
});