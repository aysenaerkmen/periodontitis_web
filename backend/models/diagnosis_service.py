from typing import Optional, Dict, Any, Tuple
from schemas.schemas import DiagnosisResponse, ModelResult
from models.data_processor import DataProcessor
from models.xray_model import SwinEfficientNetHybrid
import numpy as np
import os
import pickle
import json
import torch
from torchvision import transforms
from PIL import Image
import joblib

try:
    import xgboost as xgb
except Exception:
    xgb = None


class DiagnosisService:
    """AI modelleri ile teşhis yapan servis"""
    
    def __init__(self):
        self.data_processor = DataProcessor()
        
        # Model yolları - absolute path kullan
        default_path = os.path.join(os.path.dirname(__file__), "trained_models")
        self.models_path = os.getenv("MODELS_PATH", default_path)
        # Path'i normalize et
        self.models_path = os.path.abspath(self.models_path)
        print(f"Model yolu: {self.models_path}")
        
        # Device (CPU veya CUDA)
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        print(f"Model device: {self.device}")
        
        # 4 Model:
        # 1. measurements_disease_model: Diş ölçümlerinden hastalık teşhisi (Periodontitis/Gingivitis/Sağlıklı)
        # 2. measurements_stage_model: Periodontitis ise evre tespiti (Moderate/Severe)
        # 3. xray_disease_model: Röntgenden hastalık teşhisi (Periodontitis/Gingivitis/Sağlıklı)
        # 4. xray_stage_model: Periodontitis ise evre tespiti (Moderate/Severe)
        
        self.measurements_disease_model = None  # XGBoost
        self.measurements_stage_model = None    # XGBoost
        self.measurements_disease_scaler = None
        self.xray_disease_model = None          # Hibrit model (PyTorch)
        self.xray_stage_model = None            # Hibrit model (PyTorch)

        # Measurement evre modeli (XGBoost save_model() ile üretilen .json)
        # Dosyayı `backend/models/trained_models/` klasörüne koyun.
        # Varsayılan dosya adı: measurements_stage_model.json
        self.measurements_stage_model_filename = os.getenv(
            "MEASUREMENTS_STAGE_MODEL",
            "measurements_stage_model.json"
        )
        # Measurement hastalık (SVM) model + scaler
        self.measurements_disease_model_filename = os.getenv(
            "MEASUREMENTS_DISEASE_MODEL",
            "measurements_disease_model.pkl"
        )
        self.measurements_disease_scaler_filename = os.getenv(
            "MEASUREMENTS_DISEASE_SCALER",
            "measurements_disease_scaler.pkl"
        )

        # Feature sırası (Excel'deki pd_*/bop_* kolonları)
        self.measurements_feature_names = [
            'pd_17_db', 'pd_17_b', 'pd_17_mb', 'pd_17_dp', 'pd_17_p', 'pd_17_mp',
            'pd_16_db', 'pd_16_b', 'pd_16_mb', 'pd_16_dp', 'pd_16_p', 'pd_16_mp',
            'pd_15_db', 'pd_15_b', 'pd_15_mb', 'pd_15_dp', 'pd_15_p', 'pd_15_mp',
            'pd_14_db', 'pd_14_b', 'pd_14_mb', 'pd_14_dp', 'pd_14_p', 'pd_14_mp',
            'pd_13_db', 'pd_13_b', 'pd_13_mb', 'pd_13_dp', 'pd_13_p', 'pd_13_mp',
            'pd_12_db', 'pd_12_b', 'pd_12_mb', 'pd_12_dp', 'pd_12_p', 'pd_12_mp',
            'pd_11_db', 'pd_11_b', 'pd_11_mb', 'pd_11_dp', 'pd_11_p', 'pd_11_mp',
            'pd_27_db', 'pd_27_b', 'pd_27_mb', 'pd_27_dp', 'pd_27_p', 'pd_27_mp',
            'pd_26_db', 'pd_26_b', 'pd_26_mb', 'pd_26_dp', 'pd_26_p', 'pd_26_mp',
            'pd_25_db', 'pd_25_b', 'pd_25_mb', 'pd_25_dp', 'pd_25_p', 'pd_25_mp',
            'pd_24_db', 'pd_24_b', 'pd_24_mb', 'pd_24_dp', 'pd_24_p', 'pd_24_mp',
            'pd_23_db', 'pd_23_b', 'pd_23_mb', 'pd_23_dp', 'pd_23_p', 'pd_23_mp',
            'pd_22_db', 'pd_22_b', 'pd_22_mb', 'pd_22_dp', 'pd_22_p', 'pd_22_mp',
            'pd_21_db', 'pd_21_b', 'pd_21_mb', 'pd_21_dp', 'pd_21_p', 'pd_21_mp',
            'pd_37_db', 'pd_37_b', 'pd_37_mb', 'pd_37_dl', 'pd_37_l', 'pd_37_ml',
            'pd_36_db', 'pd_36_b', 'pd_36_mb', 'pd_36_dl', 'pd_36_l', 'pd_36_ml',
            'pd_35_db', 'pd_35_b', 'pd_35_mb', 'pd_35_dl', 'pd_35_l', 'pd_35_ml',
            'pd_34_db', 'pd_34_b', 'pd_34_mb', 'pd_34_dl', 'pd_34_l', 'pd_34_ml',
            'pd_33_db', 'pd_33_b', 'pd_33_mb', 'pd_33_dl', 'pd_33_l', 'pd_33_ml',
            'pd_32_db', 'pd_32_b', 'pd_32_mb', 'pd_32_dl', 'pd_32_l', 'pd_32_ml',
            'pd_31_db', 'pd_31_b', 'pd_31_mb', 'pd_31_dl', 'pd_31_l', 'pd_31_ml',
            'pd_47_db', 'pd_47_b', 'pd_47_mb', 'pd_47_dl', 'pd_47_l', 'pd_47_ml',
            'pd_46_db', 'pd_46_b', 'pd_46_mb', 'pd_46_dl', 'pd_46_l', 'pd_46_ml',
            'pd_45_db', 'pd_45_b', 'pd_45_mb', 'pd_45_dl', 'pd_45_l', 'pd_45_ml',
            'pd_44_db', 'pd_44_b', 'pd_44_mb', 'pd_44_dl', 'pd_44_l', 'pd_44_ml',
            'pd_43_db', 'pd_43_b', 'pd_43_mb', 'pd_43_dl', 'pd_43_l', 'pd_43_ml',
            'pd_42_db', 'pd_42_b', 'pd_42_mb', 'pd_42_dl', 'pd_42_l', 'pd_42_ml',
            'pd_41_db', 'pd_41_b', 'pd_41_mb', 'pd_41_dl', 'pd_41_l', 'pd_41_ml',
            'bop_oran',
        ]
        
        # Sınıf eşlemesi (Notebook'taki [1, 2, 3] → Backend'deki isimler)
        self.disease_class_names = ["Sağlıklı", "Gingivitis", "Periodontitis"]
        self.stage_class_names = ["moderate", "severe"]
        
        self._load_models()
    
    def _load_models(self):
        """Eğitilmiş modelleri yükler"""
        try:
            # Ölçüm modelleri
            self._load_measurements_disease_model()
            self._load_measurements_stage_model()
            
            # Görüntü modelleri (Hibrit) - ÖNCE BUNLARLA BAŞLIYORUZ
            self._load_xray_models()
            
            print("Görüntü modelleri yükleme denemesi tamamlandı")
            
        except Exception as e:
            print(f"Model yükleme hatası: {str(e)}")
            print("UYARI: Modeller yüklenemedi, fallback mod kullanılacak")

    def _load_measurements_disease_model(self):
        """Ölçüm hastalık modelini (SVM) ve scaler'ı yükler."""
        try:
            # Model
            model_path = os.path.join(self.models_path, self.measurements_disease_model_filename)
            if os.path.exists(model_path):
                self.measurements_disease_model = joblib.load(model_path)
                print(f"Ölçüm hastalık modeli yüklendi: {model_path}")
            else:
                print(f"UYARI: Ölçüm hastalık modeli bulunamadı: {model_path}")
                self.measurements_disease_model = None

            # Scaler
            scaler_path = os.path.join(self.models_path, self.measurements_disease_scaler_filename)
            if os.path.exists(scaler_path):
                self.measurements_disease_scaler = joblib.load(scaler_path)
                print(f"Ölçüm scaler yüklendi: {scaler_path}")
            else:
                print(f"UYARI: Ölçüm scaler bulunamadı: {scaler_path}")
                self.measurements_disease_scaler = None
        except Exception as e:
            print(f"Ölçüm hastalık modeli yükleme hatası: {str(e)}")
            self.measurements_disease_model = None
            self.measurements_disease_scaler = None

    def _load_measurements_stage_model(self):
        """Ölçüm evre modelini yükler (XGBoost JSON)."""
        try:
            if xgb is None:
                print("UYARI: xgboost import edilemedi. Ölçüm evre modeli yüklenmeyecek.")
                self.measurements_stage_model = None
                return

            model_path = os.path.join(self.models_path, self.measurements_stage_model_filename)
            if not os.path.exists(model_path):
                print(f"UYARI: Ölçüm evre modeli bulunamadı: {model_path}")
                self.measurements_stage_model = None
                return

            model = xgb.XGBClassifier()
            model.load_model(model_path)
            self.measurements_stage_model = model
            print(f"Ölçüm evre modeli yüklendi: {model_path}")
        except Exception as e:
            print(f"Ölçüm evre modeli yükleme hatası: {str(e)}")
            self.measurements_stage_model = None
    
    def _load_xray_models(self):
        """Röntgen görüntü modellerini yükler (Hibrit modeller - PyTorch)"""
        try:
            # Hastalık teşhisi modeli (3 sınıf: Sağlıklı, Gingivitis, Periodontitis)
            disease_model_path = os.path.join(self.models_path, "xray_disease_model.pt")
            if os.path.exists(disease_model_path):
                print(f"Hastalık modeli yükleniyor: {disease_model_path}")
                self.xray_disease_model = SwinEfficientNetHybrid(num_classes=3)
                self.xray_disease_model.load_state_dict(
                    torch.load(disease_model_path, map_location=self.device)
                )
                self.xray_disease_model.to(self.device)
                self.xray_disease_model.eval()
                print("Hastalık modeli başarıyla yüklendi")
            else:
                print(f"UYARI: Hastalık modeli bulunamadı: {disease_model_path}")
                self.xray_disease_model = None
            
            # Evre tespiti modeli (2 sınıf: Moderate, Severe)
            stage_model_path = os.path.join(self.models_path, "xray_stage_model.pt")
            if os.path.exists(stage_model_path):
                print(f"Evre modeli yükleniyor: {stage_model_path}")
                self.xray_stage_model = SwinEfficientNetHybrid(num_classes=2)
                self.xray_stage_model.load_state_dict(
                    torch.load(stage_model_path, map_location=self.device)
                )
                self.xray_stage_model.to(self.device)
                self.xray_stage_model.eval()
                print("Evre modeli başarıyla yüklendi")
            else:
                print(f"UYARI: Evre modeli bulunamadı: {stage_model_path}")
                self.xray_stage_model = None
            
        except Exception as e:
            print(f"Görüntü model yükleme hatası: {str(e)}")
            import traceback
            traceback.print_exc()
            self.xray_disease_model = None
            self.xray_stage_model = None
    
    async def get_diagnosis(
        self,
        diagnosis_type: str,
        measurements: Optional[Dict[str, Any]] = None,
        xray_image: Optional[bytes] = None
    ) -> DiagnosisResponse:
        """
        AI modelleri ile teşhis yapar
        
        Akış:
        1. Önce hastalık teşhisi (Periodontitis/Gingivitis/Sağlıklı)
        2. Eğer Periodontitis ise, evre tespiti (Moderate/Severe)
        
        Args:
            diagnosis_type: 'measurements', 'xray', veya 'both'
            measurements: Raw measurement data (dict)
            xray_image: Röntgen görüntüsü (bytes)
            
        Returns:
            DiagnosisResponse: Teşhis sonuçları
        """
        try:
            if diagnosis_type == 'measurements':
                return await self._diagnose_from_measurements(measurements)
            elif diagnosis_type == 'xray':
                return await self._diagnose_from_xray(xray_image)
            elif diagnosis_type == 'both':
                return await self._diagnose_from_both(measurements, xray_image)
            else:
                raise ValueError(f"Geçersiz diagnosis_type: {diagnosis_type}")
                
        except Exception as e:
            raise Exception(f"Teşhis hatası: {str(e)}")
    
    async def _diagnose_from_measurements(
        self,
        measurements: Dict[str, Any]
    ) -> DiagnosisResponse:
        """
        Sadece diş ölçümlerinden teşhis yapar
        
        Akış:
        1. measurements_disease_model ile hastalık teşhisi
        2. Eğer Periodontitis ise, measurements_stage_model ile evre tespiti
        """
        # Veriyi işle
        processed_data = self.data_processor.process_measurements(measurements)
        
        # Feature extraction
        features = self._extract_features_from_measurements(processed_data)
        
        # 1. ADIM: Hastalık teşhisi (Periodontitis/Gingivitis/Sağlıklı)
        if self.measurements_disease_model:
            disease_result = self._predict_disease_from_measurements(features)
        else:
            # Fallback
            disease_result = self._fallback_disease_diagnosis(processed_data)
        
        # Parse disease result
        disease_type = disease_result.get("disease", "Sağlıklı")  # Periodontitis, Gingivitis, veya Sağlıklı
        disease_confidence = disease_result.get("confidence", 0.75)
        
        # 2. ADIM: Eğer Periodontitis ise, evre tespiti (Moderate/Severe)
        severity = "mild"  # Default
        stage_result = None
        if disease_type == "Periodontitis":
            if self.measurements_stage_model:
                stage_result = self._predict_stage_from_measurements(features)
            else:
                # Fallback
                stage_result = self._fallback_stage_diagnosis(processed_data)
            
            severity = stage_result.get("stage", "moderate")  # moderate veya severe
        
        # Sonuç formatla
        measurements_model_result = ModelResult(
            disease=disease_type,
            confidence=disease_confidence,
            stage=stage_result.get("stage") if stage_result else None
        )
        
        return self._format_diagnosis_response(
            disease=disease_type,
            severity=severity,
            confidence=disease_confidence,
            measurements_result=measurements_model_result,
            xray_result=None
        )
    
    async def _diagnose_from_xray(
        self,
        xray_image: bytes
    ) -> DiagnosisResponse:
        """
        Sadece röntgen görüntüsünden teşhis yapar
        
        Akış:
        1. xray_disease_model ile hastalık teşhisi
        2. Eğer Periodontitis ise, xray_stage_model ile evre tespiti
        """
        # Görüntüyü işle (PIL Image olarak döner)
        processed_image = self.data_processor.process_xray_image(xray_image)
        
        # Model için hazırla (PyTorch Tensor)
        model_input = self._prepare_image_for_model(processed_image)
        
        # 1. ADIM: Hastalık teşhisi
        if self.xray_disease_model:
            disease_result = self._predict_disease_from_xray(model_input)
        else:
            # Fallback
            disease_result = self._fallback_disease_diagnosis_xray()
        
        disease_type = disease_result.get("disease", "Sağlıklı")
        disease_confidence = disease_result.get("confidence", 0.70)
        
        # 2. ADIM: Eğer Periodontitis ise, evre tespiti
        # NOT: Sadece Periodontitis teşhisi alanlar için evre modeline gönderilir
        severity = "mild"  # Default (Sağlıklı veya Gingivitis için)
        stage_result = None
        if disease_type == "Periodontitis":
            # Periodontitis teşhisi alındı, evre modeline gönder
            if self.xray_stage_model:
                stage_result = self._predict_stage_from_xray(model_input)
            else:
                # Fallback
                stage_result = self._fallback_stage_diagnosis_xray()
            
            # Evre modeli sadece "moderate" veya "severe" döndürür
            severity = stage_result.get("stage", "moderate")
        
        # Sonuç formatla
        xray_model_result = ModelResult(
            disease=disease_type,
            confidence=disease_confidence,
            stage=stage_result.get("stage") if stage_result else None
        )
        
        return self._format_diagnosis_response(
            disease=disease_type,
            severity=severity,
            confidence=disease_confidence,
            measurements_result=None,
            xray_result=xray_model_result
        )
    
    async def _diagnose_from_both(
        self,
        measurements: Dict[str, Any],
        xray_image: bytes
    ) -> DiagnosisResponse:
        """
        Her iki veriden birlikte teşhis yapar (ağırlıklandırılmış fusion)
        
        Ağırlıklandırma:
        - CAL verisi (measurements): 0.6 ağırlık
        - Röntgen görüntüsü (xray): 0.4 ağırlık
        """
        # Her iki veriyi de işle
        processed_measurements = self.data_processor.process_measurements(measurements)
        processed_image = self.data_processor.process_xray_image(xray_image)
        
        # Ölçümlerden teşhis
        measurements_features = self._extract_features_from_measurements(processed_measurements)
        measurements_disease_result = None
        measurements_stage_result = None
        
        if self.measurements_disease_model:
            measurements_disease_result = self._predict_disease_from_measurements(measurements_features)
            # Periodontitis ise evre tahmini de al
            if measurements_disease_result.get("disease") == "Periodontitis":
                measurements_stage_result = self._predict_stage_from_measurements(measurements_features)
        
        # Röntgenden teşhis
        image_input = self._prepare_image_for_model(processed_image)
        xray_disease_result = None
        xray_stage_result = None
        
        if self.xray_disease_model:
            xray_disease_result = self._predict_disease_from_xray(image_input)
            # Periodontitis ise evre tahmini de al
            if xray_disease_result.get("disease") == "Periodontitis":
                xray_stage_result = self._predict_stage_from_xray(image_input)
        else:
            xray_disease_result = self._fallback_disease_diagnosis_xray()
        
        # Ayrı model sonuçlarını ModelResult formatına çevir
        measurements_model_result = None
        if measurements_disease_result:
            measurements_model_result = ModelResult(
                disease=measurements_disease_result.get("disease", "Sağlıklı"),
                confidence=measurements_disease_result.get("confidence", 0.0),
                stage=measurements_stage_result.get("stage") if measurements_stage_result else None
            )
        
        xray_model_result = None
        if xray_disease_result:
            xray_model_result = ModelResult(
                disease=xray_disease_result.get("disease", "Sağlıklı"),
                confidence=xray_disease_result.get("confidence", 0.0),
                stage=xray_stage_result.get("stage") if xray_stage_result else None
            )
        
        # Ağırlıklandırılmış fusion
        # Sınıf indeksleri: 0=Sağlıklı, 1=Gingivitis, 2=Periodontitis
        class_to_idx = {"Sağlıklı": 0, "Gingivitis": 1, "Periodontitis": 2}
        
        # Her iki modelin olasılık vektörlerini oluştur
        measurements_probs = np.zeros(3)
        xray_probs = np.zeros(3)
        
        if measurements_disease_result:
            m_disease = measurements_disease_result.get("disease", "Sağlıklı")
            m_conf = measurements_disease_result.get("confidence", 0.0)
            m_idx = class_to_idx.get(m_disease, 0)
            measurements_probs[m_idx] = m_conf
            # Diğer sınıflara kalan olasılığı dağıt
            remaining = (1.0 - m_conf) / 2.0
            for i in range(3):
                if i != m_idx:
                    measurements_probs[i] = remaining
        
        if xray_disease_result:
            x_disease = xray_disease_result.get("disease", "Sağlıklı")
            x_conf = xray_disease_result.get("confidence", 0.0)
            x_idx = class_to_idx.get(x_disease, 0)
            xray_probs[x_idx] = x_conf
            # Diğer sınıflara kalan olasılığı dağıt
            remaining = (1.0 - x_conf) / 2.0
            for i in range(3):
                if i != x_idx:
                    xray_probs[i] = remaining
        
        # Ağırlıklandırılmış toplam: 0.6 * measurements + 0.4 * xray
        weight_measurements = 0.6
        weight_xray = 0.4
        fused_probs = weight_measurements * measurements_probs + weight_xray * xray_probs
        
        # En yüksek olasılıklı sınıfı seç
        fused_class_idx = int(np.argmax(fused_probs))
        fused_confidence = float(fused_probs[fused_class_idx])
        fused_disease = self.disease_class_names[fused_class_idx]
        
        # Evre tespiti (Periodontitis ise)
        severity = "mild"
        if fused_disease == "Periodontitis":
            # Her iki modelden evre tahminlerini ağırlıklandır
            stage_probs = np.zeros(2)  # 0=moderate, 1=severe
            
            if measurements_stage_result:
                m_stage = measurements_stage_result.get("stage", "moderate")
                m_stage_conf = measurements_stage_result.get("confidence", 0.5)
                m_stage_idx = 0 if m_stage == "moderate" else 1
                stage_probs[m_stage_idx] += weight_measurements * m_stage_conf
                stage_probs[1 - m_stage_idx] += weight_measurements * (1.0 - m_stage_conf)
            
            if xray_stage_result:
                x_stage = xray_stage_result.get("stage", "moderate")
                x_stage_conf = xray_stage_result.get("confidence", 0.5)
                x_stage_idx = 0 if x_stage == "moderate" else 1
                stage_probs[x_stage_idx] += weight_xray * x_stage_conf
                stage_probs[1 - x_stage_idx] += weight_xray * (1.0 - x_stage_conf)
            
            # Eğer hiçbir model evre tahmini yapmadıysa fallback
            if np.sum(stage_probs) == 0:
                severity = "moderate"
            else:
                fused_stage_idx = int(np.argmax(stage_probs))
                severity = self.stage_class_names[fused_stage_idx]
        
        return self._format_diagnosis_response(
            disease=fused_disease,
            severity=severity,
            confidence=fused_confidence,
            measurements_result=measurements_model_result,
            xray_result=xray_model_result
        )
    
    def _combine_stage_predictions(
        self,
        measurements_features: np.ndarray,
        image_input: torch.Tensor,
        processed_measurements: Optional[Dict] = None
    ) -> Dict:
        """Her iki modelden evre tahminlerini birleştir"""
        # TODO: Fusion stratejisi (daha sonra eklenecek)
        # Şimdilik: Ölçüm modeli öncelikli, yoksa röntgen
        if self.measurements_stage_model and processed_measurements:
            return self._predict_stage_from_measurements(measurements_features)
        elif self.xray_stage_model:
            # Röntgen modelinden evre tahmini
            return self._predict_stage_from_xray(image_input)
        else:
            # Fallback
            if processed_measurements:
                return self._fallback_stage_diagnosis(processed_measurements)
            return {"stage": "moderate"}

    def _predict_stage_from_measurements(self, features: np.ndarray) -> Dict:
        """
        Ölçüm feature'larından evre tahmini (XGBoost 2-class).

        Beklenen:
        - predict_proba -> [prob_moderate, prob_severe]
        """
        try:
            if self.measurements_stage_model is None:
                return {"stage": "moderate", "confidence": 0.65}

            proba = self.measurements_stage_model.predict_proba(features)
            # shape: (1,2)
            prob_moderate = float(proba[0][0])
            prob_severe = float(proba[0][1])
            idx = 0 if prob_moderate >= prob_severe else 1
            stage = self.stage_class_names[idx]
            confidence = max(prob_moderate, prob_severe)
            return {"stage": stage, "confidence": confidence}
        except Exception as e:
            print(f"Ölçüm evre tahmin hatası: {str(e)}")
            return {"stage": "moderate", "confidence": 0.60}

    def _predict_disease_from_measurements(self, features: np.ndarray) -> Dict:
        """
        Ölçüm feature'larından hastalık teşhisi (SVM 3-class).
        """
        try:
            if self.measurements_disease_model is None:
                return self._fallback_disease_diagnosis({})

            model_input = features
            if self.measurements_disease_scaler:
                model_input = self.measurements_disease_scaler.transform(features)

            class_idx = 0
            confidence = 0.70

            if hasattr(self.measurements_disease_model, "predict_proba"):
                proba = self.measurements_disease_model.predict_proba(model_input)
                class_idx = int(np.argmax(proba[0]))
                confidence = float(proba[0][class_idx])
            else:
                pred = self.measurements_disease_model.predict(model_input)[0]
                class_idx = int(pred) if isinstance(pred, (int, float)) else 0
                confidence = 0.70

            # Model classes_ ile eşleşme
            if hasattr(self.measurements_disease_model, "classes_"):
                classes = list(self.measurements_disease_model.classes_)
                if class_idx < len(classes):
                    mapped = classes[class_idx]
                    if isinstance(mapped, (int, float)):
                        class_idx = int(mapped)

            disease = self.disease_class_names[class_idx] if class_idx < len(self.disease_class_names) else "Sağlıklı"
            return {"disease": disease, "confidence": confidence}
        except Exception as e:
            print(f"Ölçüm hastalık tahmin hatası: {str(e)}")
            return self._fallback_disease_diagnosis({})
    
    def _extract_features_from_measurements(self, processed_data: Dict) -> np.ndarray:
        """
        Ölçüm verilerinden model için feature vector çıkarır
        
        Eğitimdeki sıralama ile birebir aynı: pd_* kolonları ve son olarak bop_oran.
        """
        try:
            feature_dict = {name: 0.0 for name in self.measurements_feature_names}
            stats = processed_data.get("statistics", {})
            teeth_data = processed_data.get("teeth_data", [])
            excluded = set(processed_data.get("excluded_teeth", []))

            def set_feature(name: str, value: Any):
                if name in feature_dict and isinstance(value, (int, float)):
                    feature_dict[name] = float(value)

            def simple_to_fdi(simple_num: int) -> int:
                if 1 <= simple_num <= 8:
                    return 10 + simple_num
                if 9 <= simple_num <= 16:
                    return 20 + (simple_num - 8)
                if 17 <= simple_num <= 24:
                    return 30 + (simple_num - 16)
                if 25 <= simple_num <= 32:
                    return 40 + (simple_num - 24)
                return simple_num

            for tooth in teeth_data:
                simple_num = tooth.get("tooth_number")
                if simple_num in excluded:
                    continue
                fdi = simple_to_fdi(simple_num)

                probing = tooth.get("probing_depth", {})
                buccal = probing.get("buccal", {}) or {}
                lingual = probing.get("lingual", {}) or {}

                # Buccal: mb/b/db -> mesial/central/distal buccal
                set_feature(f"pd_{fdi}_mb", buccal.get("mesial"))
                set_feature(f"pd_{fdi}_b", buccal.get("central"))
                set_feature(f"pd_{fdi}_db", buccal.get("distal"))

                # Lingual/Palatal: üst çenede dp/p/mp, alt çenede dl/l/ml
                if 11 <= fdi <= 28:  # üst çene
                    set_feature(f"pd_{fdi}_mp", lingual.get("mesial"))
                    set_feature(f"pd_{fdi}_p", lingual.get("central"))
                    set_feature(f"pd_{fdi}_dp", lingual.get("distal"))
                elif 31 <= fdi <= 48:  # alt çene
                    set_feature(f"pd_{fdi}_ml", lingual.get("mesial"))
                    set_feature(f"pd_{fdi}_l", lingual.get("central"))
                    set_feature(f"pd_{fdi}_dl", lingual.get("distal"))

            # BOP oranı (yüzde)
            set_feature("bop_oran", stats.get("bop_percentage", 0))

            ordered = [feature_dict[name] for name in self.measurements_feature_names]
            return np.array(ordered).reshape(1, -1)
        except Exception as e:
            print(f"Feature extraction hatası: {str(e)}")
            # Fallback: doğru uzunlukta sıfırlar
            return np.zeros((1, len(self.measurements_feature_names)))
    
    def _prepare_image_for_model(self, image: Image.Image) -> torch.Tensor:
        """
        Görüntüyü hibrit model için hazırlar (Notebook'taki preprocessing ile aynı)
        
        Notebook'taki test transform:
        - Resize([224, 224])
        - ToTensor()
        - Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        """
        # Notebook'taki test transform pipeline'ı
        transform = transforms.Compose([
            transforms.Resize([224, 224]),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        # Transform uygula ve batch dimension ekle
        image_tensor = transform(image).unsqueeze(0)  # [1, 3, 224, 224]
        
        return image_tensor.to(self.device)
    
    def _fallback_disease_diagnosis(self, processed_data: Dict) -> Dict:
        """Fallback hastalık teşhisi (ölçümlerden)"""
        stats = processed_data.get("statistics", {})
        max_pd = stats.get("max_pocket_depth", 0)
        
        if max_pd >= 3:
            return {"disease": "Periodontitis", "confidence": 0.75}
        elif max_pd >= 1:
            return {"disease": "Gingivitis", "confidence": 0.70}
        else:
            return {"disease": "Sağlıklı", "confidence": 0.80}
    
    def _fallback_disease_diagnosis_xray(self) -> Dict:
        """Fallback hastalık teşhisi (röntgenden)"""
        return {"disease": "Sağlıklı", "confidence": 0.70}
    
    def _fallback_stage_diagnosis(self, processed_data: Dict) -> Dict:
        """Fallback evre tespiti (ölçümlerden)"""
        stats = processed_data.get("statistics", {})
        max_pd = stats.get("max_pocket_depth", 0)
        
        if max_pd >= 7:
            return {"stage": "severe"}
        elif max_pd >= 5:
            return {"stage": "moderate"}
        else:
            return {"stage": "moderate"}  # Periodontitis varsa en az moderate
    
    def _fallback_stage_diagnosis_xray(self) -> Dict:
        """Fallback evre tespiti (röntgenden)"""
        return {"stage": "moderate"}
    
    def _predict_disease_from_xray(self, model_input: torch.Tensor) -> Dict:
        """
        Röntgen görüntüsünden hastalık teşhisi yapar (xray_disease_model)
        
        Notebook'taki tahmin mantığı ile aynı:
        - model.eval() modunda
        - torch.no_grad() ile inference
        - torch.max() ile sınıf tahmini
        - Softmax ile probability
        """
        try:
            if self.xray_disease_model is None:
                return self._fallback_disease_diagnosis_xray()
            
            # Notebook'taki tahmin mantığı
            with torch.no_grad():
                predictions = self.xray_disease_model(model_input)
                probabilities = torch.softmax(predictions, dim=1)
                predicted_class_idx = torch.argmax(probabilities, dim=1).item()
                confidence = float(probabilities[0][predicted_class_idx])
            
            # Sınıf eşlemesi: Notebook'taki [1, 2, 3] → Backend'deki isimler
            # Model çıktısı 0-indexed: 0=1, 1=2, 2=3
            # Ama bizim class_names zaten doğru sırada: ["Sağlıklı", "Gingivitis", "Periodontitis"]
            disease = self.disease_class_names[predicted_class_idx]
            
            return {
                "disease": disease,
                "confidence": confidence
            }
            
        except Exception as e:
            print(f"Görüntü hastalık tahmin hatası: {str(e)}")
            import traceback
            traceback.print_exc()
            return self._fallback_disease_diagnosis_xray()
    
    def _predict_stage_from_xray(self, model_input: torch.Tensor) -> Dict:
        """
        Röntgen görüntüsünden evre tespiti yapar (xray_stage_model)
        Sadece Periodontitis teşhisi alanlar için kullanılır.
        
        Notebook'taki tahmin mantığı ile aynı
        """
        try:
            if self.xray_stage_model is None:
                return self._fallback_stage_diagnosis_xray()
            
            # Notebook'taki tahmin mantığı
            with torch.no_grad():
                predictions = self.xray_stage_model(model_input)
                probabilities = torch.softmax(predictions, dim=1)
                predicted_class_idx = torch.argmax(probabilities, dim=1).item()
                confidence = float(probabilities[0][predicted_class_idx])
            
            # Sınıf eşlemesi: ["moderate", "severe"]
            stage = self.stage_class_names[predicted_class_idx]
            
            return {
                "stage": stage,
                "confidence": confidence
            }
            
        except Exception as e:
            print(f"Görüntü evre tahmin hatası: {str(e)}")
            import traceback
            traceback.print_exc()
            return self._fallback_stage_diagnosis_xray()
    
    def _format_diagnosis_response(
        self,
        disease: str,
        severity: str,
        confidence: float,
        measurements_result: Optional[ModelResult] = None,
        xray_result: Optional[ModelResult] = None
    ) -> DiagnosisResponse:
        """
        Model tahminini DiagnosisResponse formatına çevirir
        """
        # Diagnosis string oluştur
        if disease == "Periodontitis":
            # Evre modeli sadece "moderate" veya "severe" döndürür
            if severity == "severe":
                diagnosis = "Şiddetli Periodontitis"
            elif severity == "moderate":
                diagnosis = "Orta Periodontitis"
            else:
                # Fallback: Eğer beklenmeyen bir değer gelirse moderate kabul et
                diagnosis = "Orta Periodontitis"
                severity = "moderate"
        elif disease == "Gingivitis":
            diagnosis = "Gingivitis"
            severity = "mild"  # Gingivitis için severity mild
        else:
            diagnosis = "Sağlıklı"
            severity = "mild"
        
        return DiagnosisResponse(
            diagnosis=diagnosis,
            confidence=confidence,
            severity=severity,
            measurements_result=measurements_result,
            xray_result=xray_result
        )