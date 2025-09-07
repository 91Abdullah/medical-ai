'use client'

import React, { useEffect } from 'react'

interface SeverityChartProps {
    prediction: {
        prediction: string
        confidence: number
        classes?: string[]
        class_probabilities?: Record<string, number>
        threshold?: number
        risk_category?: string
        risk_color?: string
        threshold_explanation?: string
        clinical_note?: string
    }
    className?: string
}

export function SeverityChart({ prediction, className = '' }: SeverityChartProps) {

    console.log(prediction)

    // --- color rules to match screenshot ---
    const colorFor = (label: string, idx: number) => {
        const l = label.toLowerCase()
        if (/(no|normal)/.test(l)) return '#22c55e' // green
        if (/(low|mild)/.test(l)) return '#eab308' // yellow
        if (/(medium|moderate)/.test(l)) return '#f97316' // orange
        if (/(high|severe|dr|present|suspected|glaucoma)/.test(l)) return '#ef4444' // red
        // fallback palette
        const fallback = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#06b6d4', '#8b5cf6']
        return fallback[idx % fallback.length]
    }

    // Build classes + probs (supports your demo mode too)
    let classes = prediction.classes ?? []
    let probs = prediction.class_probabilities ?? {}

    // Prepare rows (sort by probability desc like the mock emphasizes largest bar)
    const rows = classes
        .map((label, i) => ({
            label,
            pct: (probs[label] ?? 0) * 100,
            color: colorFor(label, i),
            isPredicted:
                label.toLowerCase().includes(prediction.prediction.toLowerCase()) ||
                prediction.prediction.toLowerCase().includes(label.toLowerCase()),
        }))
        .sort((a, b) => b.pct - a.pct)

    return (
        <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 ${className}`}>
            {/* Header with Risk Category */}
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Analysis Results
                    </h3>
                    {prediction.risk_category && (
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            prediction.risk_color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                            prediction.risk_color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                            {prediction.risk_category}
                        </div>
                    )}
                </div>
                
                {/* Threshold Information */}
                {prediction.threshold && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2">
                            <div className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                                Detection Threshold: {prediction.threshold}
                            </div>
                        </div>
                        {prediction.threshold_explanation && (
                            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                                {prediction.threshold_explanation}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {rows.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                        {/* Left label - muted gray color */}
                        <div className="text-sm font-normal whitespace-nowrap flex-shrink-0 w-32">
                            {r.label}:
                        </div>

                        {/* Bar container with dark background */}
                        <div className="h-3 rounded-xs bg-gray-600/50 relative overflow-hidden flex-1 min-w-0">
                            <div
                                className="h-full rounded-xs transition-all duration-300"
                                style={{
                                    width: `${Math.max(0, Math.min(100, r.pct)).toFixed(2)}%`,
                                    backgroundColor: r.color,
                                }}
                                aria-label={`${r.label} ${r.pct.toFixed(2)} percent`}
                            />
                            
                            {/* Threshold indicator line */}
                            {prediction.threshold && r.label.toLowerCase().includes('glaucoma') && (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-white border-l-2 border-dashed border-white"
                                    style={{ left: `${prediction.threshold * 100}%` }}
                                    title={`Threshold: ${prediction.threshold}`}
                                />
                            )}
                        </div>

                        {/* Right percentage - colored */}
                        <div
                            className="text-sm font-semibold tabular-nums whitespace-nowrap flex-shrink-0 min-w-[50px] text-right"
                            style={{ color: r.color }}
                        >
                            {r.pct.toFixed(2)}%
                        </div>
                    </div>
                ))}
            </div>

            {/* Clinical Note */}
            {prediction.clinical_note && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        <strong>Clinical Note:</strong> {prediction.clinical_note}
                    </p>
                </div>
            )}
        </div>
    )
}
