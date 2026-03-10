import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Image, Alert, ActivityIndicator,
  FlatList, LogBox, Modal
} from "react-native";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { scrapeWithGemini } from '../services/scraper';
import { Country, State } from 'country-state-city';

LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const BASE_URL = 'http://localhost:5210';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
interface HomeScreenProps { navigation: HomeScreenNavigationProp; }

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface HsCodeItem { code: string; description: string; category: string; }

interface HistoryItem {
  id: number;
  hsCode: string;
  productName: string;
  targetCountry: string;
  originCountry: string;
  isSuccessful: boolean;
  pdfDownloaded: boolean;
  createdAt: string;
  viewCount: number;
  isFavorite: boolean;
  notes?: string;
}

interface HistoryDetailItem extends HistoryItem { reportContent?: string; }

// ─── Statik Veriler ───────────────────────────────────────────────────────────
const searchLanguages = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh', name: '中文' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' },
];

// ─── Ülke verileri (component dışında — her render'da yeniden hesaplanmaz) ──────
const _ALL_COUNTRIES = Country.getAllCountries();
const TURKEY_COUNTRY = _ALL_COUNTRIES.find(c => c.isoCode === 'TR') || _ALL_COUNTRIES[0];
const ALL_COUNTRIES  = [TURKEY_COUNTRY, ..._ALL_COUNTRIES.filter(c => c.isoCode !== 'TR')];
const TURKEY_STATES  = State.getStatesOfCountry('TR');

const FALLBACK_HS_CODES: HsCodeItem[] = [
  { code: '87116000', description: 'Elektrikli Bisiklet', category: 'Taşıtlar' },
  { code: '84713000', description: 'Dizüstü Bilgisayar', category: 'Elektronik' },
  { code: '85044090', description: 'Güç Kaynakları', category: 'Elektronik' },
  { code: '39269099', description: 'Plastik Ürünler', category: 'Plastik' },
  { code: '61091000', description: 'Pamuklu Tişört', category: 'Tekstil' },
];

// ─── Markdown Renderer ────────────────────────────────────────────────────────
// Web'deki dangerouslySetInnerHTML mantığını React Native Text bileşenlerine taşıdık
interface MarkdownNode {
  type: 'h1' | 'h2' | 'h3' | 'bold_line' | 'bullet' | 'text' | 'divider';
  content: string;
}

function parseMarkdown(raw: string): MarkdownNode[] {
  const lines = raw.split('\n');
  const nodes: MarkdownNode[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('### '))       nodes.push({ type: 'h3', content: trimmed.slice(4) });
    else if (trimmed.startsWith('## '))   nodes.push({ type: 'h2', content: trimmed.slice(3) });
    else if (trimmed.startsWith('# '))    nodes.push({ type: 'h1', content: trimmed.slice(2) });
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* '))
                                           nodes.push({ type: 'bullet', content: trimmed.slice(2) });
    else if (trimmed.startsWith('---'))   nodes.push({ type: 'divider', content: '' });
    else if (trimmed.startsWith('**') && trimmed.endsWith('**'))
                                           nodes.push({ type: 'bold_line', content: trimmed.slice(2, -2) });
    else                                   nodes.push({ type: 'text', content: trimmed });
  }
  return nodes;
}

// Satır içi **bold** işle
function renderInlineBold(text: string, baseStyle: any) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <Text key={i} style={[baseStyle, { fontWeight: '700', color: '#1E40AF' }]}>{part}</Text>
      : <Text key={i} style={baseStyle}>{part}</Text>
  );
}

