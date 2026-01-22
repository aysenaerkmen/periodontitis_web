import { useState } from 'react'
import Header from './components/Header'
import MeasurementForm from './components/MeasurementForm'
import XRayUpload from './components/XRayUpload'
import DiagnosisResult from './components/DiagnosisResult'
import { MeasurementData, DiagnosisResponse } from './types'
import { 
  getDiagnosisFromMeasurements, 
  getDiagnosisFromXRay, 
  getDiagnosisFromBoth 
} from './services/api'

function App() {
  const [measurements, setMeasurements] = useState<MeasurementData | null>(null)
  const [xrayFile, setXrayFile] = useState<File | null>(null)
  const [xrayPreview, setXrayPreview] = useState<string | null>(null)
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const teethCount = measurements?.teeth?.length ?? 0

  const handleMeasurementSubmit = (data: MeasurementData) => {
    setMeasurements(data)
  }

  const handleXRayUpload = (file: File) => {
    setXrayFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setXrayPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDiagnosis = async (diagnosisType: 'measurements' | 'xray' | 'both') => {
    // Validasyon
    if (diagnosisType === 'measurements' && (!measurements || teethCount === 0)) {
      alert('Lütfen en az bir diş için ölçüm girin.')
      return
    }

    if (diagnosisType === 'xray' && !xrayFile) {
      alert('Lütfen röntgen görüntüsünü yükleyin.')
      return
    }

    if (diagnosisType === 'both' && (!measurements || !xrayFile)) {
      alert('Lütfen ölçümleri girin ve röntgen görüntüsünü yükleyin.')
      return
    }

    setIsLoading(true)
    try {
      let result: DiagnosisResponse

      // AI API'sine istek gönder
      if (diagnosisType === 'measurements' && measurements) {
        result = await getDiagnosisFromMeasurements(measurements)
      } else if (diagnosisType === 'xray' && xrayFile) {
        result = await getDiagnosisFromXRay(xrayFile)
      } else if (diagnosisType === 'both' && measurements && xrayFile) {
        result = await getDiagnosisFromBoth(measurements, xrayFile)
      } else {
        throw new Error('Geçersiz teşhis tipi veya eksik veri')
      }

      setDiagnosis(result)
    } catch (error) {
      console.error('Teşhis hatası:', error)
      const errorMessage = error instanceof Error ? error.message : 'Teşhis sırasında bir hata oluştu'
      alert(`Hata: ${errorMessage}`)
      // Hata durumunda önceki teşhisi temizle
      setDiagnosis(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setMeasurements(null)
    setXrayFile(null)
    setXrayPreview(null)
    setDiagnosis(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Periodontitis Teşhis Sistemi
          </h1>
          <p className="text-gray-600">
            Diş ölçümlerinizi girin, röntgen görüntüsünü yükleyin ve yapay zeka destekli teşhis alın.
          </p>
        </div>

        <div className="space-y-6 mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Diş Ölçümleri
            </h2>
            <MeasurementForm onSubmit={handleMeasurementSubmit} />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Röntgen Görüntüsü
            </h2>
            <XRayUpload onUpload={handleXRayUpload} preview={xrayPreview} />
          </div>
        </div>

        {(teethCount > 0 || xrayFile) && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Teşhis İşlemi
              </h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Sıfırla
              </button>
            </div>

            {/* Durum Bilgisi */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Mevcut Veriler:</strong>
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                {teethCount > 0 && (
                  <span className="flex items-center text-green-700">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Diş Ölçümleri ({teethCount} diş)
                  </span>
                )}
                {xrayFile && (
                  <span className="flex items-center text-green-700">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Röntgen Görüntüsü
                  </span>
                )}
              </div>
            </div>

            {/* Teşhis Butonları */}
            <div className="space-y-3">
              {teethCount > 0 && (
                <button
                  onClick={() => handleDiagnosis('measurements')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
                >
                  {isLoading ? 'Teşhis yapılıyor...' : '📊 Diş Ölçümleri ile Teşhis Al'}
                </button>
              )}

              {xrayFile && (
                <button
                  onClick={() => handleDiagnosis('xray')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
                >
                  {isLoading ? 'Teşhis yapılıyor...' : '🖼️ Röntgen Görüntüsü ile Teşhis Al'}
                </button>
              )}

              {teethCount > 0 && xrayFile && (
                <button
                  onClick={() => handleDiagnosis('both')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl border-2 border-blue-400"
                >
                  {isLoading ? 'Teşhis yapılıyor...' : '🎯 Her İkisi ile Teşhis Al (En Yüksek Doğruluk)'}
                </button>
              )}
            </div>

            {teethCount > 0 && xrayFile && (
              <p className="mt-3 text-xs text-gray-500 text-center">
                💡 İpucu: Her iki veriyi birlikte kullanarak daha yüksek doğrulukta teşhis alabilirsiniz.
              </p>
            )}
          </div>
        )}

        {diagnosis && (
          <DiagnosisResult diagnosis={diagnosis} />
        )}
      </main>
    </div>
  )
}

export default App
