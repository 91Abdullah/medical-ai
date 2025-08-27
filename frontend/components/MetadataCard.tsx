'use client'

import React from 'react'
import { Calendar, User, Building, FileText, Image, Ruler, Database } from 'lucide-react'

interface MetadataCardProps {
  metadata: {
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
  className?: string
}

export function MetadataCard({ metadata, className = '' }: MetadataCardProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    try {
      // DICOM date format is YYYYMMDD
      const year = dateString.substring(0, 4)
      const month = dateString.substring(4, 6)
      const day = dateString.substring(6, 8)
      return new Date(`${year}-${month}-${day}`).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const metadataItems = [
    {
      icon: <User className="h-4 w-4" />,
      label: 'Patient ID',
      value: metadata.patient_id || 'N/A'
    },
    {
      icon: <User className="h-4 w-4" />,
      label: 'Patient Name',
      value: metadata.patient_name || 'N/A'
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: 'Study Date',
      value: metadata.study_date ? formatDate(metadata.study_date) : 'N/A'
    },
    {
      icon: <Building className="h-4 w-4" />,
      label: 'Institution',
      value: metadata.institution_name || 'N/A'
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Modality',
      value: metadata.modality || 'N/A'
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Study Description',
      value: metadata.study_description || 'N/A'
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Series Description',
      value: metadata.series_description || 'N/A'
    },
    {
      icon: <Image className="h-4 w-4" />,
      label: 'Image Type',
      value: metadata.image_type || 'N/A'
    },
    {
      icon: <Ruler className="h-4 w-4" />,
      label: 'Dimensions',
      value: `${metadata.rows || 0} × ${metadata.columns || 0}`
    },
    {
      icon: <Ruler className="h-4 w-4" />,
      label: 'Pixel Spacing',
      value: metadata.pixel_spacing && metadata.pixel_spacing.length > 0 
        ? metadata.pixel_spacing.join(' × ') + ' mm'
        : 'N/A'
    },
    {
      icon: <Database className="h-4 w-4" />,
      label: 'File Size',
      value: formatFileSize(metadata.file_size || 0)
    }
  ]

  return (
    <div className={`medical-card p-6 ${className}`}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <span>DICOM Metadata</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {metadataItems.map((item, index) => (
            <div key={index} className="flex items-start space-x-3 py-2">
              <div className="flex-shrink-0 text-gray-500 dark:text-gray-400 mt-0.5">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
