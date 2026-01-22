import { DiagnosisResponse, ModelResult } from '../types'

interface DiagnosisResultProps {
  diagnosis: DiagnosisResponse
}

function DiagnosisResult({ diagnosis }: DiagnosisResultProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'moderate':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'severe':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'mild':
        return 'Hafif'
      case 'moderate':
        return 'Orta'
      case 'severe':
        return 'Şiddetli'
      default:
        return severity
    }
  }

  const getDiseaseText = (disease: string) => {
    switch (disease) {
      case 'Sağlıklı':
        return 'Sağlıklı'
      case 'Gingivitis':
        return 'Gingivitis'
      case 'Periodontitis':
        return 'Periodontitis'
      default:
        return disease
    }
  }

  const renderModelResult = (result: ModelResult, title: string, bgColor: string, borderColor: string, barColor: string) => {
    return (
      <div className={`${bgColor} rounded-lg p-4 border-l-4 ${borderColor}`}>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-gray-600">Teşhis:</span>
            <p className="text-lg font-bold text-gray-800">{getDiseaseText(result.disease)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-600">Güven Skoru:</span>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`${barColor} h-2 rounded-full transition-all`}
                  style={{ width: `${result.confidence * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {(result.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          {result.stage && (
            <div>
              <span className="text-xs text-gray-600">Evre:</span>
              <p className="text-sm font-semibold text-gray-800">
                {result.stage === 'moderate' ? 'Orta' : 'Şiddetli'}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Teşhis Sonuçları
      </h2>

      <div className="space-y-6">
        {/* Ortak Karar (Ağırlıklandırılmış Fusion) */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Ortak Karar (Ağırlıklandırılmış)</h3>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-800">{diagnosis.diagnosis}</h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold border ${getSeverityColor(
                diagnosis.severity
              )}`}
            >
              {getSeverityText(diagnosis.severity)}
            </span>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <span className="text-sm text-gray-600">Güven Skoru:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${diagnosis.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {(diagnosis.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Ayrı Model Sonuçları (sadece 'both' modunda gösterilir) */}
        {(diagnosis.measurements_result || diagnosis.xray_result) && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ayrı Model Sonuçları</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diagnosis.measurements_result && 
                renderModelResult(
                  diagnosis.measurements_result, 
                  'CAL Verisi Modeli', 
                  'bg-green-50', 
                  'border-green-500',
                  'bg-green-600'
                )
              }
              {diagnosis.xray_result && 
                renderModelResult(
                  diagnosis.xray_result, 
                  'Röntgen Görüntüsü Modeli', 
                  'bg-purple-50', 
                  'border-purple-500',
                  'bg-purple-600'
                )
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiagnosisResult
