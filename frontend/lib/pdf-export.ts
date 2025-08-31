import jsPDF from 'jspdf'
import { PredictionResult, BiomarkerResult, DicomMetadata } from './api'

interface ReportData {
  patientInfo?: {
    name?: string
    id?: string
    date?: string
  }
  prediction?: PredictionResult
  biomarkers?: BiomarkerResult[]
  metadata?: DicomMetadata
  image?: string // Base64 image data
  analysisType: 'AMD' | 'Glaucoma' | 'DR' | 'Biomarkers'
}

export function generatePDFReport(data: ReportData): void {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.width
  const pageHeight = pdf.internal.pageSize.height
  const margin = 20
  let yPosition = margin

  // Helper function to check if a value is not null, undefined, or empty string
  const hasValue = (value: any): boolean => {
    return value !== null && value !== undefined && value !== ''
  }

  // Header
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Medical AI Diagnostics Report', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // Report Type
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`${data.analysisType} Analysis Report`, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 20

  // Patient Information (if available)
  if (data.patientInfo?.name || data.patientInfo?.id) {
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Patient Information:', margin, yPosition)
    yPosition += 10

    pdf.setFont('helvetica', 'normal')
    if (data.patientInfo.name) {
      pdf.text(`Name: ${data.patientInfo.name}`, margin + 10, yPosition)
      yPosition += 8
    }
    if (data.patientInfo.id) {
      pdf.text(`ID: ${data.patientInfo.id}`, margin + 10, yPosition)
      yPosition += 8
    }
    if (data.patientInfo.date) {
      pdf.text(`Date: ${data.patientInfo.date}`, margin + 10, yPosition)
      yPosition += 8
    }
    yPosition += 10
  }

  // Analysis Results
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Analysis Results:', margin, yPosition)
  yPosition += 10

  // Single Prediction (AMD, Glaucoma, DR)
  if (data.prediction) {
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Prediction: ${data.prediction.prediction}`, margin + 10, yPosition)
    yPosition += 8
    pdf.text(`Confidence: ${(data.prediction.confidence * 100).toFixed(1)}%`, margin + 10, yPosition)
    yPosition += 8
    pdf.text(`Analysis Date: ${new Date(data.prediction.timestamp).toLocaleString()}`, margin + 10, yPosition)
    yPosition += 8
    if (data.prediction.processing_time) {
      pdf.text(`Processing Time: ${data.prediction.processing_time.toFixed(2)}s`, margin + 10, yPosition)
      yPosition += 8
    }
    yPosition += 10
  }

  // Biomarker Results
  if (data.biomarkers && data.biomarkers.length > 0) {
    pdf.setFont('helvetica', 'bold')
    pdf.text('Biomarker Predictions:', margin, yPosition)
    yPosition += 10

    pdf.setFont('helvetica', 'normal')
    data.biomarkers.forEach((biomarker, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage()
        yPosition = margin
      }

      pdf.text(
        `${biomarker.biomarker_name}: ${biomarker.predicted_value} ${biomarker.unit}`,
        margin + 10,
        yPosition
      )
      yPosition += 6

      if (biomarker.normal_range) {
        pdf.setFontSize(10)
        pdf.setTextColor(100, 100, 100)
        pdf.text(`  Normal range: ${biomarker.normal_range}`, margin + 15, yPosition)
        pdf.setFontSize(12)
        pdf.setTextColor(0, 0, 0)
        yPosition += 6
      }
      yPosition += 2
    })
    yPosition += 10
  }

  // DICOM Metadata
  if (data.metadata) {
    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      pdf.addPage()
      yPosition = margin
    }

    pdf.setFont('helvetica', 'bold')
    pdf.text('DICOM Metadata:', margin, yPosition)
    yPosition += 10

    pdf.setFont('helvetica', 'normal')
    
    // Handle both full response format and inner metadata format
    const metadata = 'metadata' in data.metadata ? data.metadata.metadata : data.metadata
    
    const metadataFields = [
      { label: 'Patient ID', value: hasValue(metadata.patient_id) ? metadata.patient_id : 'N/A' },
      { label: 'Patient Name', value: hasValue(metadata.patient_name) ? metadata.patient_name : 'N/A' },
      { label: 'Patient Sex', value: hasValue(metadata.patient_sex) ? metadata.patient_sex : 'N/A' },
      { label: 'Patient Age', value: hasValue(metadata.patient_age) ? metadata.patient_age : 'N/A' },
      { label: 'Study Date', value: hasValue(metadata.study_date) ? metadata.study_date : 'N/A' },
      { label: 'Study Time', value: hasValue(metadata.study_time) ? metadata.study_time : 'N/A' },
      { label: 'Modality', value: hasValue(metadata.modality) ? metadata.modality : 'N/A' },
      { label: 'Institution', value: hasValue(metadata.institution_name) ? metadata.institution_name : 'N/A' },
      { label: 'Manufacturer', value: hasValue(metadata.manufacturer) ? metadata.manufacturer : 'N/A' },
      { label: 'Study Description', value: hasValue(metadata.study_description) ? metadata.study_description : 'N/A' },
      { label: 'Series Description', value: hasValue(metadata.series_description) ? metadata.series_description : 'N/A' },
      { label: 'Image Type', value: hasValue(metadata.image_type) ? metadata.image_type : 'N/A' },
      { 
        label: 'Image Dimensions', 
        value: (metadata.rows && metadata.columns) 
          ? `${metadata.rows} × ${metadata.columns}` 
          : 'N/A' 
      },
      { 
        label: 'File Size', 
        value: metadata.file_size 
          ? `${(metadata.file_size / 1024 / 1024).toFixed(2)} MB` 
          : 'N/A' 
      },
      { 
        label: 'Pixel Spacing', 
        value: (metadata.pixel_spacing && metadata.pixel_spacing.length > 0)
          ? metadata.pixel_spacing.join(' × ')
          : 'N/A'
      },
      { 
        label: 'Bits Allocated', 
        value: metadata.bits_allocated 
          ? `${metadata.bits_allocated} bits` 
          : 'N/A' 
      }
    ]

    metadataFields.forEach(field => {
      if (field.value) {
        pdf.text(`${field.label}: ${field.value}`, margin + 10, yPosition)
        yPosition += 8
      }
    })
    yPosition += 10
  }

  // Image (if provided)
  if (data.image) {
    // Check if we need a new page
    if (yPosition > pageHeight - 150) {
      pdf.addPage()
      yPosition = margin
    }

    pdf.setFont('helvetica', 'bold')
    pdf.text('Analyzed Image:', margin, yPosition)
    yPosition += 15

    try {
      // Handle data URL format (remove prefix if present)
      let imageData = data.image
      let imageFormat = 'JPEG'
      
      if (data.image.startsWith('data:image/')) {
        const parts = data.image.split(',')
        if (parts.length === 2) {
          imageData = parts[1] // Get the base64 data without the prefix
          // Determine format from data URL
          if (data.image.includes('data:image/png')) {
            imageFormat = 'PNG'
          } else if (data.image.includes('data:image/jpeg') || data.image.includes('data:image/jpg')) {
            imageFormat = 'JPEG'
          }
        }
      }
      
      // Add image to PDF (scaled to fit)
      const imgWidth = 120
      const imgHeight = 90
      pdf.addImage(imageData, imageFormat, margin, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 10
    } catch (error) {
      console.error('Error adding image to PDF:', error)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Image could not be included in the report.', margin, yPosition)
      yPosition += 10
    }
  }

  // Footer
  const footerY = pageHeight - 20
  pdf.setFontSize(10)
  pdf.setTextColor(128, 128, 128)
  pdf.text('Generated by Medical AI Diagnostics Platform', pageWidth / 2, footerY, { align: 'center' })
  pdf.text(`Report generated on ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 5, { align: 'center' })

  // Disclaimer
  if (yPosition < pageHeight - 60) {
    yPosition = pageHeight - 50
  } else {
    pdf.addPage()
    yPosition = margin
  }

  pdf.setFontSize(8)
  pdf.setTextColor(200, 0, 0)
  const disclaimerText = [
    'MEDICAL DISCLAIMER: This report is generated by AI algorithms for research and screening purposes only.',
    'Results should not be used as a substitute for professional medical diagnosis or treatment.',
    'Always consult with qualified healthcare providers for medical decisions.'
  ]

  disclaimerText.forEach((line, index) => {
    pdf.text(line, pageWidth / 2, yPosition + (index * 4), { align: 'center', maxWidth: pageWidth - 40 })
  })

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const filename = `${data.analysisType.toLowerCase()}_report_${timestamp}.pdf`

  // Save the PDF
  pdf.save(filename)
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if it's a DICOM file
    if (file.name.toLowerCase().endsWith('.dcm') || file.name.toLowerCase().endsWith('.dicom')) {
      // For DICOM files, we'll create a placeholder or try to convert
      // Since DICOM conversion is complex, we'll reject for now and handle it in the UI
      reject(new Error('DICOM files need special processing. Please use regular image formats (JPG, PNG) for PDF export.'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert image to base64'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
