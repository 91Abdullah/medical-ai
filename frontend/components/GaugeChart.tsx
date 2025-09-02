'use client'

import React from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

interface GaugeConfig {
  ranges: Array<{
    min: number
    max: number
    color: string
    label: string
  }>
  unit: string
  title: string
}

interface GaugeChartProps {
  value: number
  config: GaugeConfig
  className?: string
}

export function GaugeChart({ value, config, className = '' }: GaugeChartProps) {
  const { ranges } = config
  const currentRange = ranges.find(r => value >= r.min && value <= r.max)

  // Calculate percentage for the gauge (0-100)
  const minValue = ranges[0].min
  const maxValue = ranges[ranges.length - 1].max
  const percentage = ((value - minValue) / (maxValue - minValue)) * 100

  const data = [{
    name: 'Value',
    value: Math.max(0, Math.min(100, percentage)), // Clamp between 0-100
    fill: currentRange?.color || "#gray"
  }]

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {config.title}
        </h3>
        <div className="text-3xl font-bold mb-1" style={{ color: currentRange?.color }}>
          {value.toFixed(1)}{config.unit}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {currentRange?.label || 'Normal Range'}
        </div>
      </div>

      <div className="relative mb-6">
        <ResponsiveContainer width="100%" height={220}>
          <RadialBarChart
            innerRadius="60%"
            outerRadius="100%"
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              background
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Needle/Pointer */}
        <div className="absolute inset-0" style={{ width: '100%', height: '220px' }}>
          <div
            className="absolute transform -translate-x-1/2"
            style={{
              left: '50%',
              top: '78%', // Position at 3/4 from top (center of gauge)
              transformOrigin: '50% 25%', // Rotate from center bottom
              transform: `rotate(${-90 + (percentage * 1.8)}deg)`, // -90 to +90 degrees (180 degree range)
            }}
          >
            <div
              className="w-1.5 bg-gray-800 dark:bg-white"
              style={{
                height: '75px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                clipPath: 'polygon(50% 0%, 45% 100%, 55% 100%)', // Triangle shape
              }}
            />
            <div
              className="w-3 h-3 bg-gray-800 dark:bg-white rounded-full absolute -top-1.5 left-1/2 transform -translate-x-1/2"
              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            />
          </div>
        </div>
      </div>

      {/* Range indicators */}
      <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
        {ranges.map((range, index) => (
          <div key={index} className="text-center p-2 rounded-md bg-gray-50 dark:bg-gray-700">
            <div
              className="w-full h-3 rounded-full mb-2 mx-auto"
              style={{ backgroundColor: range.color }}
            />
            <div className="text-gray-600 dark:text-gray-400 font-medium">
              {range.min}-{range.max}
            </div>
            <div className="text-gray-500 dark:text-gray-500">
              {range.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Predefined configurations for common biomarkers
export const BIOMARKER_CONFIGS: Record<string, GaugeConfig> = {
  'Glucose': {
    title: 'Glucose Level',
    unit: ' mg/dL',
    ranges: [
      { min: 0, max: 70, color: '#ef4444', label: 'Low' },
      { min: 70, max: 100, color: '#eab308', label: 'Normal' },
      { min: 100, max: 125, color: '#f97316', label: 'Prediabetic' },
      { min: 125, max: 200, color: '#ef4444', label: 'High' }
    ]
  },
  'HbA1C %': {
    title: 'HbA1C Level',
    unit: '%',
    ranges: [
      { min: 0, max: 5.7, color: '#22c55e', label: 'Normal' },
      { min: 5.7, max: 6.4, color: '#eab308', label: 'Prediabetic' },
      { min: 6.4, max: 10, color: '#ef4444', label: 'Diabetic' }
    ]
  },
  'Cholesterol Total': {
    title: 'Total Cholesterol',
    unit: ' mg/dL',
    ranges: [
      { min: 0, max: 200, color: '#22c55e', label: 'Desirable' },
      { min: 200, max: 239, color: '#eab308', label: 'Borderline' },
      { min: 239, max: 300, color: '#ef4444', label: 'High' }
    ]
  },
  'HDL-Cholesterol': {
    title: 'HDL Cholesterol',
    unit: ' mg/dL',
    ranges: [
      { min: 0, max: 40, color: '#ef4444', label: 'Low' },
      { min: 40, max: 60, color: '#eab308', label: 'Normal' },
      { min: 60, max: 100, color: '#22c55e', label: 'Protective' }
    ]
  },
  'Triglyceride': {
    title: 'Triglyceride Level',
    unit: ' mg/dL',
    ranges: [
      { min: 0, max: 150, color: '#22c55e', label: 'Normal' },
      { min: 150, max: 199, color: '#eab308', label: 'Borderline' },
      { min: 199, max: 500, color: '#ef4444', label: 'High' }
    ]
  },
  'BP_OUT_CALC_AVG_SYSTOLIC_BP': {
    title: 'Systolic Blood Pressure',
    unit: ' mmHg',
    ranges: [
      { min: 0, max: 120, color: '#22c55e', label: 'Normal' },
      { min: 120, max: 129, color: '#eab308', label: 'Elevated' },
      { min: 129, max: 140, color: '#f97316', label: 'Stage 1' },
      { min: 140, max: 180, color: '#ef4444', label: 'Stage 2' }
    ]
  },
  'BP_OUT_CALC_AVG_DIASTOLIC_BP': {
    title: 'Diastolic Blood Pressure',
    unit: ' mmHg',
    ranges: [
      { min: 0, max: 80, color: '#22c55e', label: 'Normal' },
      { min: 80, max: 89, color: '#eab308', label: 'Stage 1' },
      { min: 89, max: 120, color: '#ef4444', label: 'Stage 2' }
    ]
  }
}
