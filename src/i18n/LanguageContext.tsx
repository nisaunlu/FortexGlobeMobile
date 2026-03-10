import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tr } from './tr';
import { en } from './en';

// Sözlükleri birleştiriyoruz
const dictionaries: any = { tr, en };

export const LanguageContext = createContext<any>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<'tr' | 'en'>('tr'); // Varsayılan Türkçe

  // Uygulama açıldığında hafızadaki dili yükle
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      if (savedLanguage) {
        setLanguageState(savedLanguage as 'tr' | 'en');
      }
    };
    loadLanguage();
  }, []);

  // Dil değiştirme fonksiyonu (Hem state'i günceller hem hafızaya yazar)
  const setLanguage = async (lang: 'tr' | 'en') => {
    setLanguageState(lang);
    await AsyncStorage.setItem('userLanguage', lang);
  };

  // Çeviri fonksiyonu t('home.greeting') şeklinde çalışır
  const t = (key: string) => {
    const keys = key.split('.');
    let value = dictionaries[language];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Çeviri bulunamazsa anahtarın kendisini göster
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);