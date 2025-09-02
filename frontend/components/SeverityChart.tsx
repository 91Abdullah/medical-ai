'use client'

import React, { useEffect } from 'react'

interface SeverityChartProps {
    prediction: {
        prediction: string
        confidence: number
        classes?: string[]
        class_probabilities?: Record<string, number> // e.g. {'No Pathology Detected': 0.1525, ...}
    }
    className?: string
}

export function SeverityChart({ prediction, className = '' }: SeverityChartProps) {

    console.log(prediction)

    // --- color rules to match screenshot ---
    const colorFor = (label: string, idx: number) => {
        const l = label.toLowerCase()
        if (/(no|normal)/.test(l)) return '#22c55e' // green
        if (/(low|mild|suspected)/.test(l)) return '#eab308' // yellow
        if (/(medium|moderate)/.test(l)) return '#f97316' // orange
        if (/(high|severe|dr|present)/.test(l)) return '#ef4444' // red
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
        </div>
    )
}
