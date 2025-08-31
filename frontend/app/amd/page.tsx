'use client'

import React, { useState } from 'react'
import { Eye, FileImage, Zap } from 'lucide-react'
import { FileUpload } from '../../components/FileUpload'
import { PredictionCard } from '../../components/PredictionCard'
import { MetadataCard } from '../../components/MetadataCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { apiClient, PredictionResult, DicomMetadata, UploadProgress } from '../../lib/api'

type ImageType = 'oct' | 'fundus'

export default function AmdPage() {
  const [activeTab, setActiveTab] = useState<ImageType>('oct')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [metadata, setMetadata] = useState<DicomMetadata | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      let result: PredictionResult

      const onProgress = (progress: UploadProgress) => {
        setUploadProgress(progress)
      }

      if (activeTab === 'oct') {
        result = await apiClient.predictAmdOct(selectedFile, onProgress)
      } else {
        result = await apiClient.predictAmdFundus(selectedFile, onProgress)
      }

      setPrediction(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
      setUploadProgress(null)
    }
  }

  const tabConfig = {
    oct: {
      title: 'OCT Analysis',
      description: 'Optical Coherence Tomography image analysis for AMD detection',
      icon: <Eye className="h-5 w-5" />,
      modelInfo: 'Multi-class PyTorch model (.pt) for AMD stage classification'
    },
    fundus: {
      title: 'Fundus Analysis',
      description: 'Fundus photography analysis for AMD screening',
      icon: <FileImage className="h-5 w-5" />,
      modelInfo: 'Binary PyTorch model (.pth) for AMD presence detection'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="bg-blue-500 p-3 rounded-lg">
            <Eye className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AMD Analysis
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Advanced AI-powered analysis for Age-related Macular Degeneration detection and classification
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-8 max-w-md mx-auto">
        {(Object.keys(tabConfig) as ImageType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              // Reset state when switching tabs
              setSelectedFile(null)
              setPrediction(null)
              setMetadata(null)
              setError(null)
            }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tabConfig[tab].icon}
            <span>{tabConfig[tab].title}</span>
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Upload and Analysis */}
        <div className="space-y-6">
          <div className="medical-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {tabConfig[activeTab].title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {tabConfig[activeTab].description}
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Model:</strong> {tabConfig[activeTab].modelInfo}
              </p>
            </div>
          </div>

          <div className="medical-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upload Image
            </h3>
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              currentFile={selectedFile}
              loading={loading}
              accept={{
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/png': ['.png'],
                'application/dicom': ['.dcm', '.dicom'],
                'application/x-dicom': ['.dcm', '.dicom'],
                'application/dicom+json': ['.dcm', '.dicom'],
                'application/octet-stream': ['.dcm', '.dicom'],
              }}
            />
            
            {uploadProgress && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress.percentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                <span>Analyze Image</span>
              </button>
            )}

            {loading && (
              <div className="mt-4">
                <LoadingSpinner 
                  size="md" 
                  text="Analyzing image... This may take a few moments"
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
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {prediction && (
            <PredictionCard
              title={`${tabConfig[activeTab].title} Result`}
              prediction={prediction.prediction}
              confidence={prediction.confidence}
              timestamp={prediction.timestamp}
              processingTime={prediction.processing_time}
              imageFile={selectedFile || undefined}
              predictionData={prediction}
              metadata={metadata?.metadata || undefined}
              analysisType="AMD"
            />
          )}

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
    </div>
  )
}
