import { useState, useEffect, FormEvent } from 'react'
import { ToothMeasurement, ThreePointMeasurement } from '../types'
import { toMedicalNumber } from '../utils/toothNumbering'

interface ToothMeasurementFormProps {
  toothNumber: number
  initialData?: ToothMeasurement
  onSave: (data: ToothMeasurement) => void
  onCancel: () => void
}

// Boş 3 nokta ölçümü oluştur
const createEmptyThreePoint = (): ThreePointMeasurement => ({
  mesial: '',
  central: '',
  distal: '',
})

function ToothMeasurementForm({
  toothNumber,
  initialData,
  onSave,
  onCancel,
}: ToothMeasurementFormProps) {
  const [formData, setFormData] = useState<ToothMeasurement>(() => {
    if (initialData) {
      return initialData
    }
    return {
      toothNumber,
      isMissing: false,
      mobility: '',
      implantat: false,
      buccal: {
        furcation: '',
        gingivalMargin: createEmptyThreePoint(),
        probingDepth: createEmptyThreePoint(),
        bop: createEmptyThreePoint(),
        pi: createEmptyThreePoint(),
      },
      lingual: {
        furcation: '',
        gingivalMargin: createEmptyThreePoint(),
        probingDepth: createEmptyThreePoint(),
        pi: createEmptyThreePoint(),
        bop: createEmptyThreePoint(),
      },
      notes: '',
    }
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        toothNumber,
        isMissing: false,
        mobility: '',
        implantat: false,
        buccal: {
          furcation: '',
          gingivalMargin: createEmptyThreePoint(),
          probingDepth: createEmptyThreePoint(),
          bop: createEmptyThreePoint(),
          pi: createEmptyThreePoint(),
        },
        lingual: {
          furcation: '',
          gingivalMargin: createEmptyThreePoint(),
          probingDepth: createEmptyThreePoint(),
          pi: createEmptyThreePoint(),
          bop: createEmptyThreePoint(),
        },
        notes: '',
      })
    }
  }, [toothNumber, initialData])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    // Nested field handling (buccal.xxx veya lingual.xxx)
    if (name.includes('.')) {
      const parts = name.split('.')
      if (parts.length === 2) {
        // buccal.mobility, lingual.furcation gibi
        const [side, field] = parts
        setFormData(prev => ({
          ...prev,
          [side]: {
            ...prev[side as keyof typeof prev] as any,
            [field]: type === 'checkbox' ? checked : value,
          },
        }))
      } else if (parts.length === 3) {
        // buccal.probingDepth.mesial gibi
        const [side, section, point] = parts
        setFormData(prev => {
          const sideData = prev[side as 'buccal' | 'lingual']
          const sectionData = sideData[section as keyof typeof sideData] as ThreePointMeasurement
          return {
            ...prev,
            [side]: {
              ...sideData,
              [section]: {
                ...sectionData,
                [point]: type === 'number' ? (value ? parseFloat(value) : '') : value,
              },
            },
          }
        })
      }
    } else {
      // Normal field
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }))
    }
  }

  // 3 nokta input grubu render et
  const renderThreePointInput = (
    label: string,
    side: 'buccal' | 'lingual',
    section: string,
    unit: string = ''
  ) => {
    const value = (formData[side][section as keyof typeof formData[side]] as ThreePointMeasurement) || createEmptyThreePoint()
    const isDisabled = formData.isMissing
    
    return (
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
          {label} {unit && `(${unit})`}
        </label>
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className={`block text-xs mb-1 ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>M</label>
            <input
              type="number"
              name={`${side}.${section}.mesial`}
              value={value.mesial}
              onChange={handleChange}
              min="0"
              step="0.1"
              disabled={isDisabled}
              className="w-full px-2 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
              placeholder="-"
            />
          </div>
          <div className="flex-1">
            <label className={`block text-xs mb-1 ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>C</label>
            <input
              type="number"
              name={`${side}.${section}.central`}
              value={value.central}
              onChange={handleChange}
              min="0"
              step="0.1"
              disabled={isDisabled}
              className="w-full px-2 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
              placeholder="-"
            />
          </div>
          <div className="flex-1">
            <label className={`block text-xs mb-1 ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>D</label>
            <input
              type="number"
              name={`${side}.${section}.distal`}
              value={value.distal}
              onChange={handleChange}
              min="0"
              step="0.1"
              disabled={isDisabled}
              className="w-full px-2 py-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
              placeholder="-"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border-2 border-blue-500 p-6 shadow-xl max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">
          Diş #{toMedicalNumber(toothNumber)} Ölçüm Formu
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Genel Diş Bilgileri */}
        <div className="bg-gray-50 rounded-lg p-5 border-2 border-gray-300">
          <h4 className="text-lg font-bold text-gray-800 mb-4 text-center bg-gray-200 py-2 rounded">
            Genel Diş Bilgileri
          </h4>
          
          {/* Diş Durumu - En Üstte */}
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="isMissing"
                checked={formData.isMissing === true}
                onChange={handleChange}
                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm font-semibold text-red-800">
                ⚠️ Bu diş eksik (Diş çekilmiş veya doğuştan yok)
              </span>
            </label>
          </div>

          {formData.isMissing && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-800">
                ℹ️ Diş eksik olarak işaretlendi. Bu diş için ölçüm yapılmayacak.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobility
              </label>
              <select
                name="mobility"
                value={formData.mobility}
                onChange={handleChange}
                disabled={formData.isMissing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
              >
                <option value="">-</option>
                <option value="0">Grade 0</option>
                <option value="1">Grade 1</option>
                <option value="2">Grade 2</option>
                <option value="3">Grade 3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Implantat
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="implantat"
                  checked={formData.implantat === true}
                  onChange={handleChange}
                  disabled={formData.isMissing}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <span className={`text-sm ${formData.isMissing ? 'text-gray-400' : 'text-gray-700'}`}>Var</span>
              </label>
            </div>
          </div>
        </div>

        {/* BUCCAL Section */}
        <div className={`rounded-lg p-5 border-2 ${formData.isMissing ? 'bg-gray-100 border-gray-300 opacity-60' : 'bg-blue-50 border-blue-200'}`}>
          <h4 className={`text-lg font-bold mb-4 text-center py-2 rounded ${formData.isMissing ? 'bg-gray-200 text-gray-500' : 'bg-blue-200 text-gray-800'}`}>
            BUCCAL (Yanak)
          </h4>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-1 ${formData.isMissing ? 'text-gray-400' : 'text-gray-700'}`}>
              Furcation
            </label>
            <select
              name="buccal.furcation"
              value={formData.buccal.furcation}
              onChange={handleChange}
              disabled={formData.isMissing}
              className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              <option value="">-</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
            </select>
          </div>

          {renderThreePointInput('Gingival Margin', 'buccal', 'gingivalMargin', 'mm')}
          {renderThreePointInput('Probing Depth', 'buccal', 'probingDepth', 'mm')}
          {renderThreePointInput('BOP (Bleeding On Probing)', 'buccal', 'bop')}
          {renderThreePointInput('PI (Plaque Index)', 'buccal', 'pi')}
        </div>

        {/* Central Tooth Number */}
        <div className="flex justify-center my-4">
          <div className="bg-gray-100 border-2 border-gray-400 rounded-lg px-8 py-4">
            <span className="text-4xl font-bold text-gray-800">{toMedicalNumber(toothNumber)}</span>
          </div>
        </div>

        {/* LINGUAL Section */}
        <div className={`rounded-lg p-5 border-2 ${formData.isMissing ? 'bg-gray-100 border-gray-300 opacity-60' : 'bg-green-50 border-green-200'}`}>
          <h4 className={`text-lg font-bold mb-4 text-center py-2 rounded ${formData.isMissing ? 'bg-gray-200 text-gray-500' : 'bg-green-200 text-gray-800'}`}>
            LINGUAL (Dil)
          </h4>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-1 ${formData.isMissing ? 'text-gray-400' : 'text-gray-700'}`}>
              Furcation
            </label>
            <select
              name="lingual.furcation"
              value={formData.lingual.furcation}
              onChange={handleChange}
              disabled={formData.isMissing}
              className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              <option value="">-</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
            </select>
          </div>

          {renderThreePointInput('Gingival Margin', 'lingual', 'gingivalMargin', 'mm')}
          {renderThreePointInput('Probing Depth', 'lingual', 'probingDepth', 'mm')}
          {renderThreePointInput('BOP (Bleeding On Probing)', 'lingual', 'bop')}
          {renderThreePointInput('PI (Plaque Index)', 'lingual', 'pi')}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notlar
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg"
          >
            Kaydet
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  )
}

export default ToothMeasurementForm
