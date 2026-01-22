# Periodontitis Teşhis Backend API

Python FastAPI ile geliştirilmiş yapay zeka destekli periodontitis teşhis backend API'si.

## Kurulum

1. Python 3.8+ yüklü olmalı

2. Sanal ortam oluşturun (önerilen):
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# veya
venv\Scripts\activate  # Windows
```

3. Bağımlılıkları yükleyin:
```bash
cd backend
pip install -r requirements.txt
```

4. Environment variables (opsiyonel):
`.env` dosyası oluşturun:
```env
MODELS_PATH=./models/trained_models/
```

## Çalıştırma

```bash
python main.py
```

veya

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API dokümantasyonu: http://localhost:8000/docs

## Model Entegrasyonu

### Görüntü Modelleri (Tamamlandı ✅)

Görüntü modelleri entegre edilmiştir. Model dosyalarınızı `backend/models/trained_models/` klasörüne yerleştirin:

- **`xray_disease_model.pt`**: Hastalık teşhisi modeli (3 sınıf: Sağlıklı, Gingivitis, Periodontitis)
- **`xray_stage_model.pt`**: Evre tespiti modeli (2 sınıf: Moderate, Severe)

Model dosyaları PyTorch state_dict formatında olmalıdır (`.pt` uzantılı).

### Ölçüm Modelleri (Beklemede)

Ölçüm modelleri (XGBoost) için entegrasyon yapılacak. CAL verisi preprocessing tamamlandığında eklenecek.

### Model Yükleme

Modeller otomatik olarak `DiagnosisService` başlatıldığında yüklenir. Model yolu environment variable ile değiştirilebilir:

```bash
export MODELS_PATH="./models/trained_models/"
```

Veya `.env` dosyasında:
```
MODELS_PATH=./models/trained_models/
```

## API Endpoint'leri

- `GET /` - API bilgisi
- `GET /health` - Sağlık kontrolü
- `POST /api/diagnosis` - Teşhis endpoint'i
- `GET /docs` - Swagger dokümantasyonu

## Model Örnekleri

### TensorFlow/Keras:
```python
import tensorflow as tf
self.measurements_model = tf.keras.models.load_model("path/to/model.h5")
prediction = self.measurements_model.predict(features)
```

### PyTorch:
```python
import torch
self.xray_model = torch.load("path/to/model.pth")
self.xray_model.eval()
with torch.no_grad():
    prediction = self.xray_model(torch.tensor(image))
```

### Scikit-learn:
```python
import joblib
self.measurements_model = joblib.load("path/to/model.pkl")
prediction = self.measurements_model.predict_proba(features)
```
