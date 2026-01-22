import { useState, FormEvent, useMemo } from 'react'
import { MeasurementData, ToothMeasurement } from '../types'
import ToothChart from './ToothChart'
import ToothMeasurementForm from './ToothMeasurementForm'

interface MeasurementFormProps {
  onSubmit: (data: MeasurementData) => void
}

function MeasurementForm({ onSubmit }: MeasurementFormProps) {
  const [patientInfo, setPatientInfo] = useState({
    patientName: '',
    patientAge: 0,
    patientGender: 'male' as 'male' | 'female' | 'other',
    notes: '',
  })

  const [teethMeasurements, setTeethMeasurements] = useState<Map<number, ToothMeasurement>>(
    new Map()
  )

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [showToothForm, setShowToothForm] = useState(false)

  const handlePatientInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setPatientInfo(prev => ({
      ...prev,
      [name]:
        name === 'patientAge' ? parseFloat(value) || 0 : value,
    }))
  }

  const handleToothSelect = (toothNumber: number) => {
    setSelectedTooth(toothNumber)
    setShowToothForm(true)
  }

  const handleToothSave = (data: ToothMeasurement) => {
    setTeethMeasurements(prev => {
      const newMap = new Map(prev)
      newMap.set(data.toothNumber, data)
      return newMap
    })
    setShowToothForm(false)
    setSelectedTooth(null)
  }

  const handleToothCancel = () => {
    setShowToothForm(false)
    setSelectedTooth(null)
  }

  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    // 32 diş için veri kontrolü
    if (teethMeasurements.size === 0) {
      setSaveStatus({
        type: 'error',
        message: 'Lütfen en az bir diş için ölçüm girin.'
      })
      setTimeout(() => setSaveStatus({ type: null, message: '' }), 5000)
      return
    }

    if (teethMeasurements.size < 32) {
      const missingTeeth = []
      for (let i = 1; i <= 32; i++) {
        if (!teethMeasurements.has(i)) {
          missingTeeth.push(i)
        }
      }
      setSaveStatus({
        type: 'error',
        message: `Eksik diş ölçümleri var! ${teethMeasurements.size}/32 diş için ölçüm girildi. Eksik dişler: ${missingTeeth.slice(0, 10).join(', ')}${missingTeeth.length > 10 ? '...' : ''}`
      })
      setTimeout(() => setSaveStatus({ type: null, message: '' }), 7000)
      return
    }

    // Tüm dişler için veri kontrolü - eksik dişler hariç, mevcut dişler için en az bir probing depth değeri olmalı
    let hasIncompleteData = false
    const incompleteTeeth: number[] = []
    
    teethMeasurements.forEach((measurement, toothNum) => {
      // Eksik dişler için ölçüm kontrolü yapma
      if (measurement.isMissing) {
        return
      }

      const buccalPD = measurement.buccal.probingDepth
      const lingualPD = measurement.lingual.probingDepth
      
      const hasBuccalData = 
        (typeof buccalPD.mesial === 'number' && buccalPD.mesial > 0) ||
        (typeof buccalPD.central === 'number' && buccalPD.central > 0) ||
        (typeof buccalPD.distal === 'number' && buccalPD.distal > 0)
      
      const hasLingualData = 
        (typeof lingualPD.mesial === 'number' && lingualPD.mesial > 0) ||
        (typeof lingualPD.central === 'number' && lingualPD.central > 0) ||
        (typeof lingualPD.distal === 'number' && lingualPD.distal > 0)
      
      if (!hasBuccalData && !hasLingualData) {
        hasIncompleteData = true
        incompleteTeeth.push(toothNum)
      }
    })

    if (hasIncompleteData) {
      setSaveStatus({
        type: 'error',
        message: `Bazı mevcut dişlerde ölçüm verisi eksik! Lütfen mevcut tüm dişler için en az bir probing depth değeri girin. Eksik ölçümlü dişler: ${incompleteTeeth.slice(0, 10).join(', ')}${incompleteTeeth.length > 10 ? '...' : ''}`
      })
      setTimeout(() => setSaveStatus({ type: null, message: '' }), 7000)
      return
    }

    const measurementData: MeasurementData = {
      ...patientInfo,
      teeth: Array.from(teethMeasurements.values()),
      notes: patientInfo.notes || undefined,
    }

    onSubmit(measurementData)
    
    // Başarı mesajı
    setSaveStatus({
      type: 'success',
      message: `✅ Başarılı! ${teethMeasurements.size} diş için ölçümler kaydedildi.`
    })
    setTimeout(() => setSaveStatus({ type: null, message: '' }), 5000)
  }

  // Diş verilerini renklendirmek için (veri var/yok ve eksik diş kontrolü)
  const toothDataMap = useMemo(() => {
    const map = new Map<number, { hasData: boolean; isMissing?: boolean }>()
    
    teethMeasurements.forEach((measurement) => {
      map.set(measurement.toothNumber, {
        hasData: true,
        isMissing: measurement.isMissing,
      })
    })

    return map
  }, [teethMeasurements])

  const handleDeleteTooth = (toothNumber: number) => {
    setTeethMeasurements(prev => {
      const newMap = new Map(prev)
      newMap.delete(toothNumber)
      return newMap
    })
  }

  return (
    <div className="space-y-6">
      {/* Hasta Bilgileri */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Hasta Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta Adı
            </label>
            <input
              type="text"
              name="patientName"
              value={patientInfo.patientName}
              onChange={handlePatientInfoChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yaş
            </label>
            <input
              type="number"
              name="patientAge"
              value={patientInfo.patientAge}
              onChange={handlePatientInfoChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cinsiyet
            </label>
            <select
              name="patientGender"
              value={patientInfo.patientGender}
              onChange={handlePatientInfoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="male">Erkek</option>
              <option value="female">Kadın</option>
              <option value="other">Diğer</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Genel Notlar
          </label>
          <textarea
            name="notes"
            value={patientInfo.notes}
            onChange={handlePatientInfoChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Diş Haritası */}
      <div>
        <ToothChart
          selectedTooth={selectedTooth}
          onToothSelect={handleToothSelect}
          toothData={toothDataMap}
        />
      </div>

      {/* Diş Ölçüm Formu */}
      {showToothForm && selectedTooth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ToothMeasurementForm
              toothNumber={selectedTooth}
              initialData={teethMeasurements.get(selectedTooth)}
              onSave={handleToothSave}
              onCancel={handleToothCancel}
            />
          </div>
        </div>
      )}

      {/* Ölçüm Yapılan Dişler Listesi */}
      {teethMeasurements.size > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Ölçüm Yapılan Dişler ({teethMeasurements.size}/32)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {Array.from(teethMeasurements.keys())
              .sort((a, b) => a - b)
              .map(toothNumber => {
                const measurement = teethMeasurements.get(toothNumber)!
                const isMissing = measurement.isMissing
                
                // Tüm probing depth değerlerini topla (eksik dişler için değil)
                const allDepths: number[] = []
                if (!isMissing) {
                  const buccalPD = measurement.buccal.probingDepth
                  const lingualPD = measurement.lingual.probingDepth
                  if (typeof buccalPD.mesial === 'number') allDepths.push(buccalPD.mesial)
                  if (typeof buccalPD.central === 'number') allDepths.push(buccalPD.central)
                  if (typeof buccalPD.distal === 'number') allDepths.push(buccalPD.distal)
                  if (typeof lingualPD.mesial === 'number') allDepths.push(lingualPD.mesial)
                  if (typeof lingualPD.central === 'number') allDepths.push(lingualPD.central)
                  if (typeof lingualPD.distal === 'number') allDepths.push(lingualPD.distal)
                }
                const maxPocketDepth = allDepths.length > 0 ? Math.max(...allDepths) : 0
                
                return (
                  <div
                    key={toothNumber}
                    className={`rounded-lg p-2 border-2 flex items-center justify-between ${
                      isMissing 
                        ? 'bg-red-50 border-red-300' 
                        : 'bg-white border-blue-300'
                    }`}
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${isMissing ? 'text-red-800' : 'text-gray-800'}`}>
                          #{toothNumber}
                        </span>
                        {isMissing && (
                          <span className="text-xs text-red-600 font-medium">Eksik</span>
                        )}
                      </div>
                      {!isMissing && (
                        <span className="text-xs text-gray-600">
                          Max: {maxPocketDepth > 0 ? maxPocketDepth.toFixed(1) + 'mm' : '-'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTooth(toothNumber)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Sil"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Kaydet Butonu ve Durum Mesajı */}
      <form onSubmit={handleSubmit}>
        {saveStatus.type && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              saveStatus.type === 'success'
                ? 'bg-green-50 border-2 border-green-500 text-green-800'
                : 'bg-red-50 border-2 border-red-500 text-red-800'
            }`}
          >
            <div className="flex items-center">
              {saveStatus.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">{saveStatus.message}</span>
            </div>
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg"
        >
          Ölçümleri Kaydet ({teethMeasurements.size}/32 diş)
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {teethMeasurements.size < 32 && (
            <span className="text-orange-600 font-medium">
              ⚠️ Tüm 32 diş için ölçüm girişi yapılmalıdır.
            </span>
          )}
          {teethMeasurements.size === 32 && (
            <span className="text-green-600 font-medium">
              ✓ Tüm dişler için ölçüm girişi tamamlandı.
            </span>
          )}
        </p>
      </form>
    </div>
  )
}

export default MeasurementForm
