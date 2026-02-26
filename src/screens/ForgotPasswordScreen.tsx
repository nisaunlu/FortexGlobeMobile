import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Alert,
} from 'react-native';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    // Gerçek senaryoda burada backend API'ye istek atılır
    console.log('Şifre sıfırlama talebi alındı:', email);
    
    Alert.alert(
      'Başarılı',
      'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
      [{ text: 'Tamam', onPress: () => navigation.goBack() }] // Tamam'a basınca Login'e geri döner
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo3.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Şifremi Unuttum</Text>
        <Text style={styles.subtitle}>
          E-posta adresinizi girin, size şifrenizi sıfırlamanız için bir bağlantı gönderelim.
        </Text>

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

        <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword}>
          <Text style={styles.resetButtonText}>Bağlantı Gönder</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Giriş Ekranına Dön</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center' },
  card: { backgroundColor: '#FFFFFF', paddingHorizontal: 32, paddingVertical: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoImage: { width: 120, height: 120 },
  title: { fontSize: 28, fontWeight: '700', color: '#1E40AF', textAlign: 'center', marginBottom: 8, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 16, height: 52 },
  inputIcon: { marginRight: 12, fontSize: 18 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  resetButton: { backgroundColor: '#2563EB', borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginBottom: 24 },
  resetButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  backLink: { alignItems: 'center' },
  backLinkText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
});