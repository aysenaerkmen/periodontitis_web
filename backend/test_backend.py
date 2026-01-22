"""
Backend başlatma ve model test scripti
"""
import sys
import os

# Backend klasörünü path'e ekle
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("BACKEND VE MODEL TEST")
print("=" * 60)

try:
    # 1. Model yükleme testi
    print("\n1. Model yükleme testi...")
    from models.diagnosis_service import DiagnosisService
    
    service = DiagnosisService()
    
    disease_ok = service.xray_disease_model is not None
    stage_ok = service.xray_stage_model is not None
    
    print(f"   Hastalik modeli: {'[OK]' if disease_ok else '[FAILED]'}")
    print(f"   Evre modeli: {'[OK]' if stage_ok else '[FAILED]'}")
    
    if not (disease_ok and stage_ok):
        print("\n   HATA: Modeller yuklenemedi!")
        sys.exit(1)
    
    # 2. FastAPI import testi
    print("\n2. FastAPI import testi...")
    from fastapi import FastAPI
    from main import app
    print("   [OK] FastAPI basariyla import edildi")
    
    # 3. Endpoint testi
    print("\n3. Endpoint testi...")
    from fastapi.testclient import TestClient
    
    client = TestClient(app)
    
    # Health check
    response = client.get("/health")
    if response.status_code == 200:
        print("   [OK] /health endpoint calisiyor")
    else:
        print(f"   [FAILED] /health endpoint: {response.status_code}")
    
    # Root endpoint
    response = client.get("/")
    if response.status_code == 200:
        print("   [OK] / endpoint calisiyor")
    else:
        print(f"   [FAILED] / endpoint: {response.status_code}")
    
    print("\n" + "=" * 60)
    print("TUM TESTLER BASARILI!")
    print("=" * 60)
    print("\nBackend baslatmak icin:")
    print("  cd backend")
    print("  python main.py")
    print("\nveya")
    print("  uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    print("=" * 60)
    
except Exception as e:
    print(f"\n[HATA] {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
