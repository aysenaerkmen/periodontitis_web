"""
Model yükleme test scripti
Backend başlatılmadan önce modellerin doğru yüklenip yüklenmediğini kontrol eder
"""
import os
import sys

# Model yollarını kontrol et
models_path = os.path.join(os.path.dirname(__file__), "models", "trained_models")
disease_model_path = os.path.join(models_path, "xray_disease_model.pt")
stage_model_path = os.path.join(models_path, "xray_stage_model.pt")

print("=" * 50)
print("Model Dosya Kontrolü")
print("=" * 50)

# Dosya varlığını kontrol et
print(f"\n1. Hastalık modeli dosyası:")
if os.path.exists(disease_model_path):
    size = os.path.getsize(disease_model_path) / (1024 * 1024)  # MB
    print(f"   ✅ Bulundu: {disease_model_path}")
    print(f"   📦 Boyut: {size:.2f} MB")
else:
    print(f"   ❌ Bulunamadı: {disease_model_path}")

print(f"\n2. Evre modeli dosyası:")
if os.path.exists(stage_model_path):
    size = os.path.getsize(stage_model_path) / (1024 * 1024)  # MB
    print(f"   ✅ Bulundu: {stage_model_path}")
    print(f"   📦 Boyut: {size:.2f} MB")
else:
    print(f"   ❌ Bulunamadı: {stage_model_path}")

# PyTorch ve timm kontrolü
print(f"\n3. Bağımlılık kontrolü:")
try:
    import torch
    print(f"   ✅ PyTorch: {torch.__version__}")
except ImportError:
    print(f"   ❌ PyTorch yüklü değil")

try:
    import timm
    print(f"   ✅ timm: {timm.__version__}")
except ImportError:
    print(f"   ❌ timm yüklü değil")

# Model yükleme testi
print(f"\n4. Model yükleme testi:")
if os.path.exists(disease_model_path) and os.path.exists(stage_model_path):
    try:
        import torch
        from models.xray_model import SwinEfficientNetHybrid
        
        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        print(f"   🔧 Device: {device}")
        
        # Hastalık modeli
        print(f"\n   Hastalık modeli yükleniyor...")
        disease_model = SwinEfficientNetHybrid(num_classes=3)
        disease_model.load_state_dict(torch.load(disease_model_path, map_location=device))
        disease_model.to(device)
        disease_model.eval()
        print(f"   ✅ Hastalık modeli başarıyla yüklendi")
        
        # Evre modeli
        print(f"\n   Evre modeli yükleniyor...")
        stage_model = SwinEfficientNetHybrid(num_classes=2)
        stage_model.load_state_dict(torch.load(stage_model_path, map_location=device))
        stage_model.to(device)
        stage_model.eval()
        print(f"   ✅ Evre modeli başarıyla yüklendi")
        
        print(f"\n{'=' * 50}")
        print("✅ TÜM KONTROLLER BAŞARILI!")
        print("   Modeller başarıyla yüklendi, backend başlatılabilir.")
        print(f"{'=' * 50}")
        
    except Exception as e:
        print(f"   ❌ Model yükleme hatası: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
else:
    print(f"   ⚠️  Model dosyaları bulunamadı, yükleme testi atlandı")
    sys.exit(1)
