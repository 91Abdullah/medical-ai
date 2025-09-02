'use client'

import React, { useState } from 'react'
import { Brain, Zap } from 'lucide-react'
import { FileUpload } from '../../components/FileUpload'
import { PredictionCard } from '../../components/PredictionCard'
import { MetadataCard } from '../../components/MetadataCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { SeverityChart } from '../../components/SeverityChart'
import { ImagePreviewCard } from '../../components/ImagePreviewCard'
import { apiClient, PredictionResult, DicomMetadata, UploadProgress } from '../../lib/api'

export default function GlaucomaPage() {
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

      const result = await apiClient.predictGlaucomaFundus(selectedFile, onProgress)
      setPrediction(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="bg-green-500 p-3 rounded-lg">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Glaucoma Analysis
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Advanced AI-powered fundus image analysis for glaucoma detection and risk assessment
        </p>
      </div>

      {/* Model Information */}
      <div className="medical-card p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Glaucoma Fundus Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Model Information
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>• Keras/TensorFlow model (.keras)</li>
              <li>• Binary classification</li>
              <li>• Fundus photography analysis</li>
              <li>• Real-time prediction</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Classification Classes
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>• <span className="text-green-600 font-medium">No Glaucoma</span> - Normal optic disc</li>
              <li>• <span className="text-yellow-600 font-medium">Glaucoma Suspected</span> - Early signs</li>
              {/* <li>• <span className="text-red-600 font-medium">Glaucoma</span> - Advanced glaucomatous changes</li> */}
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
                <Zap className="h-5 w-5" />
                <span>Analyze for Glaucoma</span>
              </button>
            )}

            {loading && (
              <div className="mt-4">
                <LoadingSpinner 
                  size="md" 
                  text="Analyzing fundus image for glaucoma..."
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

          {/* Clinical Information */}
          <div className="medical-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              About Glaucoma Detection
            </h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-300">
              <p>
                Glaucoma is a leading cause of irreversible blindness worldwide. Early detection 
                through fundus photography can help prevent vision loss.
              </p>
              <p>
                Our AI model analyzes optic disc morphology, cup-to-disc ratio, and retinal 
                nerve fiber layer to assess glaucoma risk.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mt-4">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  <strong>Note:</strong> This tool is for research purposes only and should not 
                  replace professional medical diagnosis.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {prediction && <>
            <div ref={severityChartRef} className="space-y-4">
                <SeverityChart
                  prediction={prediction}
                  className="w-full"
                />
              </div>
              <div className="space-y-4">{/* Glaucoma-specific information */}
                <div className="medical-card p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Glaucoma Risk Assessment
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      This analysis evaluates optic disc morphology and retinal nerve fiber layer 
                      characteristics to assess glaucoma risk. Higher risk levels indicate the need 
                      for further clinical evaluation.
                    </p>
                  </div>
                </div>
              </div>
          </>}

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
              <Brain className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Analysis Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Upload a fundus image to see glaucoma analysis results and metadata here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
