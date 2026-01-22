# Periodontitis Teşhis Sistemi

Diş doktorları için yapay zeka destekli periodontitis teşhis sistemi. Bu web uygulaması, diş ölçümlerini ve röntgen görüntülerini analiz ederek teşhis önerileri sunar.

## Özellikler

- 📊 **Diş Ölçümleri Girişi**: Hasta bilgileri ve detaylı diş ölçümlerini kaydetme
- 🖼️ **Röntgen Görüntüsü Yükleme**: Drag & drop ile kolay görüntü yükleme
- 🤖 **AI Destekli Teşhis**: Yapay zeka ile otomatik teşhis ve öneriler
- 📱 **Modern ve Responsive Tasarım**: Tüm cihazlarda mükemmel görünüm

## Teknolojiler

- **React 18** - Modern UI framework
- **TypeScript** - Tip güvenliği
- **Vite** - Hızlı build tool
- **Tailwind CSS** - Utility-first CSS framework

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

3. Tarayıcınızda `http://localhost:5173` adresine gidin.

## Build

Production build için:
```bash
npm run build
```

Build edilmiş dosyalar `dist` klasöründe oluşturulacaktır.

## AI API Entegrasyonu

Sistem artık gerçek AI API'si ile entegre edilmiştir. Backend API'nizi yapılandırmak için:

1. `.env.example` dosyasını `.env` olarak kopyalayın:
```bash
cp .env.example .env
```

2. `.env` dosyasında backend API URL'inizi ayarlayın:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

3. Backend API'nizin şu endpoint'i desteklemesi gerekiyor:
   - **POST** `/api/diagnosis` - Teşhis endpoint'i
   - **GET** `/api/health` - Sağlık kontrolü (opsiyonel)

### API Request Format

Backend API'nize gönderilecek request formatı:

```javascript
FormData {
  diagnosisType: 'measurements' | 'xray' | 'both',
  measurements?: JSON string,  // Diş ölçüm verileri (opsiyonel)
  xray?: File                  // Röntgen görüntü dosyası (opsiyonel)
}
```

### API Response Format

Backend API'nizden beklenen response formatı:

```typescript
{
  diagnosis: string,
  confidence: number,        // 0-1 arası
  severity: 'mild' | 'moderate' | 'severe',
  recommendations: string[],
  details: {
    pocketDepth: string,
    boneLoss: string,
    inflammation: string
  }
}
```

### Hata Yönetimi

Sistem aşağıdaki HTTP status kodlarını özel olarak handle eder:
- **400**: Geçersiz veri formatı
- **413**: Dosya çok büyük
- **500**: Sunucu hatası
- **503**: Servis kullanılamıyor
- **Timeout**: İstek zaman aşımı (60 saniye)

Detaylı API entegrasyon örnekleri için `src/services/api.ts` dosyasına bakabilirsiniz.

## Kullanım

1. Hasta bilgilerini ve diş ölçümlerini form üzerinden girin
2. (Opsiyonel) Röntgen görüntüsünü yükleyin (sürükle-bırak veya dosya seç)
3. Teşhis almak için bir seçenek seçin:
   - 📊 **Diş Ölçümleri ile Teşhis**: Sadece ölçüm verileri ile
   - 🖼️ **Röntgen Görüntüsü ile Teşhis**: Sadece röntgen ile
   - 🎯 **Her İkisi ile Teşhis**: En yüksek doğruluk için her iki veri birlikte
4. Teşhis sonuçlarını ve önerileri görüntüleyin

## Proje Yapısı

```
src/
├── components/          # React bileşenleri
│   ├── Header.tsx
│   ├── MeasurementForm.tsx
│   ├── XRayUpload.tsx
│   └── DiagnosisResult.tsx
├── types/              # TypeScript tip tanımları
│   └── index.ts
├── services/           # API servisleri
│   └── api.ts
├── App.tsx             # Ana uygulama bileşeni
├── main.tsx            # Giriş noktası
└── index.css           # Global stiller
```

## Lisans

Bu proje eğitim amaçlıdır.
