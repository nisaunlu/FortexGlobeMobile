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
  ActivityIndicator, // Yükleniyor ikonu eklendi
} from 'react-native';
import { registerUser } from '../services/auth'; // API bağlantısı eklendi

export default function RegisterScreen({ route, navigation }: any) {
  const passedEmail = route.params?.email || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(passedEmail); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // API isteği atılırken butonu dondurmak için state eklendi
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    setIsLoading(true); // Yüklenme başladı

    try {
      // API'ye istek atılıyor (companyName şimdilik boş gidiyor)
      const result = await registerUser(name, email, password, "");
      
      Alert.alert('Harika!', result.message || 'Kayıt başarılı, giriş yapabilirsiniz.', [
        { text: 'Tamam', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error: any) {
      Alert.alert('Kayıt Başarısız', error.message);
    } finally {
      setIsLoading(false); // Yüklenme bitti
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image
              source={require('/Users/nisaunlu/Desktop/FortexGlobeMobile/src/assets/logo3.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>FGS TRADE</Text>
          <Text style={styles.subtitle}>Yeni hesap oluşturun</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad Soyad</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput style={styles.input} placeholder="Ad ve soyadınızı girin" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-Posta Adresi</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput style={styles.input} placeholder="E-posta adresinizi girin" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput style={styles.input} placeholder="Şifrenizi girin" placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}><Text>{showPassword ? "👁️" : "🙈"}</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre Tekrar</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput style={styles.input} placeholder="Şifrenizi tekrar girin" placeholderTextColor="#9CA3AF" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}><Text>{showConfirmPassword ? "👁️" : "🙈"}</Text></TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={handleRegister}
            disabled={isLoading} // Yüklenirken tıklanmayı kapat
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Kayıt Ol</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>Zaten hesabınız var mı? <Text style={styles.loginLinkBold}>Giriş Yap</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Stillerin senin orijinal kodunla birebir aynıdır, buraya kısaltarak koymadım tam hali duruyor:
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: '#FFFFFF', paddingHorizontal: 32, paddingVertical: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoImage: { width: 120, height: 120 },
  title: { fontSize: 28, fontWeight: '700', color: '#1E40AF', textAlign: 'center', marginBottom: 8, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 16, height: 52 },
  inputIcon: { marginRight: 12, fontSize: 18 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  eyeIcon: { padding: 4 },
  registerButton: { backgroundColor: '#2563EB', borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginBottom: 24, marginTop: 8 },
  registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 8 },
  loginLinkText: { fontSize: 14, color: '#6B7280' },
  loginLinkBold: { color: '#2563EB', fontWeight: '600' },
});