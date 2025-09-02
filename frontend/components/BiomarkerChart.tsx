'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Activity, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'

interface BiomarkerData {
  biomarker_name: string
  predicted_value: number
  unit: string
  normal_range: string
  timestamp: string
  processing_time: number
}

interface BiomarkerChartProps {
  biomarkers: BiomarkerData[];
  className?: string;
}

interface SingleBiomarkerChartProps {
  biomarker: BiomarkerData
  className?: string
}

export function SingleBiomarkerChart({ biomarker, className = '' }: SingleBiomarkerChartProps) {
  const parseNormalRange = (range: string): { min: number; max: number } | null => {
    if (!range) return null

    const cleanRange = range.replace(/[^\d\.\-\s<>]/g, '').trim()

    if (cleanRange.includes('-')) {
      const [min, max] = cleanRange.split('-').map(s => parseFloat(s.trim()))
      if (!isNaN(min) && !isNaN(max)) {
        return { min, max }
      }
    } else if (cleanRange.includes('<')) {
      const max = parseFloat(cleanRange.replace('<', '').trim())
      if (!isNaN(max)) {
        return { min: 0, max }
      }
    } else if (cleanRange.includes('>')) {
      const min = parseFloat(cleanRange.replace('>', '').trim())
      if (!isNaN(min)) {
        return { min, max: min * 2 }
      }
    }

    return null
  }

  const getStatusAndColor = (value: number, normalRange: string): { status: 'normal' | 'warning' | 'danger'; color: string } => {
    const range = parseNormalRange(normalRange)

    if (!range) {
      return { status: 'warning', color: '#f59e0b' }
    }

    const { min, max } = range
    const warningMin = min * 0.9
    const warningMax = max * 1.1

    if (value >= min && value <= max) {
      return { status: 'normal', color: '#10b981' } // Green
    } else if (value >= warningMin && value <= warningMax) {
      return { status: 'warning', color: '#f59e0b' } // Yellow
    } else {
      return { status: 'danger', color: '#ef4444' } // Red
    }
  }

  const range = parseNormalRange(biomarker.normal_range)
  const { status, color } = getStatusAndColor(biomarker.predicted_value, biomarker.normal_range)

  // Calculate chart dimensions
  const maxValue = range ? Math.max(range.max * 1.2, biomarker.predicted_value * 1.2) : biomarker.predicted_value * 1.5
  const minValue = range ? Math.min(range.min * 0.8, biomarker.predicted_value * 0.8) : 0

  const chartData = [{
    name: biomarker.biomarker_name,
    value: biomarker.predicted_value,
    normalMin: range?.min || 0,
    normalMax: range?.max || 0,
    displayValue: biomarker.predicted_value
  }]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{biomarker.biomarker_name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Value: {data.displayValue} {biomarker.unit}
          </p>
          {range && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Normal Range: {range.min} - {range.max} {biomarker.unit}
            </p>
          )}
          <p className={`text-sm font-medium ${
            status === 'normal' ? 'text-green-600' :
            status === 'warning' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {status === 'normal' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          {status === 'danger' && <AlertCircle className="h-4 w-4 text-red-500" />}
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {biomarker.biomarker_name}
          </span>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${
            status === 'normal' ? 'text-green-600' :
            status === 'warning' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {biomarker.predicted_value} {biomarker.unit}
          </div>
          {range && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Normal: {range.min} - {range.max} {biomarker.unit}
            </div>
          )}
        </div>
      </div>

      <div className="h-8 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              domain={[minValue, maxValue]}
              hide
            />
            <YAxis type="category" hide />
            <Bar
              dataKey="value"
              fill={color}
              radius={[0, 4, 4, 0]}
            />
            {range && (
              <>
                <ReferenceLine
                  x={range.min}
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                />
                <ReferenceLine
                  x={range.max}
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface ChartDataPoint {
  name: string
  value: number
  unit: string
  normalMin?: number
  normalMax?: number
  status: 'normal' | 'warning' | 'danger'
  color: string
}

export function BiomarkerChart({ biomarkers, className = '' }: BiomarkerChartProps) {
  // Parse normal ranges and determine status
  const parseNormalRange = (range: string): { min: number; max: number } | null => {
    if (!range) return null

    // Handle various range formats like "70-100", "< 100", "> 50", "50-100 mg/dL"
    const cleanRange = range.replace(/[^\d\.\-\s<>]/g, '').trim()

    if (cleanRange.includes('-')) {
      const [min, max] = cleanRange.split('-').map(s => parseFloat(s.trim()))
      if (!isNaN(min) && !isNaN(max)) {
        return { min, max }
      }
    } else if (cleanRange.includes('<')) {
      const max = parseFloat(cleanRange.replace('<', '').trim())
      if (!isNaN(max)) {
        return { min: 0, max }
      }
    } else if (cleanRange.includes('>')) {
      const min = parseFloat(cleanRange.replace('>', '').trim())
      if (!isNaN(min)) {
        return { min, max: min * 2 } // Assume reasonable upper bound
      }
    }

    return null
  }

  const getStatusAndColor = (value: number, normalRange: string): { status: 'normal' | 'warning' | 'danger'; color: string } => {
    const range = parseNormalRange(normalRange)

    if (!range) {
      return { status: 'warning', color: '#f59e0b' } // Yellow for unknown ranges
    }

    const { min, max } = range

    // Define warning zones (10% outside normal range)
    const warningMin = min * 0.9
    const warningMax = max * 1.1

    if (value >= min && value <= max) {
      return { status: 'normal', color: '#10b981' } // Green
    } else if (value >= warningMin && value <= warningMax) {
      return { status: 'warning', color: '#f59e0b' } // Yellow
    } else {
      return { status: 'danger', color: '#ef4444' } // Red
    }
  }

  const chartData: ChartDataPoint[] = biomarkers.map((biomarker: BiomarkerData) => {
    const { status, color } = getStatusAndColor(biomarker.predicted_value, biomarker.normal_range)
    const range = parseNormalRange(biomarker.normal_range)

    return {
      name: biomarker.biomarker_name.length > 15
        ? biomarker.biomarker_name.substring(0, 15) + '...'
        : biomarker.biomarker_name,
      fullName: biomarker.biomarker_name,
      value: biomarker.predicted_value,
      unit: biomarker.unit,
      normalMin: range?.min,
      normalMax: range?.max,
      status,
      color
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 dark:text-white">{data.fullName}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Value: <span className="font-medium">{data.value} {data.unit}</span>
          </p>
          {data.normalMin !== undefined && data.normalMax !== undefined && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Normal Range: {data.normalMin} - {data.normalMax} {data.unit}
            </p>
          )}
          <div className="flex items-center mt-2">
            {data.status === 'normal' && <CheckCircle className="h-4 w-4 text-green-500 mr-1" />}
            {data.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />}
            {data.status === 'danger' && <AlertCircle className="h-4 w-4 text-red-500 mr-1" />}
            <span className="text-sm capitalize">{data.status}</span>
          </div>
        </div>
      )
    }
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'danger':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className={`medical-card p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="h-5 w-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Biomarker Analysis Results
        </h3>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Normal Range</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Warning Zone</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Danger Zone</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Normal range reference lines */}
            {chartData.map((item, index) => (
              item.normalMin !== undefined && item.normalMax !== undefined && (
                <ReferenceLine
                  key={`normal-min-${index}`}
                  x={item.normalMin}
                  stroke="#10b981"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                />
              )
            ))}
            {chartData.map((item, index) => (
              item.normalMax !== undefined && (
                <ReferenceLine
                  key={`normal-max-${index}`}
                  x={item.normalMax}
                  stroke="#10b981"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                />
              )
            ))}

            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => (
                <Bar key={`bar-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
            <span className="text-lg font-semibold text-green-700 dark:text-green-300">
              {chartData.filter(d => d.status === 'normal').length}
            </span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400">Normal</p>
        </div>
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-1" />
            <span className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
              {chartData.filter(d => d.status === 'warning').length}
            </span>
          </div>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Warning</p>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <AlertCircle className="h-5 w-5 text-red-500 mr-1" />
            <span className="text-lg font-semibold text-red-700 dark:text-red-300">
              {chartData.filter(d => d.status === 'danger').length}
            </span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">Danger</p>
        </div>
      </div>
    </div>
  )
}
