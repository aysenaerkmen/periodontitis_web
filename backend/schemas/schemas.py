from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class ThreePointMeasurement(BaseModel):
    mesial: float | str = Field(default="")
    central: float | str = Field(default="")
    distal: float | str = Field(default="")


class BuccalMeasurements(BaseModel):
    furcation: str = Field(default="")
    gingivalMargin: ThreePointMeasurement
    probingDepth: ThreePointMeasurement
    bop: ThreePointMeasurement
    pi: ThreePointMeasurement


class LingualMeasurements(BaseModel):
    furcation: str = Field(default="")
    gingivalMargin: ThreePointMeasurement
    probingDepth: ThreePointMeasurement
    pi: ThreePointMeasurement
    bop: ThreePointMeasurement


class ToothMeasurement(BaseModel):
    toothNumber: int = Field(ge=1, le=32)
    isMissing: bool = Field(default=False)
    mobility: str | int = Field(default="")
    implantat: bool = Field(default=False)
    buccal: BuccalMeasurements
    lingual: LingualMeasurements
    notes: Optional[str] = None


class MeasurementData(BaseModel):
    patientName: str
    patientAge: int = Field(ge=0)
    patientGender: Literal["male", "female", "other"]
    teeth: List[ToothMeasurement]
    notes: Optional[str] = None


class ModelResult(BaseModel):
    """Tek bir modelin teşhis sonucu"""
    disease: str  # "Sağlıklı", "Gingivitis", "Periodontitis"
    confidence: float = Field(ge=0.0, le=1.0)
    stage: Optional[str] = None  # "moderate" veya "severe" (sadece Periodontitis için)


class DiagnosisResponse(BaseModel):
    # Ortak karar (ağırlıklandırılmış fusion sonucu)
    diagnosis: str
    confidence: float = Field(ge=0.0, le=1.0)
    # severity açıklaması:
    # - "mild": Gingivitis veya Sağlıklı için (evre modeli çalışmaz)
    # - "moderate" veya "severe": Periodontitis için (evre modelinden döner)
    severity: Literal["mild", "moderate", "severe"]
    
    # Ayrı model sonuçları (sadece 'both' modunda dolu olur)
    measurements_result: Optional[ModelResult] = None
    xray_result: Optional[ModelResult] = None
