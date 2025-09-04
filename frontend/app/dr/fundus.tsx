'use client'

import React, { useState } from 'react'
import { Eye, Camera, Zap } from 'lucide-react'
import { FileUpload } from '../../components/FileUpload'
import { PredictionCard } from '../../components/PredictionCard'
import { MetadataCard } from '../../components/MetadataCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { SeverityChart } from '../../components/SeverityChart'
import { ImagePreviewCard } from '../../components/ImagePreviewCard'
import { apiClient, PredictionResult, DicomMetadata, UploadProgress } from '../../lib/api'

export function DrFundusTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [metadata, setMetadata] = useState<DicomMetadata | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const severityChartRef = React.useRef<HTMLDivElement>(null)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setPrediction(null)
    setMetadata(null)
    setError(null)
    
    // Extract DICOM metadata if it's a DICOM file
    const isDicom = file.name.toLowerCase().endsWith('.dcm') || 
                   file.name.toLowerCase().endsWith('.dicom') ||
                   file.type === 'application/dicom' ||
                   file.type === 'application/x-dicom' ||
                   file.type === 'application/dicom+json'
    
    if (isDicom) {
      extractMetadata(file)
    }
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setPrediction(null)
    setMetadata(null)
    setError(null)
    setUploadProgress(null)
  }

  const extractMetadata = async (file: File) => {
    try {
      const metadata = await apiClient.extractDicomMetadata(file)
      setMetadata(metadata)
    } catch (err) {
      console.error('Failed to extract DICOM metadata:', err)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setLoading(true)
    setError(null)
    setUploadProgress(null)

    try {
      const onProgress = (progress: UploadProgress) => {
        setUploadProgress(progress)
      }

      const result = await apiClient.predictDrFundus(selectedFile, onProgress)
      setPrediction(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Upload and Analysis */}
      <div className="space-y-6">
        <div className="medical-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upload Fundus Image
          </h3>
          <FileUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            currentFile={selectedFile}
            loading={loading}
          />
          
          {uploadProgress && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Analyzing DR severity...</span>
                <span>{Math.round(uploadProgress.percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {selectedFile && !loading && (
            <button
              onClick={handleAnalyze}
              className="w-full mt-4 medical-button py-3 rounded-md flex items-center justify-center space-x-2"
            >
              <Zap className="h-5 w-5" />
              <span>Analyze DR Severity</span>
            </button>
          )}

          {loading && (
            <div className="mt-4">
              <LoadingSpinner 
                size="md" 
                text="Analyzing DR severity... This may take a few moments"
                className="py-8"
              />
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Information Card */}
        <div className="medical-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            About DR Fundus Analysis
          </h3>
          <div className="space-y-3 text-gray-600 dark:text-gray-300">
            <p>
              Our AI model analyzes fundus images to detect and grade diabetic retinopathy 
              severity using advanced deep learning techniques.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">No DR - Healthy retina</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Early pathology - Mild DR signs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Advanced pathology - Severe DR</span>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mt-4">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                <strong>Medical Note:</strong> These predictions are for screening purposes 
                and should be confirmed by clinical examination.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Results */}
      <div className="space-y-6">
        {prediction && (
          <div className="space-y-4">
            <div ref={severityChartRef}>
              <SeverityChart
                prediction={prediction}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Image Preview and Export */}
        <ImagePreviewCard
          imageFile={selectedFile}
          prediction={prediction}
          metadata={metadata}
          analysisType="DR"
          severityChartRef={severityChartRef}
        />

        {metadata && (
          <MetadataCard metadata={metadata.metadata} />
        )}

        {!prediction && !metadata && (
          <div className="medical-card p-8 text-center">
            <Eye className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Analysis Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Upload a fundus image to see DR severity analysis and metadata here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
