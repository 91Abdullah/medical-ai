// Types for API responses and models
export interface PredictionResult {
  prediction: string
  confidence: number
  timestamp: string
  processing_time: number
  classes?: string[] // Dynamic classes from model
  class_probabilities?: Record<string, number> // Probabilities for each class
  threshold?: number // Detection threshold used by model
  risk_category?: string // Risk category (Low/Medium/High)
  risk_color?: string // Color for risk category display
  threshold_explanation?: string // Explanation of threshold logic
  clinical_note?: string // Clinical guidance note
  probability?: number // Raw probability from model
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
  metadata: {
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
  status: string
  timestamp: string
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
  // 'BP_OUT_CALC_AVG_DIASTOLIC_BP',
  // 'BP_OUT_CALC_AVG_SYSTOLIC_BP',
  'Cholesterol Total',
  'Creatinine',
  // 'Estradiol',
  'Glucose',
  'HbA1C %',
  'HDL-Cholesterol',
  'Hematocrit',
  'Hemoglobin',
  'Insulin',
  'LDL-Cholesterol Calc',
  'Red Blood Cell',
  // 'Sex Hormone Binding Globulin',
  // 'Testosterone Total',
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

      xhr.open('POST', `${endpoint}`)
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

  async predictGlaucomaOct(file: File, onProgress?: (progress: UploadProgress) => void): Promise<PredictionResult> {
    return this.uploadFile('/api/glaucoma/oct', file, onProgress)
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

      xhr.open('POST', `/api/biomarkers/batch`)
      xhr.send(formData)
    })
  }

  // DICOM metadata extraction
  async extractDicomMetadata(file: File, onProgress?: (progress: UploadProgress) => void): Promise<DicomMetadata> {
    return this.uploadFile('/api/dicom/metadata', file, onProgress)
  }

  // DICOM image extraction
  async extractDicomImage(file: File, onProgress?: (progress: UploadProgress) => void): Promise<{ image: string; status: string; timestamp: string }> {
    return this.uploadFile('/api/dicom/image', file, onProgress)
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`/api/health`)
    return this.handleResponse(response)
  }
}

export const apiClient = new ApiClient()
