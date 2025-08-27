import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "prediction-high"
  if (confidence >= 0.6) return "prediction-medium"
  return "prediction-low"
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function validateImageFile(file: File): string | null {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/dicom']
  const maxSize = 50 * 1024 * 1024 // 50MB

  if (!validTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG) or DICOM file.'
  }

  if (file.size > maxSize) {
    return 'File size must be less than 50MB.'
  }

  return null
}
