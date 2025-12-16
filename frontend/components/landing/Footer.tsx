'use client'

import React from 'react'
import Link from 'next/link'

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Paperboat</h3>
            <p className="text-gray-600 text-sm">AI-powered video storyboarding</p>
          </div>

          <div className="flex gap-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">
              Dashboard
            </Link>
            <Link href="/app" className="text-gray-600 hover:text-gray-900 text-sm">
              Canvas
            </Link>
            <a
              href="https://github.com/paperboat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              GitHub
            </a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Paperboat. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

