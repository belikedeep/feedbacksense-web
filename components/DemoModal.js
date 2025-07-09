'use client'

import { useState } from 'react'
import { XMarkIcon, PlayIcon } from '@heroicons/react/24/outline'

export default function DemoModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
          {/* Close Button */}
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                FeedbackSense Demo
              </h3>
              
              {/* Demo Video Placeholder */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <PlayIcon className="h-16 w-16 mx-auto mb-4 opacity-75" />
                    <h4 className="text-xl font-semibold mb-2">Interactive Demo</h4>
                    <p className="text-gray-300 mb-6">See how FeedbackSense transforms customer feedback into actionable insights</p>
                    
                    {/* Demo Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                      <div className="bg-black bg-opacity-50 p-4 rounded-lg">
                        <h5 className="font-semibold mb-2">🤖 AI Analysis</h5>
                        <p className="text-sm text-gray-300">Watch real-time sentiment analysis on customer feedback</p>
                      </div>
                      <div className="bg-black bg-opacity-50 p-4 rounded-lg">
                        <h5 className="font-semibold mb-2">📊 Visual Insights</h5>
                        <p className="text-sm text-gray-300">See beautiful charts that reveal hidden patterns</p>
                      </div>
                      <div className="bg-black bg-opacity-50 p-4 rounded-lg">
                        <h5 className="font-semibold mb-2">📁 CSV Import</h5>
                        <p className="text-sm text-gray-300">Upload thousands of reviews in seconds</p>
                      </div>
                      <div className="bg-black bg-opacity-50 p-4 rounded-lg">
                        <h5 className="font-semibold mb-2">📈 Trend Tracking</h5>
                        <p className="text-sm text-gray-300">Monitor satisfaction improvements over time</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="mt-6 text-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 font-medium">Ready to try it yourself?</p>
                  <p className="text-blue-600 text-sm">Start your free trial and see FeedbackSense in action with your own data</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="/signup"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Start Free Trial
                  </a>
                  <button
                    onClick={onClose}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Close Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}