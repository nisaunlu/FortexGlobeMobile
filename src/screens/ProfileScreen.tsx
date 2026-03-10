import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, 
  ActivityIndicator, Linking, ScrollView, Modal, TextInput 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useLanguage } from '../i18n/LanguageContext'; // ÇEVİRİ MOTORUMUZ EKLENDİ

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useLanguage(); // Çeviri kancası
  
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Profil Düzenleme
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  
  // Şifre Değiştirme
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // DESTEK FORMU STATE'LERİ (YENİ)
  const [isSupportVisible, setIsSupportVisible] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportType, setSupportType] = useState("question"); // Varsayılan: Soru
  
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
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('profile.cancel'), style: "cancel" },
      { 
        text: t('profile.logout'), style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem('userToken');
          navigation.replace('Login');
        }
      }
    ]);
  };

  const saveProfile = async () => {
    if (!editFullName.trim()) return Alert.alert(t('alerts.warning'), t('alerts.fillAllFields'));
    setIsSaving(true);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://localhost:5210/api/Auth/update-profile', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ fullName: editFullName, companyName: editCompanyName })
      });

      const result = await response.json();
      if (response.ok) {
        setUserData({ ...userData, fullName: editFullName, companyName: editCompanyName });
        setIsEditProfileVisible(false);
        Alert.alert("Başarılı", result.message || "Profil güncellendi.");
      } else {
        Alert.alert("Hata", result.message || "Güncelleme başarısız.");
      }
    } catch (error) {
        console.log("Sunucu hatası:", error); 
        Alert.alert("Hata", "Sunucuya ulaşılamadı.");
    } finally {
      setIsSaving(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert(t('alerts.warning'), t('alerts.fillAllFields'));
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert(t('alerts.warning'), "Şifreler eşleşmiyor.");
    }
    
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('http://localhost:5210/api/Auth/change-password', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const result = await response.json();
      if (response.ok) {
        setIsChangePasswordVisible(false);
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        Alert.alert("Başarılı", result.message || "Şifre değiştirildi.");
      } else {
        Alert.alert("Hata", result.message || "Şifre değiştirilemedi.");
      }
    } catch (error) {
        console.log("Sunucu hatası:", error); 
        Alert.alert("Hata", "Sunucuya ulaşılamadı.");
    } finally {
      setIsSaving(false);
    }
  };

  // GERÇEK BACKEND BAĞLANTISI: İletişim Formunu Gönder (YENİ)
  const sendSupportMessage = async () => {
    if (!supportSubject.trim() || supportMessage.trim().length < 10) {
      return Alert.alert(t('alerts.warning'), "Lütfen başlık girin ve mesajınızın en az 10 karakter olduğundan emin olun.");
    }

    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const payload = {
        FullName: userData?.fullName || "Bilinmeyen Kullanıcı",
        Email: userData?.email || "bilinmiyor@fgstrade.com",
        Phone: supportPhone,
        Subject: supportSubject,
        Message: supportMessage,
        FeedbackType: supportType
      };

      const response = await fetch('http://localhost:5100/api/Feedback', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsSupportVisible(false);
        setSupportSubject(""); setSupportMessage(""); setSupportPhone("");
        Alert.alert("Başarılı", t('profile.supportSuccess'));
      } else {
        const errorData = await response.json();
        Alert.alert("Hata", errorData.message || "Mesajınız gönderilemedi.");
      }
    } catch (error) {
      console.log("Destek gönderim hatası:", error);
      Alert.alert("Hata", "Sunucu bağlantısı kurulamadı.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !userData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>{t('profile.loading')}</Text>
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
        
        {userData?.companyName ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🏢 {userData.companyName}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>{t('profile.credits')}</Text>
          <Text style={styles.statValue}>{userData?.credits || 0} ⚡</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>{t('profile.package')}</Text>
          <Text style={styles.statValue}>{userData?.packageType || t('profile.free')}</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>{t('profile.accountSettings')}</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => setIsEditProfileVisible(true)}>
          <View style={styles.menuItemLeft}><Text style={styles.menuIcon}>✏️</Text><Text style={styles.menuText}>{t('profile.editProfile')}</Text></View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setIsChangePasswordVisible(true)}>
          <View style={styles.menuItemLeft}><Text style={styles.menuIcon}>🔒</Text><Text style={styles.menuText}>{t('profile.changePassword')}</Text></View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://fgstrade.com/')}>
          <View style={styles.menuItemLeft}><Text style={styles.menuIcon}>🚀</Text><Text style={styles.menuText}>{t('profile.upgrade')}</Text></View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>{t('profile.other')}</Text>
        
        {/* DESTEK MERKEZİ BUTONU */}
        <TouchableOpacity style={styles.menuItem} onPress={() => setIsSupportVisible(true)}>
          <View style={styles.menuItemLeft}><Text style={styles.menuIcon}>🎧</Text><Text style={styles.menuText}>{t('profile.support')}</Text></View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
          <View style={styles.menuItemLeft}><Text style={styles.menuIcon}>🚪</Text><Text style={[styles.menuText, { color: '#DC2626' }]}>{t('profile.logout')}</Text></View>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />

      {/* 1. Profil Düzenleme Modal */}
      <Modal visible={isEditProfileVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.editProfile')}</Text>
            <Text style={styles.inputLabel}>{t('profile.nameLabel')}</Text>
            <TextInput style={styles.input} value={editFullName} onChangeText={setEditFullName} />
            <Text style={styles.inputLabel}>{t('profile.companyLabel')}</Text>
            <TextInput style={styles.input} value={editCompanyName} onChangeText={setEditCompanyName} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditProfileVisible(false)}><Text style={styles.cancelButtonText}>{t('profile.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>{t('profile.save')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Şifre Değiştirme Modal */}
      <Modal visible={isChangePasswordVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.changePassword')}</Text>
            <Text style={styles.inputLabel}>{t('profile.currentPass')}</Text>
            <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
            <Text style={styles.inputLabel}>{t('profile.newPass')}</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <Text style={styles.inputLabel}>{t('profile.confirmPass')}</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsChangePasswordVisible(false)}><Text style={styles.cancelButtonText}>{t('profile.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={savePassword} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>{t('profile.update')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. DESTEK MERKEZİ MODAL (YENİ) */}
      <Modal visible={isSupportVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 50 }]}>
            <Text style={styles.modalTitle}>{t('profile.supportTitle')}</Text>

            {/* Konu Türü Seçimi (Mobil UX için şık butonlar) */}
            <Text style={styles.inputLabel}>{t('profile.supportType')}</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity style={[styles.typeChip, supportType === 'complaint' && styles.typeChipActive]} onPress={() => setSupportType('complaint')}>
                <Text style={[styles.typeChipText, supportType === 'complaint' && {color: '#FFF'}]}>{t('profile.typeComplaint')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeChip, supportType === 'suggestion' && styles.typeChipActive]} onPress={() => setSupportType('suggestion')}>
                <Text style={[styles.typeChipText, supportType === 'suggestion' && {color: '#FFF'}]}>{t('profile.typeSuggestion')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeChip, supportType === 'question' && styles.typeChipActive]} onPress={() => setSupportType('question')}>
                <Text style={[styles.typeChipText, supportType === 'question' && {color: '#FFF'}]}>{t('profile.typeQuestion')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('profile.supportSubject')}</Text>
            <TextInput style={styles.input} value={supportSubject} onChangeText={setSupportSubject} placeholder="Örn: Paket yükseltme sorunu" />

            <Text style={styles.inputLabel}>{t('profile.supportPhone')}</Text>
            <TextInput style={styles.input} value={supportPhone} onChangeText={setSupportPhone} keyboardType="phone-pad" placeholder="+90 5XX XXX XX XX" />

            <Text style={styles.inputLabel}>{t('profile.supportMessage')}</Text>
            <TextInput 
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
              value={supportMessage} 
              onChangeText={setSupportMessage} 
              multiline={true} 
              numberOfLines={4}
              placeholder="Mesajınızı detaylı şekilde yazın..." 
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsSupportVisible(false)}>
                <Text style={styles.cancelButtonText}>{t('profile.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={sendSupportMessage} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>{t('profile.send')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' }, headerSection: { alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 }, avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 4, borderColor: '#EFF6FF' }, avatarText: { fontSize: 36, fontWeight: 'bold', color: '#1E40AF' }, nameText: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 }, emailText: { fontSize: 15, color: '#6B7280', marginBottom: 15 }, badge: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }, badgeText: { fontSize: 13, fontWeight: '600', color: '#374151' }, statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 15 }, statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 }, statTitle: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 8 }, statValue: { fontSize: 22, fontWeight: '800', color: '#2563EB' }, menuSection: { marginTop: 25, paddingHorizontal: 20 }, sectionTitle: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 10 }, menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 }, menuItemLeft: { flexDirection: 'row', alignItems: 'center' }, menuIcon: { fontSize: 22, marginRight: 15 }, menuText: { fontSize: 16, fontWeight: '600', color: '#374151' }, menuArrow: { fontSize: 24, color: '#9CA3AF', fontWeight: '300' }, modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }, modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20, textAlign: 'center' }, inputLabel: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 8, marginLeft: 4 }, input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 15, marginBottom: 16, color: '#111827' }, modalButtons: { flexDirection: 'row', gap: 12, marginTop: 10 }, cancelButton: { flex: 1, padding: 16, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center' }, cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#4B5563' }, saveButton: { flex: 1, padding: 16, backgroundColor: '#2563EB', borderRadius: 12, alignItems: 'center' }, saveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  // YENİ EKLENEN STİLLER (Destek Türü Çipleri)
  typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: { backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  typeChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  typeChipText: { color: '#4B5563', fontSize: 13, fontWeight: '600' }
});