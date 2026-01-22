import axios from 'axios'
import { MeasurementData, DiagnosisResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export type DiagnosisType = 'measurements' | 'xray' | 'both'

/**
 * AI API'sine teşhis isteği gönderir
 * @param measurements Diş ölçüm verileri (opsiyonel)
 * @param xrayFile Röntgen görüntü dosyası (opsiyonel)
 * @param diagnosisType Teşhis tipi: 'measurements', 'xray', veya 'both'
 * @returns Teşhis sonuçları
 */
export async function getDiagnosis(
  diagnosisType: DiagnosisType,
  measurements?: MeasurementData,
  xrayFile?: File
): Promise<DiagnosisResponse> {
  const formData = new FormData()
  
  if (xrayFile) {
    formData.append('xray', xrayFile)
  }
  
  if (measurements && measurements.teeth.length > 0) {
    formData.append('measurements', JSON.stringify(measurements))
  }
  
  formData.append('diagnosisType', diagnosisType)

  try {
    const response = await axios.post<DiagnosisResponse>(
      `${API_BASE_URL}/diagnosis`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 saniye timeout (AI işlemleri uzun sürebilir)
      }
    )

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message || 'Teşhis sırasında bir hata oluştu'
      const statusCode = error.response?.status
      
      // Özel hata mesajları
      if (statusCode === 400) {
        throw new Error('Geçersiz veri formatı. Lütfen verilerinizi kontrol edin.')
      } else if (statusCode === 413) {
        throw new Error('Görüntü dosyası çok büyük. Lütfen daha küçük bir dosya yükleyin.')
      } else if (statusCode === 500) {
        throw new Error('Sunucu hatası. Lütfen daha sonra tekrar deneyin.')
      } else if (statusCode === 503) {
        throw new Error('AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.')
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.')
      }
      
      throw new Error(errorMessage)
    }
    throw error
  }
}

/**
 * Sadece diş ölçümleri ile teşhis alır
 */
export async function getDiagnosisFromMeasurements(
  measurements: MeasurementData
): Promise<DiagnosisResponse> {
  return getDiagnosis('measurements', measurements, undefined)
}

/**
 * Sadece röntgen görüntüsü ile teşhis alır
 */
export async function getDiagnosisFromXRay(
  xrayFile: File
): Promise<DiagnosisResponse> {
  return getDiagnosis('xray', undefined, xrayFile)
}

/**
 * Her iki veri ile birlikte teşhis alır
 */
export async function getDiagnosisFromBoth(
  measurements: MeasurementData,
  xrayFile: File
): Promise<DiagnosisResponse> {
  return getDiagnosis('both', measurements, xrayFile)
}

/**
 * Sağlık kontrolü için ping endpoint
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`)
    return response.status === 200
  } catch {
    return false
  }
}
