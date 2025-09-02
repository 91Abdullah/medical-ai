import { PredictionResult, BiomarkerResult, DicomMetadata } from './api'
import * as html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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
  chartData?: {
    severityChart?: string // Base64 chart image
    gaugeCharts?: Array<{ name: string; image: string }> // Biomarker gauge charts
  }
}

// Modern PDF Export using HTML-to-Canvas approach
export async function generatePDFReport(data: ReportData): Promise<void> {
  try {
    // Create HTML content for PDF
    const htmlContent = createPDFHTML(data)

    // Create a temporary div to hold the HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '-9999px'
    tempDiv.style.width = '794px' // A4 width in pixels at 96 DPI
    document.body.appendChild(tempDiv)

    // Use html2canvas to convert HTML to canvas with high quality settings
    const canvas = await (html2canvas as any)(tempDiv, {
      width: 794,
      useCORS: true,
      allowTaint: false,
      background: '#ffffff',
      logging: false,
      letterRendering: true
    })

    // Remove temporary div
    document.body.removeChild(tempDiv)

    // Create actual PDF from canvas using jsPDF with higher quality
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [8.5, 11], // Standard letter size
      compress: true,
      precision: 16,
      userUnit: 1.0,
      putOnlyUsedFonts: true
    })

    // Convert canvas to high-quality image
    const imgData = canvas.toDataURL('image/png', 1.0)

    // Calculate dimensions to fit the content properly
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgAspectRatio = canvas.width / canvas.height
    const pdfAspectRatio = pdfWidth / pdfHeight

    let imgWidth, imgHeight
    if (imgAspectRatio > pdfAspectRatio) {
      // Image is wider than PDF page
      imgWidth = pdfWidth
      imgHeight = pdfWidth / imgAspectRatio
    } else {
      // Image is taller than PDF page
      imgHeight = pdfHeight
      imgWidth = pdfHeight * imgAspectRatio
    }

    // Center the image
    const x = (pdfWidth - imgWidth) / 2
    const y = (pdfHeight - imgHeight) / 2

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, '', 'FAST')

    // Download the PDF
    pdf.save(generateFilename(data))

  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

