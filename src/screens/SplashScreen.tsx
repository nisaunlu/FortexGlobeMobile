import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Image, StatusBar } from "react-native";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

interface SplashScreenProps {
  navigation: SplashScreenNavigationProp;
}

export default function SplashScreen({ navigation }: SplashScreenProps) {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fadeIn = (v: Animated.Value, delay: number) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 650,
        delay,
        useNativeDriver: true,
      });

    Animated.sequence([fadeIn(a1, 150), fadeIn(a2, 250), fadeIn(a3, 250)]).start();

    // Animasyonlar bittikten sonra (yaklaşık 2.5 saniye) Login ekranına geç
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [a1, a2, a3, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.top}>
        <Image source={require("/Users/nisaunlu/Desktop/FortexGlobeMobile/src/assets/logo3.png")} style={styles.logo} />
      </View>

      <View style={styles.bottom}>
        <Animated.Text style={[styles.text, { opacity: a1 }]}>
          Dünyaya Açılan Kapınız.
        </Animated.Text>
        <Animated.Text style={[styles.text, { opacity: a2 }]}>
          Yeni pazarları keşfet.
        </Animated.Text>
        <Animated.Text style={[styles.text, { opacity: a3 }]}>
          Ticaretini büyüt.
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingTop: 56, paddingHorizontal: 20 },
  top: { alignItems: "center", justifyContent: "flex-start", paddingTop: 8 },
  logo: { width: 220, height: 220, resizeMode: "contain" },
  bottom: { flex: 1, justifyContent: "flex-end", paddingBottom: 44 },
  text: { fontSize: 16, lineHeight: 22, color: "#111827", textAlign: "center", marginVertical: 6, fontWeight: "600" },
});