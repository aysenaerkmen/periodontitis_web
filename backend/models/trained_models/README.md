# Model Dosyaları

Bu klasöre eğitilmiş model dosyalarınızı yerleştirin.

## Görüntü Modelleri (PyTorch)

### Hastalık Teşhisi Modeli
- **Dosya adı**: `xray_disease_model.pt`
- **Açıklama**: Röntgen görüntülerinden hastalık teşhisi yapan model (3 sınıf: Sağlıklı, Gingivitis, Periodontitis)
- **Model mimarisi**: SwinEfficientNetHybrid
- **Sınıf sayısı**: 3

### Evre Tespiti Modeli
- **Dosya adı**: `xray_stage_model.pt`
- **Açıklama**: Periodontitis teşhisi alanlar için evre tespiti yapan model (2 sınıf: Moderate, Severe)
- **Model mimarisi**: SwinEfficientNetHybrid
- **Sınıf sayısı**: 2

## Model Yükleme

Modeller otomatik olarak `DiagnosisService` başlatıldığında yüklenir.

Model yolu environment variable ile değiştirilebilir:
```bash
export MODELS_PATH="./models/trained_models/"
```

Veya `.env` dosyasında:
```
MODELS_PATH=./models/trained_models/
```

## Notlar

- Model dosyaları PyTorch state_dict formatında olmalıdır (`.pt` uzantılı)
- Model dosyaları Google Drive'dan indirilip bu klasöre yerleştirilmelidir
- Model dosyaları bulunamazsa, sistem fallback modunda çalışacaktır
