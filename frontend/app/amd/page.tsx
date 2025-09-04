'use client'

import React, { useState } from 'react'
import { Eye, FileImage } from 'lucide-react'
import { AmdOctTab } from './oct-tab'
import { AmdFundusTab } from './fundus-tab'

type ImageType = 'oct' | 'fundus'

export default function AmdPage() {
  const [activeTab, setActiveTab] = useState<ImageType>('oct')

  const tabs = [
    {
      id: 'oct' as const,
      name: 'OCT Analysis',
      icon: Eye,
      description: 'OCT-based AMD analysis'
    },
    {
      id: 'fundus' as const,
      name: 'Fundus Analysis',
      icon: FileImage,
      description: 'AMD detection from fundus images'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="bg-blue-500 p-3 rounded-lg">
            <Eye className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AMD Analysis
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Advanced AI-powered analysis for Age-related Macular Degeneration detection and classification
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
                  focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </div>
                <p className={`mt-1 text-xs ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                  {tab.description}
                </p>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'oct' && <AmdOctTab />}
        {activeTab === 'fundus' && <AmdFundusTab />}
      </div>
    </div>
  )
}
