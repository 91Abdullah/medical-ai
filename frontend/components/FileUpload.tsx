'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, FileImage, File, X, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  /**
   * You can still pass a custom accept object if you want,
   * but by default we include extensions + MIME for images & DICOM.
   */
  accept?: Record<string, string[]>
  maxSize?: number
  className?: string
  disabled?: boolean
  currentFile?: File | null
  loading?: boolean
}

const DEFAULT_ACCEPT: Record<string, string[]> = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],

  // DICOM (various MIME labels seen in the wild)
  'application/dicom': ['.dcm', '.dicom'],
  'application/x-dicom': ['.dcm', '.dicom'],
  'application/dicom+json': ['.dcm', '.dicom'],
  // Some browsers report DICOM as generic octet-stream; include extensions
  'application/octet-stream': ['.dcm', '.dicom'],
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = DEFAULT_ACCEPT,
  maxSize = 50 * 1024 * 1024, // 50MB
  className = '',
  disabled = false,
  currentFile = null,
  loading = false
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setError(null)

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      const firstErr = rejection.errors[0]
      if (firstErr?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`)
      } else if (firstErr?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload JPEG, PNG, or DICOM files.')
      } else {
        setError('File upload failed. Please try again.')
      }
      return
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect, maxSize])

  // Optional: be extra nice to DICOM with empty MIME by looking at filename.
  const dicomFriendlyValidator = (file: File) => {
    const name = (file.name || '').toLowerCase()
    const looksDicom = name.endsWith('.dcm') || name.endsWith('.dicom')
    // If it looks like DICOM but the browser didn't set a known type,
    // Dropzone will still accept because our accept object includes the extensions.
    // Returning null means "no custom error".
    return null
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,                 // <-- now includes extensions
    validator: dicomFriendlyValidator,
    maxSize,
    multiple: false,
    disabled: disabled || loading
  })

  const handleRemoveFile = () => {
    setError(null)
    onFileRemove?.()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const getFileIcon = (file: File) => {
    if ((file.type || '').startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-blue-500" />
    }
    // For DICOM, file.type is often empty or octet-stream
    return <File className="h-8 w-8 text-gray-500" />
  }

  return (
    <div className={`w-full ${className}`}>
      {currentFile ? (
        <div className="medical-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(currentFile)}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {currentFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(currentFile.size)}
                </p>
              </div>
            </div>
            {!loading && onFileRemove && (
              <button
                onClick={handleRemoveFile}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Remove file"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
            ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
          `}
        >
          <input
            {...getInputProps()}
            // This accept string helps the native picker show .dcm files explicitly
            accept=".jpg,.jpeg,.png,.dcm,.dicom,application/dicom,application/x-dicom,application/dicom+json,application/octet-stream,image/jpeg,image/png"
          />
          <div className="space-y-3">
            <Upload className={`mx-auto h-12 w-12 ${error ? 'text-red-500' : 'text-gray-400'}`} />
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {isDragActive ? 'Drop the file here' : 'Upload medical image'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Drag and drop or click to select
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Supports JPEG, PNG, and DICOM files (max {Math.round(maxSize / (1024 * 1024))}MB)
              </p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-3 flex items-center space-x-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  )
}
