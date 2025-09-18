import React, { useRef } from 'react';
import { usePDF } from 'react-to-pdf';
import BiomarkerResults from './BiomarkerResults';

// Import biomarker configuration to filter for gauge charts only
const BIOMARKER_CONFIG: Record<string, any> = {
  "Age": {
    ranges: [
      { min: 0, max: 30, label: "Young Adult", color: "#22c55e" },
      { min: 31, max: 60, label: "Middle Age", color: "#eab308" },
      { min: 61, max: 100, label: "Senior", color: "#ef4444" }
    ],
    unit: " years",
    type: "gauge",
    title: "Age",
    description: "Predicted biological age based on retinal analysis"
  },
  "BMI": {
    ranges: [
      { min: 0, max: 18.4, label: "Underweight", color: "#3b82f6" },
      { min: 18.5, max: 24.9, label: "Normal", color: "#22c55e" },
      { min: 25, max: 29.9, label: "Overweight", color: "#eab308" },
      { min: 30, max: 50, label: "Obese", color: "#ef4444" }
    ],
    unit: " kg/m²",
    type: "gauge",
    title: "Body Mass Index",
    description: "Body Mass Index indicating body fat based on height and weight"
  },
  "BP_OUT_CALC_AVG_SYSTOLIC_BP": {
    ranges: [
      { min: 90, max: 120, label: "Normal", color: "#22c55e" },
      { min: 121, max: 139, label: "Elevated", color: "#eab308" },
      { min: 140, max: 159, label: "Stage 1 HTN", color: "#f97316" },
      { min: 160, max: 180, label: "Stage 2 HTN", color: "#ef4444" }
    ],
    unit: " mmHg",
    type: "gauge",
    title: "Systolic Blood Pressure",
    description: "Systolic blood pressure - pressure when heart beats"
  },
  "BP_OUT_CALC_AVG_DIASTOLIC_BP": {
    ranges: [
      { min: 60, max: 80, label: "Normal", color: "#22c55e" },
      { min: 81, max: 89, label: "Elevated", color: "#eab308" },
      { min: 90, max: 99, label: "Stage 1 HTN", color: "#f97316" },
      { min: 100, max: 120, label: "Stage 2 HTN", color: "#ef4444" }
    ],
    unit: " mmHg",
    type: "gauge",
    title: "Diastolic Blood Pressure",
    description: "Diastolic blood pressure - pressure between heart beats"
  },
  "Glucose": {
    ranges: [
      { min: 3.9, max: 5.5, label: "Normal", color: "#22c55e" },
      { min: 5.6, max: 6.9, label: "Prediabetes", color: "#eab308" },
      { min: 7.0, max: 15, label: "Diabetes", color: "#ef4444" }
    ],
    unit: " mmol/L",
    type: "needle",
    title: "Glucose",
    description: "Blood glucose level measurement"
  },
  "HbA1C %": {
    ranges: [
      { min: 4.0, max: 5.6, label: "Normal", color: "#22c55e" },
      { min: 5.7, max: 6.4, label: "Prediabetes", color: "#eab308" },
      { min: 6.5, max: 12, label: "Diabetes", color: "#ef4444" }
    ],
    unit: "%",
    type: "needle",
    title: "HbA1C",
    description: "Average blood sugar over past 2-3 months"
  },
  "Insulin": {
    ranges: [
      { min: 2, max: 25, label: "Normal", color: "#22c55e" },
      { min: 26, max: 35, label: "Borderline", color: "#eab308" },
      { min: 36, max: 100, label: "High", color: "#ef4444" }
    ],
    unit: " μU/mL",
    type: "bar",
    title: "Insulin",
    description: "Hormone that regulates blood sugar levels"
  },
  "Cholesterol Total": {
    ranges: [
      { min: 3.0, max: 5.2, label: "Normal", color: "#22c55e" },
      { min: 5.3, max: 6.2, label: "Borderline", color: "#eab308" },
      { min: 6.3, max: 10, label: "High", color: "#ef4444" }
    ],
    unit: " mmol/L",
    type: "bar",
    title: "Total Cholesterol",
    description: "Total cholesterol level in blood"
  },
  "HDL-Cholesterol": {
    ranges: [
      { min: 0.5, max: 1.0, label: "Low", color: "#ef4444" },
      { min: 1.0, max: 1.5, label: "Moderate", color: "#eab308" },
      { min: 1.5, max: 3, label: "High", color: "#22c55e" }
    ],
    unit: " mmol/L",
    type: "bar",
    title: "HDL-Cholesterol",
    description: "High-density lipoprotein - 'good' cholesterol"
  },
  "LDL-Cholesterol Calc": {
    ranges: [
      { min: 1.0, max: 2.6, label: "Optimal", color: "#22c55e" },
      { min: 2.6, max: 3.3, label: "Near Optimal", color: "#eab308" },
      { min: 3.3, max: 7, label: "High", color: "#ef4444" }
    ],
    unit: " mmol/L",
    type: "bar",
    title: "LDL-Cholesterol",
    description: "Low-density lipoprotein - 'bad' cholesterol"
  },
  "Triglyceride": {
    ranges: [
      { min: 0.5, max: 1.7, label: "Normal", color: "#22c55e" },
      { min: 1.7, max: 2.3, label: "Borderline", color: "#eab308" },
      { min: 2.3, max: 6, label: "High", color: "#ef4444" }
    ],
    unit: " mmol/L",
    type: "bar",
    title: "Triglyceride",
    description: "Triglyceride level in blood"
  },
  "Hematocrit": {
    ranges: [
      { min: 36, max: 46, label: "Normal", color: "#22c55e" },
      { min: 47, max: 54, label: "High", color: "#eab308" },
      { min: 20, max: 35, label: "Low", color: "#ef4444" }
    ],
    unit: "%",
    type: "gauge",
    title: "Hematocrit",
    description: "Volume percentage of red blood cells in blood"
  },
  "Hemoglobin": {
    ranges: [
      { min: 12, max: 16, label: "Normal", color: "#22c55e" },
      { min: 16.1, max: 18, label: "High", color: "#eab308" },
      { min: 6, max: 11.9, label: "Low", color: "#ef4444" }
    ],
    unit: " g/dL",
    type: "gauge",
    title: "Hemoglobin",
    description: "Protein in red blood cells that carries oxygen"
  },
  "Red Blood Cell": {
    ranges: [
      { min: 4.2, max: 5.4, label: "Normal", color: "#22c55e" },
      { min: 5.5, max: 6.5, label: "High", color: "#eab308" },
      { min: 2.5, max: 4.1, label: "Low", color: "#ef4444" }
    ],
    unit: " ×10⁶/μL",
    type: "gauge",
    title: "Red Blood Cell Count",
    description: "Number of red blood cells in blood"
  },
  "Creatinine": {
    ranges: [
      { min: 0.6, max: 1.2, label: "Normal", color: "#22c55e" },
      { min: 1.3, max: 2.0, label: "High", color: "#eab308" },
      { min: 0.1, max: 0.5, label: "Low", color: "#ef4444" }
    ],
    unit: " μmol/L",
    type: "gauge",
    title: "Creatinine",
    description: "Waste product from muscle metabolism"
  },
  "Sex Hormone Binding Globulin": {
    ranges: [
      { min: 10, max: 50, label: "Normal", color: "#22c55e" },
      { min: 51, max: 80, label: "High", color: "#eab308" },
      { min: 1, max: 9, label: "Low", color: "#ef4444" }
    ],
    unit: " nmol/L",
    type: "bar",
    title: "SHBG",
    description: "Protein that binds sex hormones"
  },
  "Estradiol": {
    ranges: [
      { min: 0.05, max: 0.5, label: "Normal", color: "#22c55e" },
      { min: 0.51, max: 1.0, label: "High", color: "#eab308" },
      { min: 0.01, max: 0.04, label: "Low", color: "#ef4444" }
    ],
    unit: " pmol/L",
    type: "bar",
    title: "Estradiol",
    description: "Primary female sex hormone"
  },
  "Testosterone Total": {
    ranges: [
      { min: 8.4, max: 28.7, label: "Normal", color: "#22c55e" },
      { min: 28.8, max: 40, label: "High", color: "#eab308" },
      { min: 2, max: 8.3, label: "Low", color: "#ef4444" }
    ],
    unit: " nmol/L",
    type: "bar",
    title: "Testosterone",
    description: "Primary male sex hormone"
  }
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
    page: {
      margin: 20,
      format: 'a4',
      orientation: 'portrait'
    },
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

  // Create summary table data
  const summaryData = Object.entries(results)
    .filter(([biomarkerName]) => BIOMARKER_CONFIG[biomarkerName])
    .map(([biomarkerName, predicted_value]) => {
      const config = BIOMARKER_CONFIG[biomarkerName];
      const range = config.ranges.find((r: any) =>
        predicted_value >= r.min && predicted_value <= r.max
      );
      return {
        biomarker: config.title,
        value: predicted_value.toFixed(2),
        unit: config.unit,
        status: range?.label || 'Unknown',
        color: range?.color || '#6b7280'
      };
    });

  // Group biomarkers into pages of 6 for better PDF layout
  const BIOMARKERS_PER_PAGE = 6;
  const pages = [];
  for (let i = 0; i < gaugeResults.length; i += BIOMARKERS_PER_PAGE) {
    pages.push(gaugeResults.slice(i, i + BIOMARKERS_PER_PAGE));
  }

  // Helper function to render gauge chart
  const renderGaugeChart = (biomarker: any, value: number) => {
    const config = BIOMARKER_CONFIG[biomarker.biomarker_name];
    if (!config) return null;

    const range = config.ranges.find((r: any) => value >= r.min && value <= r.max);
    const percentage = Math.min(100, Math.max(0, ((value - config.ranges[0].min) /
      (config.ranges[config.ranges.length - 1].max - config.ranges[0].min)) * 100));

    return (
      <div className="relative w-full h-24 bg-gray-100 rounded-lg overflow-hidden">
        {/* Background ranges */}
        <div className="absolute inset-0 flex">
          {config.ranges.map((range: any, index: number) => {
            const width = ((range.max - range.min) /
              (config.ranges[config.ranges.length - 1].max - config.ranges[0].min)) * 100;
            return (
              <div
                key={index}
                className="h-full"
                style={{
                  width: `${width}%`,
                  backgroundColor: range.color,
                  opacity: 0.3
                }}
              />
            );
          })}
        </div>

        {/* Value indicator */}
        <div
          className="absolute top-0 h-full bg-blue-500 opacity-70 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />

        {/* Value text - positioned inside the bar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-lg drop-shadow-lg">
            {value.toFixed(1)}{config.unit}
          </span>
        </div>

        {/* Range labels */}
        <div className="absolute bottom-1 left-2 right-2 flex justify-between text-xs text-gray-600">
          <span>{config.ranges[0].min}{config.unit}</span>
          <span>{config.ranges[config.ranges.length - 1].max}{config.unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* PDF Export Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => toPDF()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
        >
          📄 Download PDF Report
        </button>
      </div>

      {/* PDF Content */}
      <div ref={targetRef} className="bg-white text-gray-900 font-sans">
        {pages.map((pageBiomarkers, pageIndex) => (
          <div key={pageIndex} className="page-break-after-always min-h-screen p-8">
            {/* Header */}
            <div className="text-center mb-8 pb-4 border-b-2 border-blue-200">
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                Biomarker Assessment Report
              </h1>
              <p className="text-gray-600 text-lg">
                AI-Powered Biomarker Analysis from Retinal Images
              </p>
              <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                <span>Page {pageIndex + 1} of {pages.length}</span>
                {patientInfo?.date && (
                  <span>Report Date: {new Date(patientInfo.date).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Patient Information - Only on first page */}
            {pageIndex === 0 && patientInfo && (
              <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>
                <div className="grid grid-cols-2 gap-6">
                  {patientInfo.name && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 w-20">Name:</span>
                      <span className="text-gray-900">{patientInfo.name}</span>
                    </div>
                  )}
                  {patientInfo.age && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 w-20">Age:</span>
                      <span className="text-gray-900">{patientInfo.age} years</span>
                    </div>
                  )}
                  {patientInfo.gender && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 w-20">Gender:</span>
                      <span className="text-gray-900">{patientInfo.gender}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Retinal Image Preview - Only on first page */}
            {pageIndex === 0 && imageUrl && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Analyzed Retinal Image</h2>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl border-2 border-blue-200">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <img
                        src={imageUrl}
                        alt="Retinal fundus image"
                        className="max-w-lg max-h-80 object-contain border-4 border-white rounded-lg shadow-xl"
                      />
                      <div className="absolute -top-2 -right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                        AI Analyzed
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-700 font-medium mb-2">
                      🔬 Advanced AI Analysis Completed
                    </p>
                    <p className="text-sm text-gray-600">
                      This retinal image has been processed using state-of-the-art deep learning algorithms
                      to predict biomarker values. The analysis examines vascular patterns, optic disc morphology,
                      and retinal layer characteristics to provide comprehensive health insights.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Biomarker Results */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Biomarker Analysis Results
                {pageIndex === 0 && <span className="text-sm font-normal text-gray-600 ml-2">(Gauge Charts)</span>}
              </h2>

              {/* Page biomarkers in a clean grid */}
              <div className="grid grid-cols-2 gap-6">
                {pageBiomarkers.map((biomarker, index) => (
                  <div key={biomarker.biomarker_name} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                      {BIOMARKER_CONFIG[biomarker.biomarker_name]?.title || biomarker.biomarker_name}
                    </h3>

                    {/* Render actual gauge chart */}
                    <div className="mb-3">
                      {renderGaugeChart(biomarker, biomarker.predicted_value)}
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-600">
                        Predicted Value: <span className="font-semibold text-gray-900">{biomarker.predicted_value.toFixed(2)}{biomarker.unit}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {BIOMARKER_CONFIG[biomarker.biomarker_name]?.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Table - Only on last page */}
            {pageIndex === pages.length - 1 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Biomarker Summary Table</h2>
                <div className="overflow-hidden border border-gray-300 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Biomarker
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Range
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {summaryData.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.biomarker}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.value}{item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                              style={{
                                backgroundColor: `${item.color}20`,
                                color: item.color,
                                border: `1px solid ${item.color}40`
                              }}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {(() => {
                              const configKey = Object.keys(BIOMARKER_CONFIG).find(key =>
                                BIOMARKER_CONFIG[key].title === item.biomarker
                              );
                              if (configKey && BIOMARKER_CONFIG[configKey]?.ranges) {
                                return BIOMARKER_CONFIG[configKey].ranges.map((r: any) => `${r.min}-${r.max}`).join(', ');
                              }
                              return 'N/A';
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
              <p className="mb-1">Generated by AI Biomarker Analysis System | Confidential Medical Report</p>
              <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PDFReport;
