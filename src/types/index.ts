// Diş numaraları: 1-16 (üst çene), 17-32 (alt çene)

// 3 nokta ölçümü (mesial, central, distal)
export interface ThreePointMeasurement {
  mesial: number | string // mm veya boş
  central: number | string // mm veya boş
  distal: number | string // mm veya boş
}

// Buccal (Yanak) tarafı ölçümleri
export interface BuccalMeasurements {
  furcation: string // Grade: I, II, III veya boş
  gingivalMargin: ThreePointMeasurement // mm
  probingDepth: ThreePointMeasurement // mm
  bop: ThreePointMeasurement // Bleeding On Probing (boolean veya sayı)
  pi: ThreePointMeasurement // Plaque Index (0-3)
}

// Lingual (Dil) tarafı ölçümleri
export interface LingualMeasurements {
  furcation: string // Grade: I, II, III veya boş
  gingivalMargin: ThreePointMeasurement // mm
  probingDepth: ThreePointMeasurement // mm
  pi: ThreePointMeasurement // Plaque Index (0-3)
  bop: ThreePointMeasurement // Bleeding On Probing (boolean veya sayı)
}

export interface ToothMeasurement {
  toothNumber: number // 1-32
  isMissing: boolean // Diş eksik mi? - Öncelikli kontrol
  mobility: number | string // 0-3 veya boş - Tüm diş için geçerli (diş mevcut ise)
  implantat: boolean // Var/Yok - Tüm diş için geçerli (diş mevcut ise)
  buccal: BuccalMeasurements // Diş mevcut ise
  lingual: LingualMeasurements // Diş mevcut ise
  notes?: string
}

export interface MeasurementData {
  patientName: string
  patientAge: number
  patientGender: 'male' | 'female' | 'other'
  teeth: ToothMeasurement[] // 32 diş için ölçümler
  notes?: string
}

export interface ModelResult {
  disease: string // "Sağlıklı", "Gingivitis", "Periodontitis"
  confidence: number
  stage?: string // "moderate" veya "severe" (sadece Periodontitis için)
}

export interface DiagnosisResponse {
  // Ortak karar (ağırlıklandırılmış fusion sonucu)
  diagnosis: string
  confidence: number
  severity: 'mild' | 'moderate' | 'severe'
  
  // Ayrı model sonuçları (sadece 'both' modunda dolu olur)
  measurements_result?: ModelResult | null
  xray_result?: ModelResult | null
}
