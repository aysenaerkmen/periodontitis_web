import { toMedicalNumber } from '../utils/toothNumbering'

interface ToothChartProps {
  selectedTooth: number | null
  onToothSelect: (toothNumber: number) => void
  toothData?: Map<number, { hasData: boolean; isMissing?: boolean }>
}

// Diş SVG bileşeni
function ToothSVG({ 
  toothNumber, 
  isSelected, 
  hasData,
  isMissing,
  isLowerJaw,
  onClick 
}: { 
  toothNumber: number
  isSelected: boolean
  hasData: boolean
  isMissing?: boolean
  isLowerJaw: boolean
  onClick: () => void
}) {
  const getToothColor = () => {
    if (isSelected) {
      return { fill: '#3b82f6', stroke: '#1e40af' } // Mavi - Seçili
    }
    if (isMissing) {
      return { fill: '#fee2e2', stroke: '#dc2626' } // Açık kırmızı - Eksik diş
    }
    if (hasData) {
      return { fill: '#86efac', stroke: '#16a34a' } // Yeşil - Veri girişi yapılmış
    }
    return { fill: '#ffffff', stroke: '#9ca3af' } // Beyaz - Veri girişi yapılmamış
  }

  const colors = getToothColor()
  const medicalNumber = toMedicalNumber(toothNumber)

  return (
    <button
      onClick={onClick}
      className="relative transition-all transform hover:scale-110 cursor-pointer"
      title={`Diş ${medicalNumber} (${toothNumber})`}
    >
      <svg
        width="50"
        height="80"
        viewBox="0 0 50 80"
        className="drop-shadow-sm"
      >
        {/* Diş şekli - basitleştirilmiş */}
        <path
          d="M 25 5 
             Q 30 5 35 10
             L 40 20
             Q 42 25 40 30
             L 38 50
             Q 37 55 35 60
             L 30 70
             Q 28 75 25 75
             Q 22 75 20 70
             L 15 60
             Q 13 55 12 50
             L 10 30
             Q 8 25 10 20
             L 15 10
             Q 20 5 25 5 Z"
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={isSelected ? 3 : 2}
          className="transition-all"
        />
        {/* Diş numarası - Alt çene için ters çevrilmiş */}
        <text
          x="25"
          y="45"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill={isSelected ? '#ffffff' : '#1f2937'}
          className="pointer-events-none"
          transform={isLowerJaw ? 'rotate(180 25 45)' : ''}
        >
          {medicalNumber}
        </text>
      </svg>
    </button>
  )
}

function ToothChart({ selectedTooth, onToothSelect, toothData }: ToothChartProps) {
  // Üst çene dişleri: 1-16 (sağdan sola: 1-8, 9-16)
  // Alt çene dişleri: 17-32 (soldan sağa: 17-24, 25-32)

  return (
    <div className="w-full max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Diş Haritası - Ölçüm yapmak için bir dişe tıklayın
      </h3>
      
      {/* Üst Çene - 1-16 */}
      <div className="mb-8">
        <div className="text-center mb-4 text-sm font-medium text-gray-600">
          Üst Çene (Maksiller)
        </div>
        <div className="flex justify-center items-end space-x-2">
          {/* Sağ taraf: 8-1 (Bölge 1: 18-11, sağdan sola azalarak) */}
          {[8, 7, 6, 5, 4, 3, 2, 1].map(toothNum => {
            const data = toothData?.get(toothNum)
            return (
              <ToothSVG
                key={toothNum}
                toothNumber={toothNum}
                isSelected={selectedTooth === toothNum}
                hasData={data?.hasData || false}
                isMissing={data?.isMissing}
                isLowerJaw={false}
                onClick={() => onToothSelect(toothNum)}
              />
            )
          })}
          {/* Sol taraf: 9-16 (Bölge 2: 21-28, ortadan sonra artarak) */}
          {[9, 10, 11, 12, 13, 14, 15, 16].map(toothNum => {
            const data = toothData?.get(toothNum)
            return (
              <ToothSVG
                key={toothNum}
                toothNumber={toothNum}
                isSelected={selectedTooth === toothNum}
                hasData={data?.hasData || false}
                isMissing={data?.isMissing}
                isLowerJaw={false}
                onClick={() => onToothSelect(toothNum)}
              />
            )
          })}
        </div>
      </div>

      {/* Alt Çene - 17-32 */}
      <div>
        <div className="text-center mb-4 text-sm font-medium text-gray-600">
          Alt Çene (Mandibular)
        </div>
        <div className="flex justify-center items-start space-x-2">
          {/* Sol taraf: 24-17 (Bölge 3: 38-31, soldan sağa azalarak) */}
          {[24, 23, 22, 21, 20, 19, 18, 17].map(toothNum => {
            const data = toothData?.get(toothNum)
            return (
              <div key={toothNum} className="transform rotate-180">
                <ToothSVG
                  toothNumber={toothNum}
                  isSelected={selectedTooth === toothNum}
                  hasData={data?.hasData || false}
                  isMissing={data?.isMissing}
                  isLowerJaw={true}
                  onClick={() => onToothSelect(toothNum)}
                />
              </div>
            )
          })}
          {/* Sağ taraf: 25-32 (Bölge 4: 41-48, ortadan sonra artarak) */}
          {[25, 26, 27, 28, 29, 30, 31, 32].map(toothNum => {
            const data = toothData?.get(toothNum)
            return (
              <div key={toothNum} className="transform rotate-180">
                <ToothSVG
                  toothNumber={toothNum}
                  isSelected={selectedTooth === toothNum}
                  hasData={data?.hasData || false}
                  isMissing={data?.isMissing}
                  isLowerJaw={true}
                  onClick={() => onToothSelect(toothNum)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Açıklama */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Renk Kodları Açıklaması</h4>
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border-2 border-gray-400 rounded mr-2"></div>
            <span>Veri girişi yapılmamış</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-400 border-2 border-green-600 rounded mr-2"></div>
            <span>Veri girişi yapılmış</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-200 border-2 border-red-600 rounded mr-2"></div>
            <span>Eksik diş</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 border-2 border-blue-700 rounded mr-2"></div>
            <span>Seçili diş</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ToothChart
