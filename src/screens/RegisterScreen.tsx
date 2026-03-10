import React, { useState } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { registerUser } from '../services/auth'; 
import { useLanguage } from '../i18n/LanguageContext';

export default function RegisterScreen({ route, navigation }: any) {
  const { t } = useLanguage();
  const passedEmail = route.params?.email || '';

  // Zorunlu Alanlar
  const [name, setName] = useState('');
  const [email, setEmail] = useState(passedEmail); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Yeni Eklenen Alanlar
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Türkiye'); // Varsayılan değer
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [userType, setUserType] = useState('');

  // UI State'leri
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserTypePicker, setShowUserTypePicker] = useState(false);

  const userTypes = [
    { label: t('register.producer'), value: 'Üretici' },
    { label: t('register.wholesaler'), value: 'Toptancı' },
    { label: t('register.researcher'), value: 'Araştırmacı' }
  ];

  const handleRegister = async () => {
    // Zorunlu alan kontrolü
    if (!name || !email || !password || !confirmPassword || !userType || !city) {
      Alert.alert(t('register.warning'), t('register.fillRequired'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('register.error'), t('register.passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      // 1. ÖNCE ÇEVİRİ İŞLEMLERİNİ YAPIYORUZ
      // Kullanıcı Türünü Rakama (Enum) Çevir
      let userTypeInt = null;
      if (userType === 'Üretici') userTypeInt = 0;      
      else if (userType === 'Toptancı') userTypeInt = 1; 
      else if (userType === 'Araştırmacı') userTypeInt = 2; 

      // URL Formatlayıcı (http yoksa ekle)
      let finalWebsite = website ? website.trim() : null;
      if (finalWebsite && !finalWebsite.startsWith('http://') && !finalWebsite.startsWith('https://')) {
        finalWebsite = `https://${finalWebsite}`;
      }

      // 2. SONRA PAKETİ HAZIRLIYORUZ (Boş alanları null yaparak)
      const userData = {
        FullName: name,
        Email: email,
        Password: password,
        CompanyName: companyName || null,
        Address: address || null,
        City: city || null,
        Country: country || null,
        Phone: phone || null,
        Website: finalWebsite, // Çevrilmiş URL
        UserType: userTypeInt  // Çevrilmiş Rakam (0, 1 veya 2)
      };

      // 3. PAKETİ GÖNDERİYORUZ
      const result = await registerUser(userData);
      
      Alert.alert(t('register.success'), result.message || t('register.successMessage'), [
        { text: t('register.ok'), onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error: any) {
      Alert.alert(t('register.failed'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/logo3.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>FGS TRADE</Text>
          <Text style={styles.subtitle}>{t('register.subtitle')}</Text>

          {/* AD SOYAD */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('register.fullName')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput style={styles.input} placeholder={t('register.fullNamePlaceholder')} placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
            </View>
          </View>

          {/* E-POSTA */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('register.email')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput style={styles.input} placeholder={t('register.emailPlaceholder')} placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          {/* ŞİFRE & ŞİFRE TEKRAR */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('register.password')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput style={styles.input} placeholder={t('register.passwordPlaceholder')} placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}><Text>{showPassword ? "👁️" : "🙈"}</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('register.confirmPassword')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput style={styles.input} placeholder={t('register.confirmPasswordPlaceholder')} placeholderTextColor="#9CA3AF" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}><Text>{showConfirmPassword ? "👁️" : "🙈"}</Text></TouchableOpacity>
            </View>
          </View>

          {/* ŞİRKET ADI */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('register.companyName')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🏢</Text>
              <TextInput style={styles.input} placeholder={t('register.companyNamePlaceholder')} placeholderTextColor="#9CA3AF" value={companyName} onChangeText={setCompanyName} />
            </View>
          </View>

          {/* ADRES */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('register.address')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput style={styles.input} placeholder={t('register.addressPlaceholder')} placeholderTextColor="#9CA3AF" value={address} onChangeText={setAddress} />
            </View>
          </View>

          {/* ŞEHİR VE ÜLKE YAN YANA (Web tasarımıyla uyumlu) */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>{t('register.city')}</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🏙️</Text>
                <TextInput style={styles.input} placeholder={t('register.cityPlaceholder')} placeholderTextColor="#9CA3AF" value={city} onChangeText={setCity} />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>{t('register.country')}</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🌍</Text>
                <TextInput style={styles.input} placeholder={t('register.countryPlaceholder')} placeholderTextColor="#9CA3AF" value={country} onChangeText={setCountry} />
              </View>
            </View>
          </View>

          {/* TELEFON VE WEB SİTESİ YAN YANA */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>{t('register.phone')}</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📞</Text>
                <TextInput style={styles.input} placeholder={t('register.phonePlaceholder')} placeholderTextColor="#9CA3AF" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>{t('register.website')}</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🌐</Text>
                <TextInput style={styles.input} placeholder={t('register.websitePlaceholder')} placeholderTextColor="#9CA3AF" value={website} onChangeText={setWebsite} autoCapitalize="none" />
              </View>
            </View>
          </View>

          {/* KULLANICI TÜRÜ (ÖZEL DROPDOWN) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('register.userType')}</Text>
            <TouchableOpacity 
              style={styles.inputWrapper} 
              activeOpacity={0.8}
              onPress={() => setShowUserTypePicker(!showUserTypePicker)}
            >
              <Text style={styles.inputIcon}>🏷️</Text>
              <Text style={[styles.input, { color: userType ? '#111827' : '#9CA3AF' }]}>
                {userType ? userTypes.find(u => u.value === userType)?.label : t('register.selectUserType')}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>▼</Text>
            </TouchableOpacity>

            {/* Açılır Menü Seçenekleri */}
            {showUserTypePicker && (
              <View style={styles.dropdownMenu}>
                {userTypes.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.dropdownItem, index === userTypes.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => {
                      setUserType(item.value);
                      setShowUserTypePicker(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, userType === item.value && { color: '#2563EB', fontWeight: 'bold' }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>{t('register.button')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>{t('register.hasAccount')} <Text style={styles.loginLinkBold}>{t('register.loginLink')}</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: '#FFFFFF', paddingHorizontal: 32, paddingVertical: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoImage: { width: 120, height: 120 },
  title: { fontSize: 28, fontWeight: '700', color: '#1E40AF', textAlign: 'center', marginBottom: 8, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' }, // Yan yana dizmek için eklendi
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 16, height: 52 },
  inputIcon: { marginRight: 12, fontSize: 18 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  eyeIcon: { padding: 4 },
  
  // Custom Dropdown Stilleri Eklendi
  dropdownMenu: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, marginTop: 4, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemText: { fontSize: 15, color: '#374151' },

  registerButton: { backgroundColor: '#2563EB', borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginBottom: 24, marginTop: 8 },
  registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 8 },
  loginLinkText: { fontSize: 14, color: '#6B7280' },
  loginLinkBold: { color: '#2563EB', fontWeight: '600' },
});