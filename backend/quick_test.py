"""
Hızlı model yükleme testi
"""
import sys
import os

# Backend klasörünü path'e ekle
sys.path.insert(0, os.path.dirname(__file__))

try:
    print("DiagnosisService import ediliyor...")
    from models.diagnosis_service import DiagnosisService
    
    print("\nDiagnosisService başlatılıyor (modeller yüklenecek)...")
    service = DiagnosisService()
    
    print("\n" + "="*50)
    print("Model Durumu:")
    print("="*50)
    print(f"Hastalik modeli: {'YUKLU' if service.xray_disease_model else 'YUKLENEMEDI'}")
    print(f"Evre modeli: {'YUKLU' if service.xray_stage_model else 'YUKLENEMEDI'}")
    print("="*50)
    
    if service.xray_disease_model and service.xray_stage_model:
        print("\nTUM MODELLER BASARIYLA YUKLENDI!")
        print("Backend baslatilabilir.")
    else:
        print("\nUYARI: Bazi modeller yuklenemedi. Lutfen kontrol edin.")
        
except Exception as e:
    print(f"\nHATA: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
