// Types for API responses and models
export interface PredictionResult {
  prediction: string
  confidence: number
  timestamp: string
  processing_time: number
}

export interface BiomarkerResult {
  biomarker_name: string
  predicted_value: number
  unit: string
  normal_range: string
  timestamp: string
  processing_time: number
}

export interface DicomMetadata {
  patient_id: string
  patient_name: string
  study_date: string
  modality: string
  institution_name: string
  study_description: string
  series_description: string
  image_type: string
  rows: number
  columns: number
  pixel_spacing: string[]
  file_size: number
}

export interface ApiError {
  error: string
  message: string
  status: number
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// Disease types
export type DiseaseType = 'amd' | 'glaucoma' | 'dr'
export type ImageType = 'oct' | 'fundus'

// Biomarker names
export const BIOMARKERS = [
  'Age',
  'BMI',
  'BP_OUT_CALC_AVG_DIASTOLIC_BP',
  'BP_OUT_CALC_AVG_SYSTOLIC_BP',
  'Cholesterol Total',
  'Creatinine',
  'Estradiol',
  'Glucose',
  'HbA1C %',
  'HDL-Cholesterol',
  'Hematocrit',
  'Hemoglobin',
  'Insulin',
  'LDL-Cholesterol Calc',
  'Red Blood Cell',
  'Sex Hormone Binding Globulin',
  'Testosterone Total',
  'Triglyceride'
] as const

export type BiomarkerName = typeof BIOMARKERS[number]

// API client class
class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  private async uploadFile(endpoint: string, file: File, onProgress?: (progress: UploadProgress) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('file', file)

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: (event.loaded / event.total) * 100
            }
            onProgress(progress)
          }
        })
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText)
            resolve(result)
          } catch (e) {
            reject(new Error('Invalid JSON response'))
          }
        } else {
          reject(new Error(`HTTP error! status: ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'))
      })

      xhr.open('POST', `${this.baseUrl}${endpoint}`)
      xhr.send(formData)
    })
  }

  // AMD predictions
  async predictAmdOct(file: File, onProgress?: (progress: UploadProgress) => void): Promise<PredictionResult> {
    return this.uploadFile('/api/amd/oct', file, onProgress)
  }

  async predictAmdFundus(file: File, onProgress?: (progress: UploadProgress) => void): Promise<PredictionResult> {
    return this.uploadFile('/api/amd/fundus', file, onProgress)
  }

  // Glaucoma predictions
  async predictGlaucomaFundus(file: File, onProgress?: (progress: UploadProgress) => void): Promise<PredictionResult> {
    return this.uploadFile('/api/glaucoma/fundus', file, onProgress)
  }

  // DR (Diabetic Retinopathy) predictions
  async predictDrFundus(file: File, onProgress?: (progress: UploadProgress) => void): Promise<PredictionResult> {
    return this.uploadFile('/api/dr/fundus', file, onProgress)
  }

  async predictDrOct(file: File, onProgress?: (progress: UploadProgress) => void): Promise<PredictionResult> {
    return this.uploadFile('/api/dr/oct', file, onProgress)
  }

  // Biomarker predictions
  async predictBiomarker(biomarkerName: BiomarkerName, file: File, onProgress?: (progress: UploadProgress) => void): Promise<BiomarkerResult> {
    return this.uploadFile(`/api/biomarkers/${encodeURIComponent(biomarkerName)}`, file, onProgress)
  }

  // Batch biomarker predictions (Production Ready)
  async predictBiomarkersBatch(biomarkerNames: BiomarkerName[], file: File, onProgress?: (progress: UploadProgress) => void): Promise<{
    predictions: BiomarkerResult[];
    total_processing_time: number;
    timestamp: string;
    processed_biomarkers: number;
    requested_biomarkers: number;
  }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('file', file)
      
      // Add biomarker names to form data
      biomarkerNames.forEach(name => {
        formData.append('biomarkers', name)
      })

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: (event.loaded / event.total) * 100
            }
            onProgress(progress)
          }
        })
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText)
            resolve(result)
          } catch (e) {
            reject(new Error('Invalid JSON response'))
          }
        } else {
          reject(new Error(`HTTP error! status: ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'))
      })

      xhr.open('POST', `${this.baseUrl}/api/biomarkers/batch`)
      xhr.send(formData)
    })
  }

  // DICOM metadata extraction
  async extractDicomMetadata(file: File, onProgress?: (progress: UploadProgress) => void): Promise<DicomMetadata> {
    return this.uploadFile('/api/dicom/metadata', file, onProgress)
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`)
    return this.handleResponse(response)
  }
}

export const apiClient = new ApiClient()
