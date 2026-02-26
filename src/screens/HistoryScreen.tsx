import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getScrapingHistory } from '../services/scraper';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getScrapingHistory();
      setHistory(data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1, marginTop: 50 }} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⏳ Geçmiş İşlemler</Text>
      
      {history.length === 0 ? (
        <Text style={styles.emptyText}>Henüz bir scraping işlemi yapmadınız.</Text>
      ) : (
        history.map((job: any, index: number) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{job.category} - {job.city}</Text>
              <Text style={[styles.status, { color: job.status === 'Completed' ? '#10B981' : '#F59E0B' }]}>
                {job.status === 'Completed' ? 'Tamamlandı' : 'Hata/Bekliyor'}
              </Text>
            </View>
            <Text style={styles.detailText}>Tarih: {new Date(job.createdAt).toLocaleDateString('tr-TR')}</Text>
            <Text style={styles.detailText}>Bulunan Firma: {job.totalResults}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E40AF', marginBottom: 20 },
  emptyText: { color: '#6B7280', fontSize: 16, textAlign: 'center', marginTop: 50 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  category: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  status: { fontSize: 14, fontWeight: 'bold' },
  detailText: { fontSize: 13, color: '#6B7280', marginTop: 4 }
});