function createPDFHTML(data: ReportData): string {
  const hasPatientInfo = data.patientInfo?.name || data.patientInfo?.id
  const hasChart = data.chartData?.severityChart || data.chartData?.gaugeCharts?.length

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; width: 794px; max-width: 794px; margin: 0; padding: 30px; background: white; color: #1f2937; box-sizing: border-box; overflow: hidden;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
        <h1 style="color: #1e40af; font-size: 28px; font-weight: 700; margin: 0;">Medical AI Diagnostics</h1>
        <h2 style="color: #6b7280; font-size: 18px; font-weight: 500; margin: 10px 0 0 0;">${data.analysisType} Analysis Report</h2>
        <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <!-- Patient Information (only if no DICOM metadata) -->
      ${!hasPatientInfo && data.metadata ? '' : data.patientInfo?.name || data.patientInfo?.id ? `
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Patient Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            ${data.patientInfo?.name ? `<div><strong>Name:</strong> ${data.patientInfo.name}</div>` : ''}
            ${data.patientInfo?.id ? `<div><strong>ID:</strong> ${data.patientInfo.id}</div>` : ''}
            ${data.patientInfo?.date ? `<div style="grid-column: span 2;"><strong>Date:</strong> ${data.patientInfo.date}</div>` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Analyzed Image -->
      ${data.image ? `
        <div style="margin-bottom: 32px;">
          <h3 style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Analyzed Image</h3>
          <div style="background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center;">
            <img src="${data.image}" style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
          </div>
        </div>
      ` : ''}

      <!-- Prediction Results (only if no chart) -->
      ${!hasChart && data.prediction ? `
        <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Analysis Results</h3>
          <div style="display: grid; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 500;">Prediction:</span>
              <span style="font-weight: 600; color: #1e40af;">${data.prediction.prediction}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 500;">Confidence:</span>
              <span style="font-weight: 600;">${(data.prediction.confidence * 100).toFixed(1)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 500;">Processing Time:</span>
              <span>${data.prediction.processing_time.toFixed(2)}s</span>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Severity Chart (if available) -->
      ${data.chartData?.severityChart ? `
        <div style="margin-bottom: 24px;">
          <h3 style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Severity Analysis</h3>
          <div style="background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center; overflow: hidden; max-width: 100%;">
            <img src="${data.chartData.severityChart}" style="display:block; margin:0 auto; max-width:100%; width: auto; height:auto; border-radius:8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
          </div>
        </div>
      ` : ''}

      <!-- Biomarker Results -->
      ${data.biomarkers ? `
        <div style="margin-bottom: 24px;">
          <h3 style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Biomarker Analysis</h3>
          <div style="display: grid; gap: 16px;">
            ${data.biomarkers.map(biomarker => `
              <div style="background: #f8fafc; border-radius: 8px; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-weight: 600; color: #1f2937;">${biomarker.biomarker_name}</span>
                  <span style="font-weight: 700; color: #1e40af; font-size: 18px;">${biomarker.predicted_value.toFixed(2)} ${biomarker.unit}</span>
                </div>
                <div style="color: #6b7280; font-size: 14px;">Normal Range: ${biomarker.normal_range}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- DICOM Metadata (only if no patient info) -->
      ${!hasPatientInfo && data.metadata ? `
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Study Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
            ${data.metadata.metadata?.modality ? `<div><strong>Modality:</strong> ${data.metadata.metadata.modality}</div>` : ''}
            ${data.metadata.metadata?.study_date ? `<div><strong>Study Date:</strong> ${data.metadata.metadata.study_date}</div>` : ''}
            ${data.metadata.metadata?.institution_name ? `<div style="grid-column: span 2;"><strong>Institution:</strong> ${data.metadata.metadata.institution_name}</div>` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Biomarker Gauge Charts (if available) -->
      ${data.chartData?.gaugeCharts && data.chartData.gaugeCharts.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <h3 style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Biomarker Gauge Charts</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            ${data.chartData.gaugeCharts.map(gauge => `
              <div style="background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center; overflow: hidden;">
                <h4 style="color: #1e40af; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">${gauge.name}</h4>
                <img src="${gauge.image}" style="display:block; margin:0 auto; max-width:100%; height:auto; border-radius:8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 40px;">
        <div style="text-align: center; color: #ef4444; font-size: 12px; line-height: 1.5;">
          <strong>MEDICAL DISCLAIMER:</strong><br>
          This report is generated by AI algorithms for research and screening purposes only.<br>
          Results should not be used as a substitute for professional medical diagnosis or treatment.<br>
          Always consult with qualified healthcare providers for medical decisions.
        </div>
        <div style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
          Generated by Medical AI Diagnostics Platform • ${new Date().toLocaleString()}
        </div>
      </div>
    </div>
  `
}

function generateFilename(data: ReportData): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  return `${data.analysisType.toLowerCase()}_report_${timestamp}.pdf`
}

// Utility function to convert chart component to base64 image
export function chartToBase64(chartElement: HTMLElement): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Set a maximum width for the chart before capturing
      const maxWidth = 700; // Leave some margin for PDF
      const originalWidth = chartElement.style.width;
      
      // Temporarily set width if needed
      if (chartElement.offsetWidth > maxWidth) {
        chartElement.style.width = `${maxWidth}px`;
      }

      (html2canvas as any)(chartElement, {
        useCORS: true,
        allowTaint: false,
        width: Math.min(chartElement.offsetWidth, maxWidth),
        height: chartElement.offsetHeight,
        background: '#ffffff',
        logging: false,
        letterRendering: true,
        scale: 1 // Ensure 1:1 scale to prevent sizing issues
      } as any).then((canvas: HTMLCanvasElement) => {
        // Restore original width
        if (originalWidth) {
          chartElement.style.width = originalWidth;
        }
        
        const base64Image = canvas.toDataURL('image/png', 1.0)
        resolve(base64Image)
      }).catch((error: any) => {
        // Restore original width on error
        if (originalWidth) {
          chartElement.style.width = originalWidth;
        }
        console.error('Error converting chart to image:', error)
        reject(error)
      })
    } catch (error: any) {
      console.error('Error in chartToBase64:', error)
      reject(error)
    }
  })
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if it's a DICOM file
    if (file.name.toLowerCase().endsWith('.dcm') || file.name.toLowerCase().endsWith('.dicom')) {
      // For DICOM files, we need to extract the image data from pixel array
      // This requires sending the file to backend for processing
      dicomToImageBase64(file)
        .then(resolve)
        .catch(reject)
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

// Multi-page PDF export specifically for biomarker reports using captured chart images
export async function generateBiomarkerPDFReport(data: ReportData): Promise<void> {
  try {

    // Create PDF document with standard settings like other reports
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [8.5, 11], // Standard letter size like other reports
      compress: true,
      precision: 16,
      userUnit: 1.0,
      putOnlyUsedFonts: true
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 0.75 // 0.75 inches margin like other reports
    const contentWidth = pageWidth - (margin * 2)
    const contentHeight = pageHeight - (margin * 2)

    // Add header with standard styling
    let yPosition = margin
    pdf.setFontSize(20)
    pdf.setTextColor(30, 64, 175) // #1e40af - same blue as other reports
    pdf.text('Medical AI Diagnostics', margin, yPosition)
    
    yPosition += 0.3
    pdf.setFontSize(14)
    pdf.setTextColor(107, 114, 128) // #6b7280 - same gray as other reports
    pdf.text('Biomarker Visualization Report', margin, yPosition)
    
    yPosition += 0.15
    pdf.setFontSize(10)
    pdf.setTextColor(156, 163, 175) // #9ca3af - same light gray as other reports
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, yPosition)
    
    yPosition += 0.4

    // Add patient info if available (same styling as other reports)
    if (data.patientInfo?.name || data.patientInfo?.id) {
      pdf.setFontSize(12)
      pdf.setTextColor(30, 64, 175)
      pdf.text('Patient Information:', margin, yPosition)
      yPosition += 0.25
      
      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
      if (data.patientInfo.name) {
        pdf.text(`Name: ${data.patientInfo.name}`, margin + 0.1, yPosition)
        yPosition += 0.15
      }
      if (data.patientInfo.id) {
        pdf.text(`ID: ${data.patientInfo.id}`, margin + 0.1, yPosition)
        yPosition += 0.15
      }
      yPosition += 0.25
    }

    // Add charts section header
    pdf.setFontSize(14)
    pdf.setTextColor(30, 64, 175)
    pdf.text('Biomarker Charts:', margin, yPosition)
    yPosition += 0.25

    // Add captured chart images with proper spacing
    const charts = data.chartData?.gaugeCharts || []
    
    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i]
      
      // Check if we need a new page for this chart
      const chartHeight = 2.5 // 2.5 inches for charts
      const requiredSpace = chartHeight + 0.8 // chart + spacing
      
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
        
        // Re-add header on new page
        pdf.setFontSize(14)
        pdf.setTextColor(30, 64, 175)
        pdf.text('Biomarker Charts (continued):', margin, yPosition)
        yPosition += 0.25
      }

      // Add chart title
      pdf.setFontSize(11)
      pdf.setTextColor(0, 0, 0)
      pdf.text(chart.name, margin, yPosition)
      yPosition += 0.2

      // Add chart image with proper aspect ratio
      try {
        // Use standard dimensions that maintain aspect ratio
        const chartWidth = 3.0 // 3 inches width
        const chartHeight = 2.25 // 2.25 inches height (4:3 aspect ratio)
        
        // Center the chart on the page
        const chartX = margin + (contentWidth - chartWidth) / 2
        
        pdf.addImage(chart.image, 'PNG', chartX, yPosition, chartWidth, chartHeight)
        yPosition += chartHeight + 0.3
      } catch (error) {
        console.error(`Failed to add chart ${chart.name}:`, error)
        pdf.setFontSize(10)
        pdf.setTextColor(239, 68, 68) // Red color for error
        pdf.text(`Error: Could not load chart for ${chart.name}`, margin, yPosition)
        yPosition += 0.3
      }
    }

    // Add biomarker values table if space allows
    if (data.biomarkers && data.biomarkers.length > 0 && yPosition < pageHeight - 1.5) {
      yPosition += 0.3
      pdf.setFontSize(14)
      pdf.setTextColor(30, 64, 175)
      pdf.text('Biomarker Values:', margin, yPosition)
      yPosition += 0.25

      // Add table headers
      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
      pdf.text('Biomarker', margin, yPosition)
      pdf.text('Value', margin + 2.5, yPosition)
      pdf.text('Status', margin + 4.0, yPosition)
      yPosition += 0.1
      
      // Draw line under headers
      pdf.setDrawColor(200, 200, 200)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 0.1

      // Add biomarker data
      for (const biomarker of data.biomarkers) {
        if (yPosition > pageHeight - 0.2) {
          pdf.addPage()
          yPosition = margin
        }
        
        pdf.text(biomarker.biomarker_name, margin, yPosition)
        pdf.text(biomarker.predicted_value.toString(), margin + 2.5, yPosition)
        pdf.text(biomarker.normal_range || 'N/A', margin + 4.0, yPosition)
        yPosition += 0.15
      }
    }

    // Add standard disclaimer (same as other reports)
    if (yPosition > pageHeight - 1.0) {
      pdf.addPage()
      yPosition = margin
    } else {
      yPosition += 0.3
    }

    // Draw line above disclaimer
    pdf.setDrawColor(229, 231, 235) // #e5e7eb
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 0.2

    // Add disclaimer with same styling as other reports
    pdf.setFontSize(9)
    pdf.setTextColor(239, 68, 68) // #ef4444 - same red as other reports
    const disclaimerLines = [
      'MEDICAL DISCLAIMER:',
      'This report is generated by AI algorithms for research and screening purposes only.',
      'Results should not be used as a substitute for professional medical diagnosis or treatment.',
      'Always consult with qualified healthcare providers for medical decisions.'
    ]

    for (const line of disclaimerLines) {
      pdf.text(line, margin, yPosition)
      yPosition += 0.12
    }

    // Add footer with generation info
    yPosition += 0.15
    pdf.setFontSize(8)
    pdf.setTextColor(156, 163, 175) // #9ca3af
    pdf.text(`Generated by Medical AI Diagnostics Platform • ${new Date().toLocaleString()}`, margin, yPosition)

    // Save the PDF
    const fileName = `biomarker-report-${Date.now()}.pdf`
    pdf.save(fileName)
    console.log('PDF saved as:', fileName)

  } catch (error) {
    console.error('PDF generation failed:', error)
    throw new Error('Failed to generate PDF report')
  }
}

// Convert DICOM file to base64 image by extracting pixel data
async function dicomToImageBase64(file: File): Promise<string> {
  try {
    // Create FormData to send the DICOM file to backend
    const formData = new FormData()
    formData.append('file', file)

    // Send to backend DICOM processing endpoint
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

    return result.image_base64
  } catch (error) {
    console.error('Error converting DICOM to image:', error)
    throw new Error('DICOM files need special processing. Please use regular image formats (JPG, PNG) for PDF export.')
  }
}
