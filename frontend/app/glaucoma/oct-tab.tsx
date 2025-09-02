'use client'

import React, { useState } from 'react'
import { Eye, Zap, Activity } from 'lucide-react'
import { FileUpload } from '../../components/FileUpload'
import { PredictionCard } from '../../components/PredictionCard'
import { MetadataCard } from '../../components/MetadataCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { SeverityChart } from '../../components/SeverityChart'
import { ImagePreviewCard } from '../../components/ImagePreviewCard'
import { apiClient, PredictionResult, DicomMetadata, UploadProgress } from '../../lib/api'

export function GlaucomaOCTTab() {
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

      const result = await apiClient.predictGlaucomaOct(selectedFile, onProgress)
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
        {/* Model Information */}
        <div className="medical-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Glaucoma OCT Analysis Model
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">DenseNet121 Architecture</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Optimized for OCT images</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">92% Threshold</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">High precision detection</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Eye className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Grayscale Processing</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Single-channel OCT analysis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="medical-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upload OCT Image
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
                <span>Analyzing glaucoma presence...</span>
                <span>{Math.round(uploadProgress.percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
              <Activity className="h-5 w-5" />
              <span>Analyze Glaucoma Presence</span>
            </button>
          )}

          {loading && (
            <div className="mt-4">
              <LoadingSpinner
                size="md"
                text="Analyzing Glaucoma Presence... This may take a few moments"
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
            About Glaucoma OCT Analysis
          </h3>
          <div className="space-y-3 text-gray-600 dark:text-gray-300">
            <p>
              Our AI model analyzes OCT images to detect glaucoma using advanced deep learning techniques.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">No Glaucoma - Healthy retina</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Glaucoma detected - Pathology present</span>
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

            {/* Additional details card */}
            <div className="medical-card p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Analysis Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Processing Time:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {prediction.processing_time.toFixed(2)}s
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(prediction.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview and Export */}
        <ImagePreviewCard
          imageFile={selectedFile}
          prediction={prediction}
          metadata={metadata}
          analysisType="Glaucoma"
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
              Upload an image to see analysis results and metadata here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
