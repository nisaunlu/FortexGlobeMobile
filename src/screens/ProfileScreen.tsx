import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, 
  ActivityIndicator, Linking, ScrollView, Modal, TextInput 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch('http://localhost:5210/api/Auth/me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        setUserData(data);
        setEditFullName(data.fullName);
        setEditCompanyName(data.companyName || "");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      { 
        text: "Çıkış Yap", style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem('userToken');
          navigation.replace('Login');
        }
      }
    ]);
  };

  // GERÇEK BACKEND BAĞLANTISI: Profili Kaydet
  const saveProfile = async () => {
    if (!editFullName.trim()) return Alert.alert("Hata", "Ad soyad boş bırakılamaz.");
    setIsSaving(true);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://localhost:5210/api/Auth/update-profile', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          fullName: editFullName,
          companyName: editCompanyName
        })
      });

      const result = await response.json();
      if (response.ok) {
        setUserData({ ...userData, fullName: editFullName, companyName: editCompanyName });
        setIsEditProfileVisible(false);
        Alert.alert("Başarılı", result.message || "Profiliniz güncellendi.");
      } else {
        Alert.alert("Hata", result.message || "Güncelleme başarısız.");
      }
    } catch (error) {
        console.log("Sunucu hatası detayları:", error); // <-- ESLint artık mutlu!
        Alert.alert("Hata", "Sunucuya ulaşılamadı.");
      } finally {
      setIsSaving(false);
    }
  };

  // GERÇEK BACKEND BAĞLANTISI: Şifre Değiştir
  const savePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert("Hata", "Lütfen tüm şifre alanlarını doldurun.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Hata", "Yeni şifreler birbiriyle eşleşmiyor.");
    }
    
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://localhost:5210/api/Auth/change-password', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword
        })
      });

      const result = await response.json();
      if (response.ok) {
        setIsChangePasswordVisible(false);
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        Alert.alert("Başarılı", result.message || "Şifreniz değiştirildi.");
      } else {
        Alert.alert("Hata", result.message || "Şifre değiştirilemedi.");
      }
    } catch (error) {
        console.log("Sunucu hatası detayları:", error); // <-- ESLint artık mutlu!
        Alert.alert("Hata", "Sunucuya ulaşılamadı.");
      } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !userData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>Profil yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{userData?.fullName?.charAt(0) || "U"}</Text>
        </View>
        <Text style={styles.nameText}>{userData?.fullName || "Kullanıcı"}</Text>
        <Text style={styles.emailText}>{userData?.email}</Text>
        
        {/* HATA ÇÖZÜMÜ BURADA: String hatası vermemesi için ternary (?:) kullanıldı */}
        {userData?.companyName ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🏢 {userData.companyName}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Kalan Kredi</Text>
          <Text style={styles.statValue}>{userData?.credits || 0} ⚡</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Mevcut Paket</Text>
          <Text style={styles.statValue}>{userData?.packageType || "Free"}</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Hesap Ayarları</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => setIsEditProfileVisible(true)}>
          <View style={styles.menuItemLeft}><Text style={styles.menuIcon}>✏️</Text><Text style={styles.menuText}>Profili Düzenle</Text></View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setIsChangePasswordVisible(true)}>
          <View style={styles.menuItemLeft}><Text style={styles.menuIcon}>🔒</Text><Text style={styles.menuText}>Şifre Değiştir</Text></View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://fgstrade.com/')}>
          <View style={styles.menuItemLeft}><Text style={styles.menuIcon}>🚀</Text><Text style={styles.menuText}>Paket Yükselt / Kredi Al</Text></View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Diğer</Text>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}><Text style={styles.menuIcon}>🎧</Text><Text style={styles.menuText}>Destek Merkezi</Text></View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
          <View style={styles.menuItemLeft}><Text style={styles.menuIcon}>🚪</Text><Text style={[styles.menuText, { color: '#DC2626' }]}>Güvenli Çıkış Yap</Text></View>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />

      {/* Profil Düzenleme Modal */}
      <Modal visible={isEditProfileVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profili Düzenle</Text>
            <Text style={styles.inputLabel}>Ad Soyad</Text>
            <TextInput style={styles.input} value={editFullName} onChangeText={setEditFullName} placeholder="Ad Soyad" />
            <Text style={styles.inputLabel}>Şirket Adı</Text>
            <TextInput style={styles.input} value={editCompanyName} onChangeText={setEditCompanyName} placeholder="Şirketiniz (Opsiyonel)" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditProfileVisible(false)}><Text style={styles.cancelButtonText}>İptal</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Şifre Değiştirme Modal */}
      <Modal visible={isChangePasswordVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Şifre Değiştir</Text>
            <Text style={styles.inputLabel}>Mevcut Şifre</Text>
            <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Şu anki şifreniz" />
            <Text style={styles.inputLabel}>Yeni Şifre</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Yeni şifreniz" />
            <Text style={styles.inputLabel}>Yeni Şifre (Tekrar)</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Tekrar girin" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsChangePasswordVisible(false)}><Text style={styles.cancelButtonText}>İptal</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={savePassword} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Güncelle</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' }, headerSection: { alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 }, avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 4, borderColor: '#EFF6FF' }, avatarText: { fontSize: 36, fontWeight: 'bold', color: '#1E40AF' }, nameText: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 }, emailText: { fontSize: 15, color: '#6B7280', marginBottom: 15 }, badge: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }, badgeText: { fontSize: 13, fontWeight: '600', color: '#374151' }, statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 15 }, statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 }, statTitle: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 8 }, statValue: { fontSize: 22, fontWeight: '800', color: '#2563EB' }, menuSection: { marginTop: 25, paddingHorizontal: 20 }, sectionTitle: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 10 }, menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 }, menuItemLeft: { flexDirection: 'row', alignItems: 'center' }, menuIcon: { fontSize: 22, marginRight: 15 }, menuText: { fontSize: 16, fontWeight: '600', color: '#374151' }, menuArrow: { fontSize: 24, color: '#9CA3AF', fontWeight: '300' }, modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }, modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20, textAlign: 'center' }, inputLabel: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 8, marginLeft: 4 }, input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 15, marginBottom: 16, color: '#111827' }, modalButtons: { flexDirection: 'row', gap: 12, marginTop: 10 }, cancelButton: { flex: 1, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center' }, cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#4B5563' }, saveButton: { flex: 1, padding: 16, backgroundColor: '#2563EB', borderRadius: 12, alignItems: 'center' }, saveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' }
});