function MarkdownReport({ content }: { content: string }) {
  const nodes = parseMarkdown(content);
  return (
    <View>
      {nodes.map((node, i) => {
        switch (node.type) {
          case 'h1': return (
            <View key={i} style={mdStyles.h1Container}>
              <Text style={mdStyles.h1}>{node.content}</Text>
            </View>
          );
          case 'h2': return (
            <View key={i} style={mdStyles.h2Container}>
              <Text style={mdStyles.h2}>{node.content}</Text>
            </View>
          );
          case 'h3': return <Text key={i} style={mdStyles.h3}>{node.content}</Text>;
          case 'bold_line': return <Text key={i} style={mdStyles.boldLine}>{node.content}</Text>;
          case 'bullet': return (
            <View key={i} style={mdStyles.bulletRow}>
              <Text style={mdStyles.bulletDot}>•</Text>
              <Text style={mdStyles.bulletText}>{renderInlineBold(node.content, mdStyles.bulletText)}</Text>
            </View>
          );
          case 'divider': return <View key={i} style={mdStyles.divider} />;
          default: return (
            <Text key={i} style={mdStyles.paragraph}>
              {renderInlineBold(node.content, mdStyles.paragraph)}
            </Text>
          );
        }
      })}
    </View>
  );
}

const mdStyles = StyleSheet.create({
  h1Container: { borderBottomWidth: 2, borderBottomColor: '#DBEAFE', paddingBottom: 6, marginBottom: 10, marginTop: 14 },
  h1: { fontSize: 17, fontWeight: '800', color: '#1E40AF' },
  h2Container: { borderBottomWidth: 1, borderBottomColor: '#E0E7FF', paddingBottom: 4, marginBottom: 8, marginTop: 12 },
  h2: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  h3: { fontSize: 13, fontWeight: '700', color: '#3B82F6', marginTop: 8, marginBottom: 4 },
  boldLine: { fontSize: 13, fontWeight: '700', color: '#1E3A8A', marginVertical: 4 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 3, paddingLeft: 4 },
  bulletDot: { fontSize: 14, color: '#2563EB', marginRight: 8, lineHeight: 20 },
  bulletText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },
  paragraph: { fontSize: 13, color: '#374151', lineHeight: 20, marginVertical: 3 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
});

