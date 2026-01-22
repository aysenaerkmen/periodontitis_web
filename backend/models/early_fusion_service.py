import os
import json
import torch
import joblib
import numpy as np
from PIL import Image
from torchvision import transforms
from typing import Optional, Dict, Any
from models.early_fusion_model import ConvNextFeatureExtractor
from models.data_processor import DataProcessor
from schemas.schemas import DiagnosisResponse, ModelResult

class EarlyFusionService:
    """Yöntem 1: ConvNext (Görüntü) + 169 CAL Feature -> Scaler -> Random Forest"""
    
    def __init__(self):
        self.data_processor = DataProcessor()
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.models_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "trained_models"))
        
        # Model ve Scaler dosyaları
        self.rf_model = None
        self.scaler = None
        self.extractor = None
        
        self._load_models()

    def _load_models(self):
        try:
            # ConvNext Extractor
            self.extractor = ConvNextFeatureExtractor().to(self.device)
            
            # RF ve Scaler yolları
            rf_path = os.path.join(self.models_path, "fusion_rf_model.pkl")
            scaler_path = os.path.join(self.models_path, "fusion_scaler.pkl")
            
            if os.path.exists(rf_path):
                self.rf_model = joblib.load(rf_path)
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
            print("Yöntem 1 (Early Fusion) modelleri yüklendi.")
        except Exception as e:
            print(f"Yöntem 1 model yükleme hatası: {e}")

    async def get_diagnosis(self, measurements: Dict[str, Any], xray_image_bytes: bytes) -> DiagnosisResponse:
        # 1. CAL Verisini Hazırla (169 feature)
        processed_m = self.data_processor.process_measurements(measurements)
        cal_vector = self._extract_169_features(processed_m)

        # 2. Görüntü Özniteliklerini Çıkar
        processed_img = self.data_processor.process_xray_image(xray_image_bytes)
        img_tensor = self._prepare_tensor(processed_img).to(self.device)
        img_features = self.extractor(img_tensor).cpu().numpy()

        # 3. Birleştirme (Concatenation)
        fused_vector = np.concatenate([img_features, cal_vector], axis=1)

        # 4. Scaling (Sütun bazlı)
        if self.scaler:
            fused_vector = self.scaler.transform(fused_vector)

        # 5. Random Forest Tahmini
        if self.rf_model:
            proba = self.rf_model.predict_proba(fused_vector)[0]
            class_idx = np.argmax(proba)
            confidence = float(proba[class_idx])
            
            classes = ["Sağlıklı", "Gingivitis", "Periodontitis"]
            disease = classes[class_idx]
            
            diagnosis = disease
            if disease == "Periodontitis":
                diagnosis = "Orta Periodontitis" # RF modeline göre özelleştirilebilir
            
            return DiagnosisResponse(
                diagnosis=diagnosis,
                confidence=confidence,
                severity="moderate" if class_idx == 2 else "mild"
            )
        
        raise Exception("Yöntem 1 modeli yüklü değil.")

    def _extract_169_features(self, processed_data: Dict) -> np.ndarray:
        """Mevcut DiagnosisService içindeki 169'luk feature listesini oluşturur"""
        # (Burada DiagnosisService._extract_features_from_measurements metodundaki 
        # pd_17_db ... bop_oran mantığının aynısı yer alacak)
        # Özetle: 28 diş * 6 PD noktası + 1 BOP Oranı = 169 giriş.
        pass

    def _prepare_tensor(self, img: Image.Image):
        transform = transforms.Compose([
            transforms.Resize([224, 224]),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        return transform(img).unsqueeze(0)
