'use client';

import { useEffect, useState } from 'react';

export default function MobileDetect({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-auto mb-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mobile Support Coming Soon</h1>
            <p className="text-gray-600 mb-6">
              ArchScope is currently optimized for desktop experience. Mobile support is under development.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Why Desktop Recommended?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>· Complex architecture diagrams need larger screens</li>
                <li>· Drag-and-drop works best with mouse/trackpad</li>
                <li>· Multi-selection features require precision</li>
                <li>· Advanced keyboard shortcuts need full keyboard</li>
              </ul>
            </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              For the best experience, please open ArchScope on a desktop or laptop computer.
            </p>
            <div className="flex justify-center">
              <a 
                href="/guide" 
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                View Guide
              </a>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-400">
            <p>ArchScope v1.0 - Architecture Simulation Platform</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
