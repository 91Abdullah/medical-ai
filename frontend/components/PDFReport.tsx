import React, { useRef } from 'react';
import { usePDF } from 'react-to-pdf';
import BiomarkerResults from './BiomarkerResults';

// Import biomarker configuration to filter for gauge charts only
const BIOMARKER_CONFIG: Record<string, any> = {
  "Age": { type: "gauge", unit: " years", title: "Age" },
  "BMI": { type: "gauge", unit: " kg/m²", title: "Body Mass Index" },
  "BP_OUT_CALC_AVG_SYSTOLIC_BP": { type: "gauge", unit: " mmHg", title: "Systolic Blood Pressure" },
  "BP_OUT_CALC_AVG_DIASTOLIC_BP": { type: "gauge", unit: " mmHg", title: "Diastolic Blood Pressure" },
  "Glucose": { type: "needle", unit: " mmol/L", title: "Glucose" },
  "HbA1C %": { type: "needle", unit: "%", title: "HbA1C" },
  "Insulin": { type: "bar", unit: " μU/mL", title: "Insulin" },
  "Cholesterol Total": { type: "bar", unit: " mmol/L", title: "Total Cholesterol" },
  "HDL-Cholesterol": { type: "bar", unit: " mmol/L", title: "HDL-Cholesterol" },
  "LDL-Cholesterol Calc": { type: "bar", unit: " mmol/L", title: "LDL-Cholesterol" },
  "Triglyceride": { type: "bar", unit: " mmol/L", title: "Triglyceride" },
  "Hematocrit": { type: "gauge", unit: "%", title: "Hematocrit" },
  "Hemoglobin": { type: "gauge", unit: " g/dL", title: "Hemoglobin" },
  "Red Blood Cell": { type: "gauge", unit: " ×10⁶/μL", title: "Red Blood Cell Count" },
  "Creatinine": { type: "gauge", unit: " μmol/L", title: "Creatinine" },
  "Sex Hormone Binding Globulin": { type: "bar", unit: " nmol/L", title: "SHBG" },
  "Estradiol": { type: "bar", unit: " pmol/L", title: "Estradiol" },
  "Testosterone Total": { type: "bar", unit: " nmol/L", title: "Testosterone" }
};

interface PDFReportProps {
  results: Record<string, number>;
  imageUrl?: string;
  patientInfo?: {
    name?: string;
    age?: number;
    gender?: string;
    date?: string;
  };
}

const PDFReport: React.FC<PDFReportProps> = ({ results, imageUrl, patientInfo }) => {
  const { toPDF, targetRef } = usePDF({
    filename: 'biomarker-assessment-report.pdf',
    page: { margin: 20 },
    resolution: 2
  });

  // Filter results to only include gauge-type biomarkers
  const gaugeResults = Object.entries(results)
    .filter(([biomarkerName]) => BIOMARKER_CONFIG[biomarkerName]?.type === 'gauge')
    .map(([biomarkerName, predicted_value]) => ({
      biomarker_name: biomarkerName,
      predicted_value,
      unit: BIOMARKER_CONFIG[biomarkerName]?.unit || '',
      normal_range: '',
      timestamp: new Date().toISOString(),
      processing_time: 0
    }));

  return (
    <div>
      {/* PDF Export Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => toPDF()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Download PDF Report
        </button>
      </div>

      {/* PDF Content */}
      <div ref={targetRef} className="bg-white p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Biomarker Assessment Report
          </h1>
          <p className="text-gray-600">
            AI-Powered Biomarker Analysis from Retinal Images
          </p>
          {patientInfo?.date && (
            <p className="text-sm text-gray-500 mt-2">
              Report Date: {new Date(patientInfo.date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Patient Information */}
        {patientInfo && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {patientInfo.name && (
                <div>
                  <span className="font-medium">Name:</span> {patientInfo.name}
                </div>
              )}
              {patientInfo.age && (
                <div>
                  <span className="font-medium">Age:</span> {patientInfo.age} years
                </div>
              )}
              {patientInfo.gender && (
                <div>
                  <span className="font-medium">Gender:</span> {patientInfo.gender}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Retinal Image */}
        {imageUrl && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Retinal Image</h2>
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt="Retinal fundus image"
                className="max-w-md max-h-64 object-contain border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Biomarker Results */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Biomarker Analysis Results (Gauge Charts Only)</h2>
          <BiomarkerResults results={gaugeResults} />
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Disclaimer</h3>
          <p className="text-sm text-yellow-700">
            This report contains AI-generated predictions based on retinal image analysis.
            These results are for research and informational purposes only and should not
            replace professional medical advice, diagnosis, or treatment. Please consult
            with qualified healthcare professionals for medical decisions.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Generated by AI Biomarker Analysis System</p>
          <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PDFReport;
