'use client'

import React from 'react'
import { Heart, Clock, AlertCircle } from 'lucide-react'

export default function DrPage() {
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

      {/* Coming Soon Card */}
      <div className="medical-card p-12 text-center">
        <div className="max-w-2xl mx-auto">
          <Clock className="h-24 w-24 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Coming Soon
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Our Diabetic Retinopathy analysis module is currently under development. 
            This feature will provide comprehensive DR screening and severity grading.
          </p>

          {/* Planned Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Planned Features
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• DR severity grading (0-4 scale)</li>
                <li>• Macular edema detection</li>
                <li>• Microaneurysm identification</li>
                <li>• Hemorrhage analysis</li>
                <li>• Exudate detection</li>
              </ul>
            </div>
            
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Technical Specifications
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Deep learning model architecture</li>
                <li>• Multi-class classification</li>
                <li>• Fundus image analysis</li>
                <li>• Real-time processing</li>
                <li>• DICOM support</li>
              </ul>
            </div>
          </div>

          {/* Alert Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Development Update
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  We are currently training and validating our DR models on large datasets. 
                  This feature will be available in the next release. Thank you for your patience!
                </p>
              </div>
            </div>
          </div>

          {/* Temporary Navigation */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/amd" 
              className="medical-button px-6 py-3 rounded-md inline-flex items-center justify-center space-x-2"
            >
              <span>Try AMD Analysis</span>
            </a>
            <a 
              href="/glaucoma" 
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 px-6 py-3 rounded-md inline-flex items-center justify-center space-x-2 transition-colors"
            >
              <span>Try Glaucoma Analysis</span>
            </a>
            <a 
              href="/biomarkers" 
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 px-6 py-3 rounded-md inline-flex items-center justify-center space-x-2 transition-colors"
            >
              <span>Analyze Biomarkers</span>
            </a>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="medical-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            About Diabetic Retinopathy
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Diabetic retinopathy is a diabetes complication that affects eyes. 
            It's caused by damage to blood vessels of the light-sensitive tissue 
            at the back of the eye (retina).
          </p>
        </div>

        <div className="medical-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Early Detection
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Early detection and treatment can prevent vision loss. Our AI system 
            will help identify DR at early stages when treatment is most effective.
          </p>
        </div>

        <div className="medical-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Get Notified
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            Want to be notified when DR analysis becomes available?
          </p>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
            Join Waitlist →
          </button>
        </div>
      </div>
    </div>
  )
}
