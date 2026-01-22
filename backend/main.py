from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import json
import uvicorn
from models.diagnosis_service import DiagnosisService
from models.data_processor import DataProcessor
from schemas.schemas import DiagnosisResponse
from models.early_fusion_service import EarlyFusionService
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Periodontitis Teşhis API",
    description="Yapay zeka destekli periodontitis teşhis sistemi backend API",
    version="1.0.0"
)

# CORS ayarları - Frontend'den istek kabul etmek için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servisleri başlat
diagnosis_service = DiagnosisService()
data_processor = DataProcessor()
early_fusion_service = EarlyFusionService()


@app.get("/")
async def root():
    return {
        "message": "Periodontitis Teşhis API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """API sağlık kontrolü"""
    return {"status": "healthy"}


@app.post("/api/diagnosis", response_model=DiagnosisResponse)
async def get_diagnosis(
    diagnosisType: str = Form(...),
    measurements: Optional[str] = Form(None),
    xray: Optional[UploadFile] = File(None)
):
    try:
        # 1. Validasyon listesine 'early_fusion' tipini ekleyin
        valid_types = ['measurements', 'xray', 'both', 'early_fusion']
        if diagnosisType not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Geçersiz diagnosisType. {valid_types} değerlerinden biri olmalı."
            )
        
        # Ölçüm verilerini parse et (mevcut kodunuz)
        measurement_data = None
        if measurements:
            try:
                measurement_data = json.loads(measurements)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="Geçersiz JSON formatı - measurements"
                )
        
        # Röntgen görüntüsünü işle (mevcut kodunuz)
        xray_image = None
        if xray:
            if not xray.content_type or not xray.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=400,
                    detail="Röntgen dosyası bir görüntü dosyası olmalı"
                )
            xray_image = await xray.read()
        
        # 2. Veri işleme ve AI analizi kısmını yeni servisi kapsayacak şekilde güncelleyin
        if diagnosisType == 'early_fusion':
            # Erken füzyon için her iki veri de zorunludur
            if not measurement_data or not xray_image:
                raise HTTPException(
                    status_code=400,
                    detail="Erken füzyon (early_fusion) için hem ölçüm verisi (measurements) hem de röntgen (xray) gereklidir."
                )
            # Yeni servisi (Yöntem 1) çağırın
            result = await early_fusion_service.get_diagnosis(measurement_data, xray_image)
        else:
            # Mevcut yöntemleri (measurements, xray, both) çağıran kısım
            result = await diagnosis_service.get_diagnosis(
                diagnosis_type=diagnosisType,
                measurements=measurement_data,
                xray_image=xray_image
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Teşhis hatası: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Teşhis işlemi sırasında bir hata oluştu: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