// ─── Ana Ekran ────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: HomeScreenProps) {

  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  // Kullanıcı
  const [userName, setUserName] = useState("Gezgin");
  const [credits, setCredits]   = useState(0);

  // Tab 0 – Firma Arama
  const [product, setProduct]                       = useState("");
  const [companyCount, setCompanyCount]             = useState("10");
  const [selectedCountry, setSelectedCountry]       = useState<any>(TURKEY_COUNTRY);
  const [selectedCity, setSelectedCity]             = useState<any>(null);
  const [availableCities, setAvailableCities]       = useState<any[]>(TURKEY_STATES);
  const [showRegionDetails, setShowRegionDetails]   = useState(false);
  const [district, setDistrict]                     = useState("");
  const [neighborhood, setNeighborhood]             = useState("");
  const [selectedSearchLang, setSelectedSearchLang] = useState(searchLanguages[0]);
  const [isSearching, setIsSearching]               = useState(false);

  // Tab 1 – Pazar Analizi
  const [hsCode, setHsCode]                     = useState("");
  const [analysisProduct, setAnalysisProduct]   = useState("");
  const [targetCountry, setTargetCountry]       = useState<any>(null);
  const [originCountry, setOriginCountry]       = useState<any>(TURKEY_COUNTRY);
  const [reportLanguage, setReportLanguage]     = useState(searchLanguages[0]);
  const [isAnalyzing, setIsAnalyzing]           = useState(false);
  const [analysisResult, setAnalysisResult]     = useState<string | null>(null);
  const currentReportIdRef = React.useRef<string | null>(null);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  // 1️⃣ HS Code – dinamik liste
  const [hsCodes, setHsCodes] = useState<HsCodeItem[]>(FALLBACK_HS_CODES);

  // 4️⃣ Geçmiş & Favori
  const [historyVisible, setHistoryVisible]   = useState(false);
  const [historyData, setHistoryData]         = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading]   = useState(false);
  const [detailVisible, setDetailVisible]     = useState(false);
  const [detailData, setDetailData]           = useState<HistoryDetailItem | null>(null);
  const [detailLoading, setDetailLoading]     = useState(false);
  const [togglingFav, setTogglingFav]         = useState<number | null>(null);

  // Merkezi Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig]   = useState<{ type: string; data: any[]; title: string }>({ type: '', data: [], title: '' });

  // ─── Lifecycle ──────────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { fetchUserData(); }, []));
  useEffect(() => { fetchDynamicHsCodes(); }, []);

  // ─── Yardımcılar ────────────────────────────────────────────────────────────
  const getToken = () => AsyncStorage.getItem('userToken');

  const fetchUserData = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${BASE_URL}/api/Auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setCredits(d.credits ?? 0);
        setUserName(d.fullName ? d.fullName.split(' ')[0] : 'Gezgin');
      }
    } catch (e) { console.log('fetchUserData error', e); }
  };

  // 1️⃣ HS Code – API'den çek, başarısız olursa fallback kalır
  const fetchDynamicHsCodes = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/tradeintelligence/sample-hs-codes`);
      if (res.ok) {
        const data: HsCodeItem[] = await res.json();
        if (Array.isArray(data) && data.length > 0) setHsCodes(data);
      }
    } catch { /* fallback zaten state'te */ }
  };

  // ─── 4️⃣ Geçmiş ─────────────────────────────────────────────────────────────
  const openHistory = async () => {
    setHistoryVisible(true);
    setHistoryLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/tradeintelligence/history?page=1&pageSize=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      if (res.ok) {
        setHistoryData(JSON.parse(text));
      } else {
        Alert.alert('Hata', `Geçmiş yüklenemedi (${res.status})`);
        setHistoryVisible(false);
      }
    } catch (e: any) {
      Alert.alert('Bağlantı Hatası', e.message);
      setHistoryVisible(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetailVisible(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/tradeintelligence/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      if (res.ok) setDetailData(JSON.parse(text));
      else Alert.alert('Hata', 'Rapor yüklenemedi.');
    } catch (e: any) { Alert.alert('Hata', e.message); }
    finally { setDetailLoading(false); }
  };

  // 4️⃣ Toggle Favori — POST /{id}/toggle-favorite
  const toggleFavorite = async (id: number) => {
    setTogglingFav(id);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/tradeintelligence/${id}/toggle-favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { isFavorite } = await res.json();
        setHistoryData(prev => prev.map(h => h.id === id ? { ...h, isFavorite } : h));
        setDetailData(prev => prev && prev.id === id ? { ...prev, isFavorite } : prev);
      }
    } catch (e: any) { Alert.alert('Hata', e.message); }
    finally { setTogglingFav(null); }
  };

  // ─── Modal ──────────────────────────────────────────────────────────────────
  const openModal = (type: string, data: any[], title: string) => {
    setModalConfig({ type, data, title });
    setModalVisible(true);
  };

  const handleModalSelect = (item: any) => {
    switch (modalConfig.type) {
      case 'searchCountry':
        setSelectedCountry(item);
        setAvailableCities(
          (State.getStatesOfCountry(item.isoCode) || []).map((s: any) => ({
            ...s, name: s.name.replace(' Province', '').replace(' State', ''),
          }))
        );
        setSelectedCity(null);
        break;
      case 'searchCity':            setSelectedCity(item); break;
      case 'searchLang':            setSelectedSearchLang(item); break;
      case 'analysisTargetCountry': setTargetCountry(item); break;
      case 'analysisOriginCountry': setOriginCountry(item); break;
      case 'analysisReportLang':    setReportLanguage(item); break;
      case 'hsCode':                setHsCode(item.code); break;
    }
    setModalVisible(false);
  };

  const renderModalItem = ({ item }: any) => {
    let text: string = item.name ?? item.code ?? '';
    if (modalConfig.type === 'hsCode')
      text = `${item.code}  ${item.description}  (${item.category})`;
    else if (item.flag)
      text = `${item.flag}  ${item.name}`;
    return (
      <TouchableOpacity style={styles.modalItem} onPress={() => handleModalSelect(item)}>
        <Text style={styles.modalItemText}>{text}</Text>
      </TouchableOpacity>
    );
  };

  // ─── Firma Arama ────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!product || !selectedCountry || !selectedCity)
      return Alert.alert('Uyarı', 'Tüm alanları doldurun');
    setIsSearching(true);
    try {
      const loc = [
        showRegionDetails ? neighborhood : null,
        showRegionDetails ? district : null,
        selectedCity.name,
      ].filter(Boolean).join(', ');
      const data = await scrapeWithGemini(product, loc, selectedCountry.name, parseInt(companyCount, 10) || 10);
      fetchUserData();
      navigation.navigate('Sonuçlar' as any, { businesses: data.businesses, jobId: data.jobId } as any);
    } catch (e: any) { Alert.alert('Arama Başarısız', e.message); }
    finally { setIsSearching(false); }
  };

  // ─── Pazar Analizi ──────────────────────────────────────────────────────────
  const handleGenerateAnalysis = async () => {
    // Kredi kontrolü
    if (credits < 5)
      return Alert.alert('⚡ Yetersiz Kredi', `Pazar analizi için en az 5 kredi gerekli.\nMevcut: ${credits}`);
    if (!hsCode || !analysisProduct || !targetCountry || !originCountry)
      return Alert.alert('Uyarı', 'Tüm alanları doldurun');

    setIsAnalyzing(true);
    setAnalysisResult(null);
    currentReportIdRef.current = null;

    try {
      const token = await getToken();
      const payload = {
        HsCode: hsCode,
        ProductName: analysisProduct,
        TargetCountry: targetCountry.name,
        OriginCountry: originCountry.name,
        Language: reportLanguage.code,
      };

      const res = await fetch(`${BASE_URL}/api/tradeintelligence/generate-report`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const status = res.status;
      const text = await res.text();

      if (!res.ok) {
        Alert.alert(`Sunucu Hatası (${status})`, 'Backend terminalini kontrol et.');
        return;
      }

      let data: any;
      try { data = JSON.parse(text); }
      catch { Alert.alert('Okuma Hatası', 'Sunucu geçersiz JSON döndü.'); return; }

      if (data.success !== false) {
        setAnalysisResult(data.reportContent || data.report || 'Rapor oluşturuldu.');
        if (data.reportId) currentReportIdRef.current = data.reportId;
        fetchUserData(); // krediyi güncelle
      } else {
        Alert.alert('Başarısız', data.errorMessage || data.message || 'Rapor oluşturulamadı.');
      }
    } catch (e: any) {
      Alert.alert('Bağlantı Hatası', e.message || 'Sunucuya ulaşılamadı.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2️⃣ PDF – convert-to-pdf (web ile birebir aynı endpoint + payload)
  // MarkdownContent + ReportContent gönderiliyor (backend GetContent() ile alıyor)
  const handleDownloadPdf = async () => {
    if (!analysisResult) return;
    if (!targetCountry || !originCountry)
      return Alert.alert('Hata', 'Rapor bilgileri eksik.');

    setIsPdfDownloading(true);
    try {
      const token = await getToken();
      const payload = {
        MarkdownContent: analysisResult, // backend web tarafından beklediği alan
        ReportContent:   analysisResult, // GetContent() fallback için
        ProductName:     analysisProduct,
        TargetCountry:   targetCountry.name,
        OriginCountry:   originCountry.name,
      };

      const res = await fetch(`${BASE_URL}/api/tradeintelligence/convert-to-pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const status = res.status;

      if (res.ok) {
        // Mobilde blob indirme react-native-fs / expo-sharing gerektirir.
        // Backend bağlantısı başarılı — dosya paylaşımı bir sonraki sprint'e bırakıldı.
        Alert.alert(
          '✅ PDF Hazır',
          `"${analysisProduct} – ${targetCountry.name}" raporu PDF olarak oluşturuldu.\n\nDosyayı cihaza kaydetmek için dosya paylaşım özelliği yakında eklenecek.`
        );
      } else {
        const errText = await res.text();
        Alert.alert(`PDF Hatası (${status})`, 'Backend terminalini kontrol et.');
        console.log('PDF Error:', errText);
      }
    } catch (e: any) {
      Alert.alert('Bağlantı Hatası', e.message || 'Sunucuya bağlanılamadı.');
    } finally {
      setIsPdfDownloading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../assets/logo3.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>FGS Trade</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* 4️⃣ Geçmiş Butonu */}
          <TouchableOpacity style={styles.historyButton} onPress={openHistory}>
            <Text style={{ fontSize: 18 }}>📋</Text>
          </TouchableOpacity>
          {/* Kredi */}
          <TouchableOpacity style={styles.creditsButton}>
            <Text style={styles.creditsIcon}>⚡</Text>
            <Text style={styles.creditsText}>{credits} Kredi</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Merhaba, {userName} 👋</Text>
          <Text style={styles.greetingSubtitle}>Bugün ne arıyoruz?</Text>
        </View>

        {/* ── Sekmeler ── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabButton, activeTab === 0 && styles.tabButtonActive]} onPress={() => setActiveTab(0)}>
            <Text style={[styles.tabText, activeTab === 0 && styles.tabTextActive]}>🔍 Firma Arama</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 1 && styles.tabButtonActive]} onPress={() => setActiveTab(1)}>
            <Text style={[styles.tabText, activeTab === 1 && styles.tabTextActive]}>📊 Pazar Analizi</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchCard}>

          {/* ══ TAB 0: FİRMA ARAMA ══ */}
          {activeTab === 0 && (
            <View>
              <View style={styles.searchHeader}>
                <Text style={styles.searchIcon}>🔍</Text>
                <Text style={styles.searchTitle}>Hedef Pazar Araması</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ürün İsmi</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🛍️</Text>
                  <TextInput style={styles.input} placeholder="Örn: Tekstil..." placeholderTextColor="#9CA3AF" value={product} onChangeText={setProduct} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hedef Ülke</Text>
                <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.8} onPress={() => openModal('searchCountry', ALL_COUNTRIES, 'Ülke Seçin')}>
                  <Text style={styles.inputIcon}>🌍</Text>
                  <Text style={[styles.input, { color: selectedCountry ? '#111827' : '#9CA3AF' }]}>
                    {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'Ülke Seçin'}
                  </Text>
                  <Text style={styles.arrowIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hedef Şehir</Text>
                <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.8}
                  onPress={() => { if (!selectedCountry) return Alert.alert('Uyarı', 'Önce ülke seçin'); openModal('searchCity', availableCities, 'Şehir Seçin'); }}>
                  <Text style={styles.inputIcon}>📍</Text>
                  <Text style={[styles.input, { color: selectedCity ? '#111827' : '#9CA3AF' }]}>
                    {selectedCity ? selectedCity.name : 'Şehir Seçin'}
                  </Text>
                  <Text style={styles.arrowIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.checkboxContainer} onPress={() => setShowRegionDetails(!showRegionDetails)}>
                <View style={[styles.checkbox, showRegionDetails && styles.checkboxChecked]}>
                  {showRegionDetails && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>📍 Bölge detayı ekle</Text>
              </TouchableOpacity>

              {showRegionDetails && (
                <View style={styles.regionContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>İlçe</Text>
                    <View style={styles.inputWrapper}><Text style={styles.inputIcon}>📍</Text><TextInput style={styles.input} placeholder="Örn: Kadıköy" placeholderTextColor="#9CA3AF" value={district} onChangeText={setDistrict} /></View>
                  </View>
                  <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                    <Text style={styles.label}>Mahalle</Text>
                    <View style={styles.inputWrapper}><Text style={styles.inputIcon}>📍</Text><TextInput style={styles.input} placeholder="Örn: Moda" placeholderTextColor="#9CA3AF" value={neighborhood} onChangeText={setNeighborhood} /></View>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Arama Dili</Text>
                <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.8} onPress={() => openModal('searchLang', searchLanguages, 'Dil Seçin')}>
                  <Text style={styles.inputIcon}>🌐</Text>
                  <Text style={[styles.input, { color: '#111827' }]}>{selectedSearchLang.name}</Text>
                  <Text style={styles.arrowIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Firma Sayısı</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🏢</Text>
                  <TextInput style={styles.input} placeholder="10" placeholderTextColor="#9CA3AF" value={companyCount} onChangeText={setCompanyCount} keyboardType="number-pad" />
                </View>
                <Text style={styles.helperText}>En fazla 1000</Text>
              </View>

              <TouchableOpacity style={[styles.searchButton, isSearching && { opacity: 0.7 }]} onPress={handleSearch} disabled={isSearching}>
                {isSearching ? <ActivityIndicator color="#FFF" /> : <><Text style={styles.searchButtonIcon}>🔍</Text><Text style={styles.searchButtonText}>Arama Yap</Text></>}
              </TouchableOpacity>
            </View>
          )}

          {/* ══ TAB 1: PAZAR ANALİZİ ══ */}
          {activeTab === 1 && (
            <View>
              <View style={styles.searchHeader}>
                <Text style={styles.searchIcon}>📊</Text>
                <View>
                  <Text style={styles.searchTitle}>Pazar Analizi</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Detaylı rapor oluşturun</Text>
                </View>
              </View>

              {/* Kredi Uyarı Bandı */}
              <View style={styles.creditInfoBanner}>
                <Text style={styles.creditInfoText}>⚡ Bu işlem <Text style={styles.creditInfoBold}>5 kredi</Text> tüketir</Text>
                <Text style={[styles.creditInfoBalance, credits < 5 && { color: '#DC2626' }]}>Bakiye: {credits}</Text>
              </View>

              {/* 1️⃣ HS Code – dinamik + fallback */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>HS Code (GTIP)</Text>
                <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.8} onPress={() => openModal('hsCode', hsCodes, 'HS Code Seçin')}>
                  <Text style={styles.inputIcon}>📄</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: 87116000"
                    placeholderTextColor="#9CA3AF"
                    value={hsCode}
                    onChangeText={setHsCode}
                  />
                  <Text style={styles.arrowIcon}>▼</Text>
                </TouchableOpacity>
                <Text style={styles.helperText}>💡 Listeden seçin veya kendiniz girin</Text>
              </View>

              {/* Ürün İsmi */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ürün İsmi</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🛍️</Text>
                  <TextInput style={styles.input} placeholder="Örn: Bisiklet" placeholderTextColor="#9CA3AF" value={analysisProduct} onChangeText={setAnalysisProduct} />
                </View>
              </View>

              {/* Hedef Ülke */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hedef Ülke</Text>
                <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.8} onPress={() => openModal('analysisTargetCountry', ALL_COUNTRIES, 'Hedef Ülke Seçin')}>
                  <Text style={styles.inputIcon}>🌍</Text>
                  <Text style={[styles.input, { color: targetCountry ? '#111827' : '#9CA3AF' }]}>
                    {targetCountry ? `${targetCountry.flag} ${targetCountry.name}` : 'Ülke Seçin'}
                  </Text>
                  <Text style={styles.arrowIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Menşei Ülke */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Menşei Ülke</Text>
                <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.8} onPress={() => openModal('analysisOriginCountry', ALL_COUNTRIES, 'Menşei Ülke Seçin')}>
                  <Text style={styles.inputIcon}>{originCountry?.flag ?? '🌍'}</Text>
                  <Text style={[styles.input, { color: originCountry ? '#111827' : '#9CA3AF' }]}>
                    {originCountry ? originCountry.name : 'Ülke Seçin'}
                  </Text>
                  <Text style={styles.arrowIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Rapor Dili */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Rapor Dili</Text>
                <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.8} onPress={() => openModal('analysisReportLang', searchLanguages, 'Rapor Dili Seçin')}>
                  <Text style={styles.inputIcon}>🌐</Text>
                  <Text style={[styles.input, { color: '#111827' }]}>{reportLanguage.name}</Text>
                  <Text style={styles.arrowIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* ══ 3️⃣ Rapor Sonucu – Zengin Markdown ══ */}
              {analysisResult && (
                <View style={styles.reportContainer}>
                  <Text style={styles.reportReadyTitle}>✅ Pazar Analizi Hazır</Text>
                  <Text style={styles.reportCreditNote}>5 kredi kullanıldı</Text>

                  <ScrollView style={styles.reportBox} nestedScrollEnabled>
                    <MarkdownReport content={analysisResult} />
                  </ScrollView>

                  {/* 2️⃣ PDF – convert-to-pdf */}
                  <TouchableOpacity
                    style={[styles.pdfButton, isPdfDownloading && { opacity: 0.7 }]}
                    onPress={handleDownloadPdf}
                    disabled={isPdfDownloading}
                  >
                    {isPdfDownloading ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator color="#FFF" size="small" />
                        <Text style={styles.pdfButtonText}>PDF Hazırlanıyor...</Text>
                      </View>
                    ) : (
                      <Text style={styles.pdfButtonText}>📄 PDF Olarak İndir</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Analiz Butonu */}
              <TouchableOpacity
                style={[styles.analysisButton, isAnalyzing && { opacity: 0.7 }]}
                onPress={handleGenerateAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
                    <Text style={styles.searchButtonText}>Hazırlanıyor...</Text>
                  </View>
                ) : (
                  <><Text style={styles.searchButtonIcon}>📝</Text><Text style={styles.searchButtonText}>Pazar Analizi Oluştur</Text></>
                )}
              </TouchableOpacity>

              <Text style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>
                * Güncel ticaret verileri kullanılarak hazırlanmaktadır.
              </Text>
            </View>
          )}
        </View>
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* ══ Merkezi Seçim Modal ══ */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalConfig.title}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 5 }}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={modalConfig.data}
              keyExtractor={(_, i) => i.toString()}
              renderItem={renderModalItem}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* ══ 4️⃣ Geçmiş Modal ══ */}
      <Modal visible={historyVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Analiz Geçmişim</Text>
              <TouchableOpacity onPress={() => setHistoryVisible(false)} style={{ padding: 5 }}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            {historyLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={{ color: '#6B7280', marginTop: 12 }}>Yükleniyor...</Text>
              </View>
            ) : historyData.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 40 }}>📭</Text>
                <Text style={{ color: '#6B7280', marginTop: 12 }}>Henüz analiz geçmişi yok.</Text>
              </View>
            ) : (
              <FlatList
                data={historyData}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.historyCard}
                    onPress={() => { setHistoryVisible(false); openDetail(item.id); }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyCardTitle}>{item.productName}</Text>
                        <Text style={styles.historyCardSub}>{item.hsCode} · {item.targetCountry}</Text>
                        <Text style={styles.historyCardDate}>
                          {new Date(item.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        {/* ⭐ Favori Toggle */}
                        <TouchableOpacity onPress={() => toggleFavorite(item.id)} disabled={togglingFav === item.id}>
                          {togglingFav === item.id
                            ? <ActivityIndicator size="small" color="#F59E0B" />
                            : <Text style={{ fontSize: 22 }}>{item.isFavorite ? '⭐' : '☆'}</Text>}
                        </TouchableOpacity>
                        {/* PDF İndirildi Badge */}
                        {item.pdfDownloaded && (
                          <View style={styles.pdfBadge}><Text style={styles.pdfBadgeText}>PDF ✓</Text></View>
                        )}
                        {/* Başarı Badge */}
                        <View style={[styles.statusBadge, { backgroundColor: item.isSuccessful ? '#D1FAE5' : '#FEE2E2' }]}>
                          <Text style={[styles.statusBadgeText, { color: item.isSuccessful ? '#065F46' : '#991B1B' }]}>
                            {item.isSuccessful ? '✓ Başarılı' : '✗ Başarısız'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {item.notes && <Text style={styles.historyNoteText}>📝 {item.notes}</Text>}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ══ Rapor Detay Modal ══ */}
      <Modal visible={detailVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '95%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {detailData ? `📊 ${detailData.productName}` : 'Rapor'}
              </Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)} style={{ padding: 5 }}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            ) : detailData ? (
              <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                {/* Meta */}
                {[
                  { label: 'HS Code', value: detailData.hsCode },
                  { label: 'Hedef Ülke', value: detailData.targetCountry },
                  { label: 'Menşei', value: detailData.originCountry },
                  { label: 'Görüntülenme', value: `${detailData.viewCount}x` },
                ].map(row => (
                  <View key={row.label} style={styles.detailMetaRow}>
                    <Text style={styles.detailMetaLabel}>{row.label}</Text>
                    <Text style={styles.detailMetaValue}>{row.value}</Text>
                  </View>
                ))}

                {/* Favori Toggle */}
                <View style={[styles.detailMetaRow, { marginBottom: 16 }]}>
                  <Text style={styles.detailMetaLabel}>Favori</Text>
                  <TouchableOpacity onPress={() => toggleFavorite(detailData.id)} disabled={togglingFav === detailData.id}>
                    {togglingFav === detailData.id
                      ? <ActivityIndicator size="small" color="#F59E0B" />
                      : <Text style={{ fontSize: 24 }}>{detailData.isFavorite ? '⭐' : '☆'}</Text>}
                  </TouchableOpacity>
                </View>

                {/* 3️⃣ Rapor içeriği – Markdown render */}
                {detailData.reportContent ? (
                  <View style={[styles.reportBox, { height: undefined, minHeight: 200 }]}>
                    <MarkdownReport content={detailData.reportContent} />
                  </View>
                ) : (
                  <Text style={{ color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 }}>
                    Rapor içeriği mevcut değil.
                  </Text>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F2FE' },
  header: { backgroundColor: '#2563EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, paddingTop: 50 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 36, height: 36, marginRight: 12, backgroundColor: '#FFF', borderRadius: 8, padding: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  historyButton: { backgroundColor: 'rgba(255,255,255,0.2)', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  creditsButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 },
  creditsIcon: { fontSize: 16 },
  creditsText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  content: { flex: 1 },
  greetingSection: { padding: 24, paddingBottom: 16 },
  greetingTitle: { fontSize: 28, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  greetingSubtitle: { fontSize: 15, color: '#64748B' },
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15, backgroundColor: '#FFF', borderRadius: 12, padding: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#FFF' },
  searchCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 20, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  searchIcon: { fontSize: 24, marginRight: 12 },
  searchTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 16, height: 52 },
  inputIcon: { marginRight: 12, fontSize: 18 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  arrowIcon: { fontSize: 12, color: '#6B7280' },
  helperText: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#FFF' },
  checkboxChecked: { backgroundColor: '#2563EB' },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  regionContainer: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CBD5E1', borderRadius: 16, padding: 16, marginBottom: 20, backgroundColor: '#F8FAFC' },
  searchButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', borderRadius: 12, height: 52, gap: 8, marginTop: 8 },
  analysisButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E40AF', borderRadius: 12, height: 52, gap: 8, marginTop: 8 },
  searchButtonIcon: { fontSize: 18 },
  searchButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  creditInfoBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20 },
  creditInfoText: { fontSize: 13, color: '#92400E' },
  creditInfoBold: { fontWeight: '700', color: '#C2410C' },
  creditInfoBalance: { fontSize: 13, fontWeight: '600', color: '#059669' },
  reportContainer: { backgroundColor: '#ECFDF5', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#34D399', marginBottom: 20 },
  reportReadyTitle: { fontWeight: 'bold', color: '#059669', fontSize: 16, marginBottom: 2 },
  reportCreditNote: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  reportBox: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, height: 280, borderWidth: 1, borderColor: '#D1FAE5', marginBottom: 15 },
  pdfButton: { backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  pdfButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  // Geçmiş
  historyCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  historyCardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  historyCardSub: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  historyCardDate: { fontSize: 11, color: '#9CA3AF' },
  historyNoteText: { fontSize: 12, color: '#6B7280', marginTop: 8, fontStyle: 'italic' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  pdfBadge: { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pdfBadgeText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  // Detay
  detailMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailMetaLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  detailMetaValue: { fontSize: 13, color: '#111827', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 10 },
  modalCloseText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  modalItem: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalItemText: { fontSize: 15, color: '#374151' },
});