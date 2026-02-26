import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:5210/api/Scraper'; // FGSTrade.API portun (5210)

export const scrapeWithGemini = async (category: string, city: string, country: string, maxResults: number) => {
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${API_URL}/scrape-gemini`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, city, country, maxResults })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Arama başarısız.");
  return data;
};

export const getScrapingHistory = async () => {
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${API_URL}/history`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Geçmiş alınamadı.");
  return data;
};

// 3. EXCEL İNDİRME LİNKİNİ OLUŞTURMA
export const getExcelDownloadUrl = async (jobId: number) => {
  const token = await AsyncStorage.getItem('userToken');
  // API adresine göre download linki oluşturur ve token'ı güvenli şekilde ekler
  return `${API_URL}/download/${jobId}?token=${token}`;
};