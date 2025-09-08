'use client'

import React, { useState } from 'react'
import { Download, FileImage, Eye } from 'lucide-react'
import { generatePDFReport, generateBiomarkerPDFReport, imageToBase64, chartToBase64 } from '../lib/pdf-export'
import { PredictionResult, BiomarkerResult, DicomMetadata } from '../lib/api'

interface ImagePreviewCardProps {
  imageFile: File | null
  prediction?: PredictionResult | null
  biomarkers?: BiomarkerResult[]
  metadata?: DicomMetadata | null
  analysisType: 'AMD' | 'Glaucoma' | 'DR' | 'Biomarkers'
  severityChartRef?: React.RefObject<HTMLElement>
  gaugeChartRefs?: React.RefObject<HTMLElement>[]
  className?: string,
  report?: true | false
}

export function ImagePreviewCard({
  imageFile,
  prediction,
  biomarkers,
  metadata,
  analysisType,
  severityChartRef,
  gaugeChartRefs,
  className = '',
  report = true
}: ImagePreviewCardProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // Generate image preview when file changes
  React.useEffect(() => {
    if (imageFile) {
      const isDicom = imageFile.name.toLowerCase().endsWith('.dcm') ||
                     imageFile.name.toLowerCase().endsWith('.dicom') ||
                     imageFile.type === 'application/dicom' ||
                     imageFile.type === 'application/x-dicom' ||
                     imageFile.type === 'application/dicom+json'

      if (isDicom) {
        // For DICOM files, extract the image using backend
        extractDicomImage(imageFile)
      } else {
        // For regular images, use FileReader
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string)
        }
        reader.readAsDataURL(imageFile)
      }
    } else {
      setImagePreview(null)
    }
  }, [imageFile])

  // Extract image from DICOM file using backend
  const extractDicomImage = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/dicom/image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`DICOM processing failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.image_base64) {
        setImagePreview(result.image_base64)
      } else {
        throw new Error('Failed to extract image from DICOM')
      }
    } catch (error) {
      console.error('Error extracting DICOM image:', error)
      setImagePreview(null)
      // Could show an error message to user here
    }
  }

  const handleExportPDF = async () => {
    if (!imageFile) return

    setExporting(true)
    try {
      // Convert image to base64 for PDF (handle DICOM files specially)
      let imageBase64: string
      const isDicom = imageFile.name.toLowerCase().endsWith('.dcm') || 
                     imageFile.name.toLowerCase().endsWith('.dicom') ||
                     imageFile.type === 'application/dicom' ||
                     imageFile.type === 'application/x-dicom' ||
                     imageFile.type === 'application/dicom+json'
      
      if (isDicom) {
        // For DICOM files, use the backend conversion service
        const formData = new FormData()
        formData.append('file', imageFile)
        const response = await fetch('/api/dicom/image', {
          method: 'POST',
          body: formData
        })
        if (!response.ok) {
          throw new Error(`DICOM processing failed: ${response.statusText}`)
        }
        const result = await response.json()
        if (!result.success || !result.image_base64) {
          throw new Error('Failed to extract image from DICOM file')
        }
        imageBase64 = result.image_base64
      } else {
        // For regular image files, use direct conversion
        imageBase64 = await imageToBase64(imageFile)
      }

      // Capture chart images if refs are provided
      let severityChartImage: string | undefined
      let gaugeChartImages: Array<{ name: string; image: string }> | undefined

      // Capture severity chart
      if (severityChartRef?.current) {
        try {
          severityChartImage = await chartToBase64(severityChartRef.current)
        } catch (error) {
          console.error('Error capturing severity chart:', error)
        }
      }

      // Capture gauge charts
      if (gaugeChartRefs && gaugeChartRefs.length > 0) {
        gaugeChartImages = []
        for (let i = 0; i < gaugeChartRefs.length; i++) {
          const ref = gaugeChartRefs[i]
          if (ref?.current) {
            try {
              const chartImage = await chartToBase64(ref.current)
              gaugeChartImages.push({
                name: biomarkers?.[i]?.biomarker_name || `Biomarker ${i + 1}`,
                image: chartImage
              })
            } catch (error) {
              console.error(`Error capturing gauge chart ${i}:`, error)
            }
          }
        }
      }

      // Prepare report data
      const reportData = {
        patientInfo: metadata ? {
          name: metadata.metadata.patient_name || undefined,
          id: metadata.metadata.patient_id || undefined,
          date: metadata.metadata.study_date || new Date().toLocaleDateString()
        } : undefined,
        prediction: prediction || undefined,
        biomarkers: biomarkers || undefined,
        metadata: metadata || undefined,
        image: imageBase64,
        analysisType,
        chartData: (severityChartImage || gaugeChartImages) ? {
          severityChart: severityChartImage,
          gaugeCharts: gaugeChartImages
        } : undefined
      }

      console.log('PDF Report Data:', reportData)

      // Generate and download PDF - use biomarker-specific function if biomarkers are present
      if (biomarkers && biomarkers.length > 0) {
        generateBiomarkerPDFReport(reportData)
      } else {
        generatePDFReport(reportData)
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error exporting PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (!imageFile) {
    return (
      <div className={`medical-card p-6 text-center ${className}`}>
        <FileImage className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Image Selected
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Upload an image to see preview and export options
        </p>
      </div>
    )
  }

  return (
    <div className={`medical-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Image Preview
        </h3>
        {report && (
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Image Preview */}
        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Analysis preview"
              className="w-full h-64 object-contain"
            />
          )}
        </div>

        {/* Image Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">File Name:</span>
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {imageFile.name}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">File Size:</span>
            <div className="font-medium text-gray-900 dark:text-white">
              {(imageFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        {/* {(prediction || biomarkers) && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Analysis Summary
            </h4>
            <div className="space-y-1 text-sm">
              {prediction && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Prediction:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {prediction.prediction}
                  </span>
                </div>
              )}
              {prediction && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(prediction.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              {biomarkers && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Biomarkers:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {biomarkers.length} analyzed
                  </span>
                </div>
              )}
            </div>
          </div>
        )} */}
      </div>
    </div>
  )
}
