import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { BiomarkerResult } from '../lib/api';
import DynamicBiomarkerGauge from './ThreeColorGauge'; // Import the new dynamic gauge

interface BiomarkerConfig {
  ranges: Array<{
    min: number;
    max: number;
    label: string;
    color: string;
  }>;
  unit: string;
  type: string;
  description: string;
  title: string;
}

interface GaugeChartProps {
  value: number;
  config: BiomarkerConfig;
}

interface BiomarkerCardProps {
  result: BiomarkerResult;
  onChartRef?: (el: HTMLDivElement | null) => void;
  sex?: 'male' | 'female';
  menopausalStatus?: 'pre' | 'post';
}

interface BiomarkerModalProps {
  biomarker: string;
  value: number;
  config: BiomarkerConfig;
  isOpen: boolean;
  onClose: () => void;
}

const BIOMARKER_CONFIG: Record<string, BiomarkerConfig> = {
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
    type: "gauge",
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
    type: "gauge",
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
    type: "gauge",
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
    type: "gauge",
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
    type: "gauge",
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
    type: "gauge",
    title: "LDL-Cholesterol",
    description: "Low-density lipoprotein - 'bad' cholesterol"
  },
  "Triglyceride": {
    ranges: [
      { min: 0.5, max: 1.7, label: "Normal", color: "#22c55e" },
      { min: 1.8, max: 2.2, label: "Borderline", color: "#eab308" },
      { min: 2.3, max: 5, label: "High", color: "#ef4444" }
    ],
    unit: " mmol/L",
    type: "gauge",
    title: "Triglyceride",
    description: "Type of fat found in blood"
  },
  "Hematocrit": {
    ranges: [
      { min: 20, max: 29, label: "Very Low", color: "#ef4444" },
      { min: 30, max: 34, label: "Low", color: "#eab308" },
      { min: 35, max: 45, label: "Normal", color: "#22c55e" },
      { min: 46, max: 55, label: "High", color: "#f97316" }
    ],
    unit: "%",
    type: "gauge",
    title: "Hematocrit",
    description: "Percentage of blood composed of red blood cells"
  },
  "Hemoglobin": {
    ranges: [
      { min: 12, max: 16, label: "Normal", color: "#22c55e" },
      { min: 10, max: 11.9, label: "Low", color: "#eab308" },
      { min: 16.1, max: 20, label: "High", color: "#f97316" }
    ],
    unit: " g/dL",
    type: "gauge",
    title: "Hemoglobin",
    description: "Protein in red blood cells that carries oxygen"
  },
  "Red Blood Cell": {
    ranges: [
      { min: 4.0, max: 5.5, label: "Normal", color: "#22c55e" },
      { min: 3.5, max: 3.9, label: "Low", color: "#eab308" },
      { min: 5.6, max: 7, label: "High", color: "#f97316" }
    ],
    unit: " x10⁶/μL",
    type: "gauge",
    title: "Red Blood Cell Count",
    description: "Count of red blood cells in blood"
  },
  "Creatinine": {
    ranges: [
      { min: 30, max: 59, label: "Low", color: "#eab308" },
      { min: 60, max: 110, label: "Normal", color: "#22c55e" },
      { min: 111, max: 130, label: "Borderline", color: "#eab308" },
      { min: 131, max: 200, label: "High", color: "#ef4444" }
    ],
    unit: " μmol/L",
    type: "gauge",
    title: "Creatinine",
    description: "Waste product that indicates kidney function"
  },
  "Sex Hormone Binding Globulin": {
    ranges: [
      { min: 20, max: 60, label: "Normal", color: "#22c55e" },
      { min: 10, max: 19, label: "Low", color: "#eab308" },
      { min: 61, max: 100, label: "High", color: "#f97316" }
    ],
    unit: " nmol/L",
    type: "gauge",
    title: "SHBG",
    description: "Protein that binds sex hormones in blood"
  },
  // FIXED: Sex-specific estradiol ranges
  "Estradiol_Male": {
    ranges: [
      { min: 37, max: 147, label: "Normal", color: "#22c55e" },
      { min: 20, max: 36, label: "Low", color: "#eab308" },
      { min: 148, max: 300, label: "High", color: "#f97316" }
    ],
    unit: " pmol/L",
    type: "gauge",
    title: "Estradiol (Male)",
    description: "Primary female sex hormone - male reference range"
  },
  "Estradiol_Female_Pre": {
    ranges: [
      { min: 110, max: 1468, label: "Normal", color: "#22c55e" },
      { min: 50, max: 109, label: "Low", color: "#eab308" },
      { min: 1469, max: 2000, label: "High", color: "#f97316" }
    ],
    unit: " pmol/L",
    type: "gauge",
    title: "Estradiol (Premenopausal)",
    description: "Primary female sex hormone - premenopausal range"
  },
  "Estradiol_Female_Post": {
    ranges: [
      { min: 0, max: 110, label: "Normal", color: "#22c55e" },
      { min: 111, max: 200, label: "Elevated", color: "#eab308" },
      { min: 201, max: 400, label: "High", color: "#f97316" }
    ],
    unit: " pmol/L",
    type: "gauge",
    title: "Estradiol (Postmenopausal)",
    description: "Primary female sex hormone - postmenopausal range"
  },
  // FIXED: Sex-specific testosterone ranges
  "Testosterone_Male": {
    ranges: [
      { min: 15.6, max: 20.8, label: "Normal", color: "#22c55e" },
      { min: 10.4, max: 15.5, label: "Low Normal", color: "#eab308" },
      { min: 0, max: 10.3, label: "Low", color: "#ef4444" },
      { min: 20.9, max: 38, label: "High", color: "#f97316" }
    ],
    unit: " nmol/L",
    type: "gauge",
    title: "Testosterone (Male)",
    description: "Primary male sex hormone - male reference range"
  },
  "Testosterone_Female": {
    ranges: [
      { min: 0.5, max: 2.4, label: "Normal", color: "#22c55e" },
      { min: 0.2, max: 0.4, label: "Low", color: "#eab308" },
      { min: 2.5, max: 5.0, label: "High", color: "#f97316" }
    ],
    unit: " nmol/L",
    type: "gauge",
    title: "Testosterone (Female)",
    description: "Primary male sex hormone - female reference range"
  }
};

