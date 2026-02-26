// src/services/auth.ts

// iOS Simülatör için:
const API_URL = 'http://localhost:5210/api/auth';
// Android kullanıyorsan üsttekini yorum satırı yapıp şunu aç:
// const API_URL = 'http://10.0.2.2:5210/api/auth';

export const registerUser = async (fullName: string, email: string, password: string, companyName: string = "") => {  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Backend'deki RegisterDto'nun beklediği değişken isimleriyle birebir aynı olmalı
      body: JSON.stringify({
        fullName: fullName,
        email: email,
        password: password,
        companyName: companyName
      }),
    });

    // API'den dönen JSON cevabını okuyoruz
    const data = await response.json();

    // Eğer backend'den "BadRequest" veya "Unauthorized" (Örn: Email zaten var) dönerse
    if (!response.ok) {
        throw new Error(data.message || 'Kayıt olurken bir hata oluştu.');
    }

    return data; // { message: "Kayıt işlemi başarılı!..." } dönecektir
  } catch (error) {
    console.error("Kayıt Hatası:", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Giriş yaparken bir hata oluştu.');
      }
  
      return data; // Başarılıysa Token ve Kullanıcı bilgilerini döner
    } catch (error) {
      console.error("Giriş Hatası:", error);
      throw error;
    }
  };