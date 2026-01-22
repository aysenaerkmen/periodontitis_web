import { useState, useRef, DragEvent } from 'react'

interface XRayUploadProps {
  onUpload: (file: File) => void
  preview: string | null
}

function XRayUpload({ onUpload, preview }: XRayUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      onUpload(file)
    } else {
      alert('Lütfen bir görüntü dosyası seçin.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleChangeClick = () => {
    // Input value'sunu sıfırla ki aynı dosya seçilse bile onChange tetiklensin
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Röntgen önizleme"
            className="w-full h-64 object-contain rounded-lg border-2 border-gray-200 bg-gray-50"
          />
          <button
            type="button"
            onClick={handleChangeClick}
            className="mt-2 w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded transition"
          >
            Farklı bir görüntü seç
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-gray-600 mb-2">
            Röntgen görüntüsünü buraya sürükleyin veya
          </p>
          <button
            type="button"
            onClick={handleChangeClick}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Dosya Seç
          </button>
          <p className="text-sm text-gray-500 mt-2">
            PNG, JPG, JPEG formatları desteklenir
          </p>
        </div>
      )}
    </div>
  )
}

export default XRayUpload
