'use client'

import React, { useState } from 'react'
import { CheckCircle, AlertCircle, Clock, TrendingUp, Activity, Download, Image as ImageIcon, Eye } from 'lucide-react'
import { generatePDFReport, imageToBase64 } from '../lib/pdf-export'
import { PredictionResult, BiomarkerResult, DicomMetadata } from '../lib/api'

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
  metadata?: DicomMetadata
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

  // Generate image URL when needed (no premature revoke)
  React.useEffect(() => {
    if (!showImage || !imageFile) {
      setImageUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImageUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
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
        imageBase64 = await imageToBase64(imageFile)
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
        metadata,
        image: imageBase64
      }

      generatePDFReport(reportData)
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('Failed to export PDF report. Please try again.')
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
                  <span>{showImage ? 'Hide' : 'Show'} Image</span>
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
        {showImage && imageUrl && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <ImageIcon className="h-4 w-4" />
                <span>Analyzed Image</span>
              </div>
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="Analyzed medical image"
                  className="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
