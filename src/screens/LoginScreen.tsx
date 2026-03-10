import React, { useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App'; 
import { loginUser } from '../services/auth'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../i18n/LanguageContext'; // ÇEVİRİ MOTORUMUZ GELDİ
import { GoogleSignin } from '@react-native-google-signin/google-signin';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const handleGoogleLogin = async () => {
  try {
    // Telefonun Google servisleri var mı kontrol et
    await GoogleSignin.hasPlayServices();
    
    // Google giriş ekranını aç
    const userInfo = await GoogleSignin.signIn();
    
    // YENİ SÜRÜM DÜZELTMESİ: idToken artık "data" objesinin içinde geliyor
    // Eğer işlem başarılıysa token'ı alıyoruz
    if (userInfo.type === 'success' && userInfo.data) {
      const googleToken = userInfo.data.idToken; 
      console.log("Google Token başarıyla alındı:", googleToken);
      
      // BURADAN SONRASI SENİN BACKEND İŞLEMİN
      // await sendTokenToYourCSharpBackend(googleToken);
    } else {
      console.log('Google girişi iptal edildi veya başarısız oldu.');
    }
    
  } catch (error) {
    console.log('Google Sign-In Hatası:', error);
  }
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  // Dil ve Çeviri Fonksiyonları
  const { t, language, setLanguage } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('login.warning'), t('login.emptyFields'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginUser(email, password);

      const validToken = result?.token || result?.Token;

      if (validToken) {
        console.log("Giriş Başarılı! Token hafızaya alınıyor...");
        
        await AsyncStorage.setItem('userToken', validToken);
      
        const validName = result?.fullName || result?.FullName || "Kullanıcı";

        Alert.alert(t('login.success'), `${t('login.welcome')}, ${validName}!`, [
          { text: 'OK', onPress: () => navigation.replace("Home") }
        ]);
      } else {
        Alert.alert(t('login.connectionError'), t('login.tokenError'));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Bir hata oluştu.';
      Alert.alert(t('login.loginFailed'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* SAĞ ÜST DİL DEĞİŞTİRME BUTONU */}
      <TouchableOpacity 
        style={styles.langButton}
        onPress={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
      >
        <Text style={styles.langButtonText}>
          {language === 'tr' ? 'EN' : 'TR'}
        </Text>
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/logo3.png")} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>FGS TRADE</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('login.emailLabel')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login.emailPlaceholder')}
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('login.passwordLabel')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login.passwordPlaceholder')}
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Text style={{fontSize: 20}}>{showPassword ? "👁️" : "🙈"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.rememberMe} 
              onPress={() => setRememberMe(!rememberMe)} 
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>{t('login.rememberMe')}</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotPassword}>{t('login.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>{t('login.button')}</Text>
            )}
          </TouchableOpacity>
{/* VEYA DEVAM EDİN ÇİZGİSİ (YENİ) */}
<View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('login.orContinue') || "veya devam edin"}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* SOSYAL GİRİŞ BUTONLARI (YENİ) */}
          <View style={styles.socialRow}>
            {/* Google Butonu */}
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
              <Text style={styles.googleIcon}>G</Text> 
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLinkText}>
              {t('login.noAccount')} <Text style={styles.registerLinkBold}>{t('login.register')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  
  // Dil Butonu Stili
  langButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: "#F3F4F6", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  langButtonText: { color: "#1F2937", fontSize: 16, fontWeight: "700" },
// Sosyal Giriş Stilleri
dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
dividerText: { marginHorizontal: 16, fontSize: 13, color: '#6B7280' },
socialRow: { marginBottom: 24 },
socialButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12 },
googleIcon: { fontSize: 26, fontWeight: 'bold', color: '#DB4437' },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  card: { backgroundColor: "#FFFFFF", paddingHorizontal: 32, paddingVertical: 40, marginTop: 40 },
  logoContainer: { alignItems: "center", marginBottom: 24 },
  logoImage: { 
    width: 120, 
    height: 120, 
    transform: [{ scale: 1.9 }] // Logoyu kutunun içinde %50 büyütür (Kalıbı bozmaz!)
  },  title: { fontSize: 28, fontWeight: "700", color: "#1E40AF", textAlign: "center", marginBottom: 8, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB", paddingHorizontal: 16, height: 52 },
  inputIcon: { marginRight: 12, fontSize: 18 },
  input: { flex: 1, fontSize: 15, color: "#111827" },
  eyeIcon: { padding: 4 },
  optionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  rememberMe: { flexDirection: "row", alignItems: "center" },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#D1D5DB", marginRight: 8, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  rememberText: { fontSize: 14, color: "#374151" },
  forgotPassword: { fontSize: 14, color: "#2563EB", fontWeight: "600" },
  loginButton: { backgroundColor: "#2563EB", borderRadius: 12, height: 52, alignItems: "center", justifyContent: "center", shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginBottom: 24 },
  loginButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  registerLink: { alignItems: 'center', marginTop: 8, marginBottom: 16 },
  registerLinkText: { fontSize: 14, color: '#6B7280' },
  registerLinkBold: { color: '#2563EB', fontWeight: '600' },
});