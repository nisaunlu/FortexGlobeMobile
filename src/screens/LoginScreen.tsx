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

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Uyarı', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginUser(email, password);

      // DÜZELTME BURADA: Backend'den 'Token' (Büyük T) veya 'token' gelebilir. 
      // İkisini de yakalıyoruz ki hafızaya boş (undefined) gitmesin.
      const validToken = result?.token || result?.Token;

      if (validToken) {
        console.log("Giriş Başarılı! Token hafızaya alınıyor...");
        
        // Gerçek ve dolu Token'ı telefonun hafızasına mühürlüyoruz
        await AsyncStorage.setItem('userToken', validToken);
      
        // Bildirimde ismini de büyük/küçük harf duyarlılığına göre yakalayalım
        const validName = result?.fullName || result?.FullName || "Kullanıcı";

        Alert.alert('Başarılı', `Hoş geldin, ${validName}!`, [
          { text: 'Tamam', onPress: () => navigation.replace("Home") }
        ]);
      } else {
        Alert.alert('Bağlantı Hatası', 'Giriş yapıldı ama sunucudan güvenlik bileti alınamadı.');
        console.log("API'den gelen yanıt:", result);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Bir hata oluştu.';
      Alert.alert('Giriş Başarısız', errorMessage);
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
              source={require("../assets/logo3.png")} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>FGS TRADE</Text>
          <Text style={styles.subtitle}>Güvenli giriş yapın ve işlemlerinizi yönetin</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-Posta Adresi</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="E-posta adresinizi girin"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Şifrenizi girin"
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
              <Text style={styles.rememberText}>Beni Hatırla</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Şifremi Unuttum?</Text>
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
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLinkText}>
              Hesabınız yok mu? <Text style={styles.registerLinkBold}>Kayıt Ol</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  card: { backgroundColor: "#FFFFFF", paddingHorizontal: 32, paddingVertical: 40 },
  logoContainer: { alignItems: "center", marginBottom: 24 },
  logoImage: { width: 120, height: 120 },
  title: { fontSize: 28, fontWeight: "700", color: "#1E40AF", textAlign: "center", marginBottom: 8, letterSpacing: 0.5 },
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