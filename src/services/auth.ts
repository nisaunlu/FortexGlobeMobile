// src/services/auth.ts

// iOS Simülatör için:
const API_URL = 'http://localhost:5210/api/auth';
// Android kullanıyorsan üsttekini yorum satırı yapıp şunu aç:
// const API_URL = 'http://10.0.2.2:5210/api/auth';

// YENİ HALİ: Tüm form verilerini tek bir "userData" objesi olarak alıyoruz
export const registerUser = async (userData: any) => {  
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // VERİYİ TEK PARÇA HALİNDE GÖNDERİYORUZ
      body: JSON.stringify(userData),
    });

    // 2. C#'tan dönen "Ham" cevabı okuyalım
    const rawText = await response.text();
    console.log("Backend'den dönen cevap:", rawText);

    // 3. Eğer C# bizi reddettiyse (400 Bad Request vb.)
    if (!response.ok) {
        let errorMessage = `HTTP Hatası: ${response.status}`;
        try {
            const errorData = JSON.parse(rawText);
            
            // Eğer C# form doğrulama hatası (Örn: Geçersiz URL) verdiyse
            if (errorData.errors) {
                const firstErrorKey = Object.keys(errorData.errors)[0];
                errorMessage = errorData.errors[firstErrorKey][0]; // Tam hatayı al (Örn: "Geçerli bir URL giriniz")
            } 
            // Eğer özel bir mesajımız varsa (Örn: "Bu email zaten kayıtlı")
            else if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch (error) {
            errorMessage = rawText || errorMessage;
        }
        
        // Yakaladığımız TAM hatayı ekrana fırlat
        throw new Error(errorMessage);
    }

    return JSON.parse(rawText);
  } catch (error) {
    throw error;
  }
};
// GİRİŞ KISMI AYNI KALDI
export const loginUser = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        // Eğer C# form doğrulama hatası verdiyse (Örn: Geçersiz URL)
        if (data.errors) {
          // Hatalar listesindeki ilk hatanın ilk mesajını alıp gösteriyoruz
          const firstErrorKey = Object.keys(data.errors)[0];
          const firstErrorMessage = data.errors[firstErrorKey][0];
          throw new Error(firstErrorMessage);
        }
        
        // Standart hata mesajları
        throw new Error(data.message || 'Kayıt olurken bir hata oluştu.');
      }
  
      return data; // Başarılıysa Token ve Kullanıcı bilgilerini döner
    } catch (error) {
      console.error("Giriş Hatası:", error);
      throw error;
    }
};