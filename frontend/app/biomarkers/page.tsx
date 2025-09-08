'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Activity, Zap, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { FileUpload } from '../../components/FileUpload'
import { MetadataCard } from '../../components/MetadataCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ImagePreviewCard } from '../../components/ImagePreviewCard'
import BiomarkerResults from '../../components/BiomarkerResults'
import { apiClient, BiomarkerResult, DicomMetadata, UploadProgress, BIOMARKERS } from '../../lib/api'
import { generatePDFReport, generateBiomarkerPDFReport, chartToBase64, imageToBase64 } from '../../lib/pdf-export'

export default function BiomarkersPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedBiomarkers, setSelectedBiomarkers] = useState<string[]>([])
  const [predictions, setPredictions] = useState<BiomarkerResult[]>([])
  const [metadata, setMetadata] = useState<DicomMetadata | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showBiomarkerList, setShowBiomarkerList] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  // Refs for chart capture
  const chartRefs = useRef<(HTMLDivElement | null)[]>([])

  // Group biomarkers by category for better organization
  const biomarkerCategories = {
    'Cardiovascular': [
      // 'BP_OUT_CALC_AVG_DIASTOLIC_BP',
      // 'BP_OUT_CALC_AVG_SYSTOLIC_BP',
      'Cholesterol Total',
      'HDL-Cholesterol',
      'LDL-Cholesterol Calc',
      'Triglyceride'
    ],
    'Metabolic': [
      'Glucose',
      'HbA1C %',
      'Insulin',
      'BMI'
    ],
    // 'Hormonal': [
    //   'Estradiol',
    //   'Testosterone Total',
    //   'Sex Hormone Binding Globulin'
    // ],
    'Hematological': [
      'Hemoglobin',
      // 'Hematocrit',
      'Red Blood Cell'
    ],
    'Other': [
      // 'Age',
      'Creatinine'
    ]
  }

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setPredictions([])
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
  }, [])

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null)
    setPredictions([])
    setMetadata(null)
    setError(null)
    setUploadProgress(null)
  }, [])

  const extractMetadata = async (file: File) => {
    try {
      const metadata = await apiClient.extractDicomMetadata(file)
      setMetadata(metadata)
    } catch (err) {
      console.error('Failed to extract DICOM metadata:', err)
    }
  }

  const handleBiomarkerToggle = useCallback((biomarker: string) => {
    setSelectedBiomarkers(prev => 
      prev.includes(biomarker)
        ? prev.filter(b => b !== biomarker)
        : [...prev, biomarker]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedBiomarkers([...BIOMARKERS])
  }, [])

  const handleClearAll = useCallback(() => {
    setSelectedBiomarkers([])
  }, [])

  const handleAnalyze = async () => {
    if (!selectedFile) return

    const biomarkersToAnalyze = selectedBiomarkers.length > 0 ? selectedBiomarkers : [...BIOMARKERS]

    setLoading(true)
    setError(null)
    setUploadProgress(null)
    setPredictions([])

    try {
      const onProgress = (progress: UploadProgress) => {
        setUploadProgress(progress)
      }

      // Production-ready batch processing for all selected biomarkers
      const result = await apiClient.predictBiomarkersBatch(
        biomarkersToAnalyze as typeof BIOMARKERS[number][], 
        selectedFile, 
        onProgress
      )
      
      // Set all predictions from batch result
      setPredictions(result.predictions)
      
      // Initialize chart refs array
      chartRefs.current = new Array(result.predictions.length).fill(null)
      
      // Log successful batch processing
      console.log(`Successfully processed ${result.processed_biomarkers}/${result.requested_biomarkers} biomarkers in ${result.total_processing_time.toFixed(2)}s`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
      console.error('Batch biomarker prediction failed:', err)
    } finally {
      setLoading(false)
      setUploadProgress(null)
    }
  }

  const handleExportPDF = async () => {
    if (!predictions.length || !selectedFile) return

    setExportingPDF(true)
    try {
      // Capture gauge charts
      console.log('Starting chart capture for', predictions.length, 'predictions')
      console.log('Chart refs length:', chartRefs.current.length)
      console.log('Chart refs content:', chartRefs.current.map((ref, i) => ({ index: i, exists: !!ref })))
      
      // Add a small delay to ensure charts are fully rendered
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check that all refs are set before proceeding
      const allRefsSet = chartRefs.current.every(ref => ref !== null)
      console.log('All chart refs set:', allRefsSet)
      
      if (!allRefsSet) {
        console.warn('Not all chart refs are set, waiting additional time...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      const gaugeCharts = await Promise.all(
        chartRefs.current
          .map(async (chartRef, originalIndex) => {
            console.log(`Processing chart ${originalIndex}:`, { ref: !!chartRef, biomarker: predictions[originalIndex]?.biomarker_name })
            if (!chartRef) {
              console.log(`Chart ${originalIndex} ref is null`)
              return null
            }
            
            // Check if the element has content
            if (chartRef.offsetWidth === 0 || chartRef.offsetHeight === 0) {
              console.log(`Chart ${originalIndex} has no dimensions:`, chartRef.offsetWidth, 'x', chartRef.offsetHeight)
              return null
            }
            
            try {
              const base64Image = await chartToBase64(chartRef)
              console.log(`Chart ${originalIndex} captured successfully, size: ${base64Image.length}`)
              return {
                name: predictions[originalIndex]?.biomarker_name || `Biomarker ${originalIndex + 1}`,
                image: base64Image
              }
            } catch (error) {
              console.error(`Failed to capture chart ${originalIndex}:`, error)
              return null
            }
          })
      )

      console.log('Raw gauge charts:', gaugeCharts)
      
      // Filter out failed captures
      const validGaugeCharts = gaugeCharts.filter(chart => chart !== null) as Array<{ name: string; image: string }>
      console.log('Valid gauge charts after filtering:', validGaugeCharts.length, validGaugeCharts.map(c => c.name))

      // Convert uploaded image to base64 (handle DICOM files specially)
      let imageBase64: string
      const isDicom = selectedFile.name.toLowerCase().endsWith('.dcm') || 
                     selectedFile.name.toLowerCase().endsWith('.dicom') ||
                     selectedFile.type === 'application/dicom' ||
                     selectedFile.type === 'application/x-dicom' ||
                     selectedFile.type === 'application/dicom+json'
      
      if (isDicom) {
        // For DICOM files, use the backend conversion service
        console.log('Converting DICOM file to image...')
        const formData = new FormData()
        formData.append('file', selectedFile)
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
        console.log('DICOM conversion successful, image length:', imageBase64.length)
      } else {
        // For regular image files, use direct conversion
        imageBase64 = await imageToBase64(selectedFile)
        console.log('Regular image conversion successful, image length:', imageBase64.length)
      }

      // Generate PDF report
      console.log('Generating PDF with data:', {
        analysisType: 'Biomarkers',
        biomarkers: predictions,
        image: imageBase64 ? `${imageBase64.substring(0, 50)}...` : 'undefined',
        metadata: metadata || undefined,
        patientInfo: {
          date: new Date().toLocaleDateString()
        },
        chartData: {
          gaugeCharts: validGaugeCharts
        }
      })
      
      await generateBiomarkerPDFReport({
        analysisType: 'Biomarkers',
        biomarkers: predictions,
        image: imageBase64,
        metadata: metadata || undefined,
        patientInfo: {
          date: new Date().toLocaleDateString()
        },
        chartData: {
          gaugeCharts: validGaugeCharts
        }
      })

    } catch (error) {
      console.error('PDF export failed:', error)
      setError('Failed to export PDF report. Please try again.')
    } finally {
      setExportingPDF(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="bg-purple-500 p-3 rounded-lg">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Biomarker Analysis
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Predict up to 11 different biomarkers from retinal fundus images using advanced AI models
        </p>
      </div>

      {/* Biomarker Selection */}
      <div className="medical-card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Select Biomarkers to Analyze
          </h2>
          <button
            onClick={() => setShowBiomarkerList(!showBiomarkerList)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>{showBiomarkerList ? 'Hide' : 'Show'} Selection</span>
            {showBiomarkerList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Selected: {selectedBiomarkers.length} / {BIOMARKERS.length}
          </span>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={handleClearAll}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            Clear All
          </button>
        </div>

        {showBiomarkerList && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(biomarkerCategories).map(([category, biomarkers]) => (
              <div key={category}>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {biomarkers.map(biomarker => (
                    <label key={biomarker} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBiomarkers.includes(biomarker)}
                        onChange={() => handleBiomarkerToggle(biomarker)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {biomarker}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Upload and Analysis Section */}
        <div className="space-y-6">
          <div className="medical-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upload Retinal Image
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
                  <span>Analyzing biomarkers...</span>
                  <span>{Math.round(uploadProgress.percentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {selectedFile && !loading && (
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full mt-4 medical-button py-3 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="h-5 w-5" />
                <span>
                  Analyze {selectedBiomarkers.length > 0 ? selectedBiomarkers.length : 'All'} Biomarkers
                </span>
              </button>
            )}

            {loading && (
              <div className="mt-4">
                <LoadingSpinner 
                  size="md" 
                  text="Analyzing biomarkers... This may take a few moments"
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
              About Biomarker Prediction
            </h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-300">
              <p>
                Our AI models can predict various biomarkers from retinal fundus images, 
                including cardiovascular, metabolic, and hormonal markers.
              </p>
              <p>
                Each biomarker uses a specialized PyTorch model (.pth) trained on large 
                datasets to provide accurate predictions with confidence scores.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-4">
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  <strong>Note:</strong> These predictions are for research purposes and 
                  should not replace laboratory testing or medical consultation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Image Preview Card */}
          {predictions.length > 0 && selectedFile && (
            <ImagePreviewCard
              imageFile={selectedFile}
              analysisType="Biomarkers"
              biomarkers={predictions}
              metadata={metadata || undefined}
              report={false}
            />
          )}

          {metadata && (
            <MetadataCard metadata={metadata.metadata} />
          )}

          {predictions.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Biomarker Results ({predictions.length})
                </h3>
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPDF || !selectedFile}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {exportingPDF ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Export PDF Report</span>
                    </>
                  )}
                </button>
              </div>

              {/* Biomarker Results Component */}
              <BiomarkerResults
                results={predictions}
                chartRefs={chartRefs}
              />
            </div>
          )}


          {predictions.length === 0 && !metadata && (
            <div className="medical-card p-8 text-center">
              <Activity className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Analysis Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Upload a retinal image to see biomarker predictions and metadata here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}