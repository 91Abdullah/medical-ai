'use client'

import React, { useState } from 'react'
import { Heart, Eye, Camera } from 'lucide-react'
import { DrFundusTab } from './fundus'
import { DrOctTab } from './oct'

type TabType = 'fundus' | 'oct'

export default function DrPage() {
  const [activeTab, setActiveTab] = useState<TabType>('fundus')

  const tabs = [
    {
      id: 'fundus' as const,
      name: 'Fundus Analysis',
      icon: Eye,
      description: 'DR severity grading from fundus images'
    },
    {
      id: 'oct' as const,
      name: 'OCT Analysis',
      icon: Camera,
      description: 'OCT-based DR analysis'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="bg-red-500 p-3 rounded-lg">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Diabetic Retinopathy Analysis
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Advanced AI-powered diabetic retinopathy detection and severity grading
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
                  focus:z-10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-2 border-red-200 dark:border-red-800'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`} />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </div>
                <p className={`mt-1 text-xs ${isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                  {tab.description}
                </p>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'fundus' && <DrFundusTab />}
        {activeTab === 'oct' && <DrOctTab />}
      </div>
    </div>
  )
}
