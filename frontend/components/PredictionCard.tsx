'use client'

import React, { useState } from 'react'
import { CheckCircle, AlertCircle, Clock, TrendingUp, Activity, Download, Image as ImageIcon, Eye } from 'lucide-react'
import { generatePDFReport, generateBiomarkerPDFReport, imageToBase64 } from '../lib/pdf-export'
import { PredictionResult, BiomarkerResult, DicomMetadata, apiClient } from '../lib/api'

type DicomMetadataInner = {
  patient_id?: string | null
  patient_name?: string | null
  patient_sex?: string | null
  patient_age?: string | null
  patient_birth_date?: string | null
  study_date?: string | null
  study_time?: string | null
  modality?: string | null
  institution_name?: string | null
  manufacturer?: string | null
  manufacturer_model_name?: string | null
  study_description?: string | null
  series_description?: string | null
  image_type?: string | null
  rows?: number | null
  columns?: number | null
  pixel_spacing?: number[] | null
  slice_thickness?: number | null
  bits_allocated?: number | null
  bits_stored?: number | null
  file_size?: number | null
  file_name?: string | null
}

interface PredictionCardProps {
  title: string
  prediction: string
  confidence: number
  timestamp: string
  processingTime?: number
  className?: string
  variant?: 'default' | 'biomarker'
  unit?: string
  normalRange?: string
  imageFile?: File
  predictionData?: PredictionResult
  biomarkerData?: BiomarkerResult[]
  metadata?: DicomMetadata | DicomMetadataInner
  analysisType?: 'AMD' | 'Glaucoma' | 'DR' | 'Biomarkers'
}

