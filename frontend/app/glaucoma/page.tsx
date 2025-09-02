'use client'

import React, { useState } from 'react'
import { Eye, Camera } from 'lucide-react'
import { GlaucomaFundusTab } from './fundus'
import { GlaucomaOCTTab } from './oct-tab'

type TabType = 'fundus' | 'oct'

export default function GlaucomaPage() {
  const [activeTab, setActiveTab] = useState<TabType>('oct')

  const tabs = [
    {
      id: 'oct' as const,
      name: 'OCT Analysis',
      icon: Camera,
      description: 'OCT-based glaucoma analysis'
    },
    {
      id: 'fundus' as const,
      name: 'Fundus Analysis',
      icon: Eye,
      description: 'Glaucoma detection from fundus images'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="bg-green-500 p-3 rounded-lg">
            <Eye className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Glaucoma Analysis
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Advanced AI-powered glaucoma detection using fundus images and OCT scans
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="medical-card p-1 mb-8">
        <nav className="flex space-x-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group relative min-w-0 flex-1 overflow-hidden py-4 px-6 text-center text-sm font-medium
                  focus:z-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                  rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-2 border-green-200 dark:border-green-800'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </div>
                <p className={`mt-1 text-xs ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {tab.description}
                </p>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'oct' && <GlaucomaOCTTab />}
        {activeTab === 'fundus' && <GlaucomaFundusTab />}
      </div>
    </div>
  )
}