// Helper function to get sex-specific biomarker config
export const getBiomarkerConfig = (biomarkerName: string, sex?: 'male' | 'female', menopausalStatus?: 'pre' | 'post'): BiomarkerConfig | null => {
  // Handle sex-specific biomarkers
  if (biomarkerName === 'Estradiol') {
    if (sex === 'male') {
      return BIOMARKER_CONFIG['Estradiol_Male'];
    } else if (sex === 'female') {
      if (menopausalStatus === 'post') {
        return BIOMARKER_CONFIG['Estradiol_Female_Post'];
      } else {
        return BIOMARKER_CONFIG['Estradiol_Female_Pre'];
      }
    }
    // Default to premenopausal female if no sex specified
    return BIOMARKER_CONFIG['Estradiol_Female_Pre'];
  }
  
  if (biomarkerName === 'Testosterone Total' || biomarkerName === 'Testosterone') {
    if (sex === 'male') {
      return BIOMARKER_CONFIG['Testosterone_Male'];
    } else if (sex === 'female') {
      return BIOMARKER_CONFIG['Testosterone_Female'];
    }
    // Default to male if no sex specified
    return BIOMARKER_CONFIG['Testosterone_Male'];
  }
  
  // Handle standard biomarkers
  return BIOMARKER_CONFIG[biomarkerName] || null;
};

// UPDATED: Use the new DynamicBiomarkerGauge instead of ThreeColorGauge
const GaugeChart: React.FC<GaugeChartProps> = memo(({ value, config }) => {
  return (
    <div className="flex justify-center">
      <DynamicBiomarkerGauge
        value={value}
        biomarkerConfig={config}
        width={300}
      />
    </div>
  );
});

GaugeChart.displayName = 'GaugeChart';

const BiomarkerModal: React.FC<BiomarkerModalProps> = memo(({ 
  biomarker, 
  value, 
  config, 
  isOpen, 
  onClose 
}) => {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const currentRange = config.ranges.find((r) => value >= r.min && value <= r.max);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 id="modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">
              {biomarker} Analysis
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
          
          <div className="mb-6">
            <GaugeChart value={value} config={config} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Prediction Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Predicted Value:</span>
                    <span 
                      className="font-bold"
                      style={{ color: currentRange?.color }}
                    >
                      {value.toFixed(2)}{config.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Classification:</span>
                    <span 
                      className="font-bold"
                      style={{ color: currentRange?.color }}
                    >
                      {currentRange?.label || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                About This Biomarker
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {config.description}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reference Ranges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.ranges.map((range, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border"
                  style={{ 
                    borderColor: range.color,
                    backgroundColor: `${range.color}10`
                  }}
                >
                  <div className="font-semibold mb-1" style={{ color: range.color }}>
                    {range.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {range.min} - {range.max}{config.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

BiomarkerModal.displayName = 'BiomarkerModal';

const BiomarkerCard: React.FC<BiomarkerCardProps> = memo(({ 
  result, 
  onChartRef, 
  sex, 
  menopausalStatus 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // UPDATED: Use sex-specific config selection
  const config = getBiomarkerConfig(result.biomarker_name, sex, menopausalStatus);
  
  const handleCardClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  }, [handleCardClick]);

  if (!config) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
          {result.biomarker_name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Configuration not available
        </p>
        <div className="text-xl font-bold text-blue-600">
          {result.predicted_value.toFixed(2)}
        </div>
      </div>
    );
  }

  const currentRange = config.ranges.find((r) => 
    result.predicted_value >= r.min && result.predicted_value <= r.max
  );

  return (
    <>
      <div
        ref={onChartRef}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${result.biomarker_name}: ${result.predicted_value.toFixed(1)}${config.unit}`}
        className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {config.title || result.biomarker_name}
        </h3>
        
        <GaugeChart value={result.predicted_value} config={config} />
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Status:
            </span>
            <span
              className="px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: currentRange?.color || '#6b7280' }}
            >
              {currentRange?.label || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      <BiomarkerModal
        biomarker={config.title || result.biomarker_name}
        value={result.predicted_value}
        config={config}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
});

BiomarkerCard.displayName = 'BiomarkerCard';

interface BiomarkerResultsProps {
  results: BiomarkerResult[];
  chartRefs?: React.MutableRefObject<(HTMLDivElement | null)[]>;
  sex?: 'male' | 'female';
  menopausalStatus?: 'pre' | 'post';
}

const BiomarkerResults: React.FC<BiomarkerResultsProps> = ({ 
  results, 
  chartRefs, 
  sex, 
  menopausalStatus 
}) => {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No biomarker results available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {results.map((result, index) => (
        <BiomarkerCard
          key={`${result.biomarker_name}-${index}`}
          result={result}
          sex={sex}
          menopausalStatus={menopausalStatus}
          onChartRef={chartRefs ? (el) => { 
            console.log(`Setting chart ref for index ${index}:`, !!el)
            if (chartRefs.current) {
              chartRefs.current[index] = el; 
            }
          } : undefined}
        />
      ))}
    </div>
  );
};

export default BiomarkerResults;