export function PredictionCard({
  title,
  prediction,
  confidence,
  timestamp,
  processingTime,
  className = '',
  variant = 'default',
  unit,
  normalRange,
  imageFile,
  predictionData,
  biomarkerData,
  metadata,
  analysisType
}: PredictionCardProps) {
  const [showImage, setShowImage] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  // Check if current image file is DICOM
  const isDicom = imageFile ? (
    imageFile.name.toLowerCase().endsWith('.dcm') || 
    imageFile.name.toLowerCase().endsWith('.dicom') ||
    imageFile.type === 'application/dicom'
  ) : false

  // Normalize metadata access - handle both full response and inner metadata object
  const normalizedMetadata = metadata && 'metadata' in metadata ? metadata.metadata : metadata

  // Helper function to check if a value is not empty
  const hasValue = (value: any): boolean => {
    return value !== null && value !== undefined && value !== ''
  }  // Generate image URL when needed (no premature revoke)
  React.useEffect(() => {
    if (!imageFile) {
      setImageUrl(null);
      setImageLoading(false);
      setImageError(null);
      return;
    }

    // Check if it's a DICOM file
    const fileIsDicom = imageFile.name.toLowerCase().endsWith('.dcm') || 
                   imageFile.name.toLowerCase().endsWith('.dicom') ||
                   imageFile.type === 'application/dicom'

    if (fileIsDicom) {
      // Automatically show DICOM images since we can extract them
      if (!showImage) {
        setShowImage(true);
      }
      
      // Extract image from DICOM file
      const extractDicomImage = async () => {
        setImageLoading(true);
        setImageError(null);
        try {
          const result = await apiClient.extractDicomImage(imageFile)
          setImageUrl(result.image)
          setImageLoading(false);
        } catch (error) {
          console.error('Failed to extract DICOM image:', error)
          setImageUrl(null)
          setImageLoading(false);
          setImageError('Failed to extract image from DICOM file')
        }
      }
      extractDicomImage()
      return
    }

    // For regular images, only process if showImage is true
    if (!showImage) {
      setImageUrl(null);
      setImageLoading(false);
      setImageError(null);
      return;
    }

    // For regular images
    setImageLoading(false);
    setImageError(null);
    const objectUrl = URL.createObjectURL(imageFile);
    setImageUrl(objectUrl);

    return () => {
      if (!fileIsDicom) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [showImage, imageFile]);

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
    if (conf >= 0.6) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
    return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
  }

  const getConfidenceIcon = (conf: number) => {
    if (conf >= 0.8) return <CheckCircle className="h-5 w-5" />
    return <AlertCircle className="h-5 w-5" />
  }

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString()
  }

  const handleExportPDF = async () => {
    if (!analysisType) return

    try {
      let imageBase64: string | undefined
      
      if (imageFile) {
        // Check if it's a DICOM file
        const isDicom = imageFile.name.toLowerCase().endsWith('.dcm') || 
                       imageFile.name.toLowerCase().endsWith('.dicom') ||
                       imageFile.type === 'application/dicom'
        
        if (isDicom) {
          // Extract image from DICOM file for PDF
          try {
            const result = await apiClient.extractDicomImage(imageFile)
            imageBase64 = result.image
          } catch (error) {
            console.error('Failed to extract DICOM image for PDF:', error)
            imageBase64 = undefined
          }
        } else {
          imageBase64 = await imageToBase64(imageFile)
        }
      }

      const reportData = {
        analysisType,
        prediction: predictionData || {
          prediction,
          confidence,
          timestamp,
          processing_time: processingTime || 0
        },
        biomarkers: biomarkerData,
        metadata: metadata && 'metadata' in metadata ? metadata : (normalizedMetadata ? {
          metadata: normalizedMetadata,
          status: 'success',
          timestamp: new Date().toISOString()
        } : undefined),
        image: imageBase64
      }

      // Use biomarker-specific PDF function if biomarkers are present
      if (biomarkerData && biomarkerData.length > 0) {
        generateBiomarkerPDFReport(reportData)
      } else {
        generatePDFReport(reportData)
      }
    } catch (error) {
      console.error('Failed to export PDF:', error)
      if (error instanceof Error && error.message.includes('DICOM')) {
        alert('DICOM images cannot be included in PDF reports. The report will be generated without the image.')
        // Try again without image
        const reportData = {
          analysisType,
          prediction: predictionData || {
            prediction,
            confidence,
            timestamp,
            processing_time: processingTime || 0
          },
          biomarkers: biomarkerData,
          metadata: metadata && 'metadata' in metadata ? metadata : (normalizedMetadata ? {
            metadata: normalizedMetadata,
            status: 'success',
            timestamp: new Date().toISOString()
          } : undefined),
          image: undefined
        }
        // Use biomarker-specific PDF function if biomarkers are present (retry without image)
        if (biomarkerData && biomarkerData.length > 0) {
          generateBiomarkerPDFReport(reportData)
        } else {
          generatePDFReport(reportData)
        }
      } else {
        alert('Failed to export PDF report. Please try again.')
      }
    }
  }

  return (
    <div className={`medical-card p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <div className="flex items-center space-x-1">
            {variant === 'biomarker' ? (
              <Activity className="h-5 w-5 text-blue-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-blue-500" />
            )}
          </div>
        </div>

        {/* Prediction Result */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {variant === 'biomarker' ? 'Predicted Value' : 'Diagnosis'}
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {prediction}
              </span>
              {unit && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {unit}
                </span>
              )}
            </div>
          </div>

          {/* Risk Category for Glaucoma */}
          {predictionData?.risk_category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Risk Category
              </label>
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                predictionData.risk_color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                predictionData.risk_color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
              }`}>
                <span>{predictionData.risk_category}</span>
              </div>
            </div>
          )}

          {/* Threshold Information for Glaucoma */}
          {/* {predictionData?.threshold && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Detection Threshold
              </label>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {predictionData.threshold} ({(predictionData.threshold * 100).toFixed(1)}%)
              </div>
            </div>
          )} */}

          {/* Normal Range for Biomarkers */}
          {normalRange && variant === 'biomarker' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Normal Range
              </label>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {normalRange}
              </span>
            </div>
          )}

          {/* Confidence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confidence
            </label>
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(confidence)}`}>
              {getConfidenceIcon(confidence)}
              <span>{(confidence * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Threshold Explanation */}
          {predictionData?.threshold_explanation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Analysis Details
              </label>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                {predictionData.threshold_explanation}
              </div>
            </div>
          )}

          {/* Clinical Note */}
          {predictionData?.clinical_note && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                <strong>Clinical Note:</strong> {predictionData.clinical_note}
              </p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Timestamp</span>
            <span className="text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTimestamp(timestamp)}</span>
            </span>
          </div>
          
          {processingTime && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Processing Time</span>
              <span className="text-gray-700 dark:text-gray-300">
                {processingTime.toFixed(2)}s
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {imageFile && (
                <button
                  onClick={() => setShowImage(!showImage)}
                  className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>{(showImage && !isDicom) ? 'Hide' : 'Show'} Image</span>
                </button>
              )}
            </div>

            {analysisType && (
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center space-x-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Image Display */}
        {(showImage || (imageFile && isDicom)) && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <ImageIcon className="h-4 w-4" />
                <span>Analyzed Image</span>
              </div>
              <div className="relative">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Analyzed medical image"
                    className="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                    style={{ maxHeight: '300px', objectFit: 'contain' }}
                  />
                ) : imageFile ? (
                  <div className="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-800 p-8 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    {imageLoading ? (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Loading DICOM Image...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Extracting image from DICOM file...
                        </p>
                      </>
                    ) : imageError ? (
                      <>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                          Failed to Load Image
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {imageError}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          DICOM Image Processed
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          The image has been processed by our AI model.
                        </p>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
