'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Eye, 
  Brain, 
  Heart, 
  Activity, 
  ArrowRight, 
  Upload,
  Zap,
  Shield,
  Clock
} from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning models for accurate medical image analysis'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Real-time Results',
      description: 'Get instant predictions and confidence scores for quick decision making'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Secure & Compliant**',
      description: 'HIPAA-compliant processing with patient data protection'
    },
    {
      icon: <Upload className="h-8 w-8" />,
      title: 'DICOM Support',
      description: 'Full support for DICOM files with metadata extraction'
    }
  ]

  const conditions = [
    {
      id: 'amd',
      name: 'Age-related Macular Degeneration',
      description: 'AI analysis for OCT and fundus images to detect AMD progression',
      icon: <Eye className="h-12 w-12" />,
      href: '/amd',
      color: 'bg-blue-500',
      models: ['OCT Classifier', 'Fundus Classifier']
    },
    {
      id: 'glaucoma',
      name: 'Glaucoma Detection',
      description: 'Fundus image analysis for early glaucoma detection and monitoring',
      icon: <Brain className="h-12 w-12" />,
      href: '/glaucoma',
      color: 'bg-green-500',
      models: ['Fundus Classifier']
    },
    {
      id: 'dr',
      name: 'Diabetic Retinopathy',
      description: 'Comprehensive diabetic retinopathy screening and severity grading',
      icon: <Heart className="h-12 w-12" />,
      href: '/dr',
      color: 'bg-red-500',
      models: ['DR Grading Model']
    },
    {
      id: 'biomarkers',
      name: 'Biomarker Analysis',
      description: 'Predict 13 different biomarkers from retinal fundus images',
      icon: <Activity className="h-12 w-12" />,
      href: '/biomarkers',
      color: 'bg-purple-500',
      models: ['13 Biomarker Models']
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Medical AI
          <span className="block text-blue-600 dark:text-blue-400">
            Screening Platform
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
          Advanced AI-powered analysis for medical images. Upload your images and get instant, 
          accurate predictions for various eye conditions and biomarkers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/amd" 
            className="medical-button text-lg px-8 py-3 rounded-lg inline-flex items-center space-x-2"
          >
            <span>Get Started</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
          Why Choose Our Platform?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="medical-card p-6 text-center">
              <div className="text-blue-600 dark:text-blue-400 mb-4 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Conditions Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
          Supported Conditions & Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {conditions.map((condition) => (
            <Link key={condition.id} href={condition.href}>
              <div className="medical-card p-8 hover:shadow-xl transition-all duration-200 cursor-pointer group">
                <div className="flex items-start space-x-4">
                  <div className={`${condition.color} p-4 rounded-lg text-white group-hover:scale-110 transition-transform duration-200`}>
                    {condition.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {condition.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {condition.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {condition.models.map((model, idx) => (
                        <span 
                          key={idx}
                          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="mt-16 text-center">
        <div className="medical-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Upload your medical images and experience the power of AI-driven diagnostics
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/amd" 
              className="medical-button px-6 py-3 rounded-md inline-flex items-center space-x-2"
            >
              <Upload className="h-5 w-5" />
              <span>Upload Image</span>
            </Link>
            <Link 
              href="/biomarkers" 
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 px-6 py-3 rounded-md inline-flex items-center space-x-2 transition-colors"
            >
              <Activity className="h-5 w-5" />
              <span>Analyze Biomarkers</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
