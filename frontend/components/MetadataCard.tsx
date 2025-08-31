'use client'

import React from 'react'
import { Calendar, User, Building, FileText, Image, Ruler, Database } from 'lucide-react'

interface MetadataCardProps {
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

  // Helper function to check if a value is not empty
  const hasValue = (value: any): boolean => {
    return value !== null && value !== undefined && value !== ''
  }

  const metadataItems = [
    {
      icon: <User className="h-4 w-4" />,
      label: 'Patient ID',
      value: hasValue(metadata.patient_id) ? metadata.patient_id : 'N/A'
    },
    {
      icon: <User className="h-4 w-4" />,
      label: 'Patient Name',
      value: hasValue(metadata.patient_name) ? metadata.patient_name : 'N/A'
    },
    {
      icon: <User className="h-4 w-4" />,
      label: 'Patient Sex',
      value: hasValue(metadata.patient_sex) ? metadata.patient_sex : 'N/A'
    },
    {
      icon: <User className="h-4 w-4" />,
      label: 'Patient Age',
      value: hasValue(metadata.patient_age) ? metadata.patient_age : 'N/A'
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: 'Birth Date',
      value: hasValue(metadata.patient_birth_date) ? metadata.patient_birth_date : 'N/A'
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: 'Study Date',
      value: hasValue(metadata.study_date) ? formatDate(metadata.study_date!) : 'N/A'
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: 'Study Time',
      value: hasValue(metadata.study_time) ? metadata.study_time : 'N/A'
    },
    {
      icon: <Building className="h-4 w-4" />,
      label: 'Institution',
      value: hasValue(metadata.institution_name) ? metadata.institution_name : 'N/A'
    },
    {
      icon: <Building className="h-4 w-4" />,
      label: 'Manufacturer',
      value: hasValue(metadata.manufacturer) ? metadata.manufacturer : 'N/A'
    },
    {
      icon: <Building className="h-4 w-4" />,
      label: 'Model Name',
      value: hasValue(metadata.manufacturer_model_name) ? metadata.manufacturer_model_name : 'N/A'
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Modality',
      value: hasValue(metadata.modality) ? metadata.modality : 'N/A'
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Study Description',
      value: hasValue(metadata.study_description) ? metadata.study_description : 'N/A'
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Series Description',
      value: hasValue(metadata.series_description) ? metadata.series_description : 'N/A'
    },
    {
      icon: <Image className="h-4 w-4" />,
      label: 'Image Type',
      value: hasValue(metadata.image_type) ? metadata.image_type : 'N/A'
    },
    {
      icon: <Ruler className="h-4 w-4" />,
      label: 'Dimensions',
      value: (metadata.rows && metadata.columns) 
        ? `${metadata.rows} × ${metadata.columns}` 
        : 'N/A'
    },
    {
      icon: <Ruler className="h-4 w-4" />,
      label: 'Pixel Spacing',
      value: (metadata.pixel_spacing && metadata.pixel_spacing.length > 0) 
        ? metadata.pixel_spacing.map(x => x.toFixed(3)).join(' × ') + ' mm'
        : 'N/A'
    },
    {
      icon: <Ruler className="h-4 w-4" />,
      label: 'Slice Thickness',
      value: (metadata.slice_thickness !== null && metadata.slice_thickness !== undefined) ? `${metadata.slice_thickness} mm` : 'N/A'
    },
    {
      icon: <Database className="h-4 w-4" />,
      label: 'Bits Allocated',
      value: (metadata.bits_allocated !== null && metadata.bits_allocated !== undefined) ? `${metadata.bits_allocated} bits` : 'N/A'
    },
    {
      icon: <Database className="h-4 w-4" />,
      label: 'Bits Stored',
      value: (metadata.bits_stored !== null && metadata.bits_stored !== undefined) ? `${metadata.bits_stored} bits` : 'N/A'
    },
    {
      icon: <Database className="h-4 w-4" />,
      label: 'File Size',
      value: formatFileSize(metadata.file_size || 0)
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'File Name',
      value: hasValue(metadata.file_name) ? metadata.file_name : 'N/A'
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
