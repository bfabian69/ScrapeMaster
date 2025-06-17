import React, { useState } from 'react';
import { Settings, Play, Database, Zap, Clock, Shield } from 'lucide-react';
import { defaultUtilities } from '../services/powersetterScraper';
import { ScrapingConfig } from '../types/scraping';

interface PowerSetterConfigProps {
  onStartScraping: (config: ScrapingConfig) => void;
  isRunning: boolean;
}

export const PowerSetterConfig: React.FC<PowerSetterConfigProps> = ({ onStartScraping, isRunning }) => {
  const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>(Object.keys(defaultUtilities).slice(0, 5));
  const [delayBetweenRequests, setDelayBetweenRequests] = useState(5000);
  const [maxRetries, setMaxRetries] = useState(3);
  const [headless, setHeadless] = useState(true);

  const handleZipCodeToggle = (zipCode: string) => {
    setSelectedZipCodes(prev => 
      prev.includes(zipCode) 
        ? prev.filter(z => z !== zipCode)
        : [...prev, zipCode]
    );
  };

  const handleSelectAll = () => {
    setSelectedZipCodes(Object.keys(defaultUtilities));
  };

  const handleSelectNone = () => {
    setSelectedZipCodes([]);
  };

  const handleStartScraping = () => {
    const config: ScrapingConfig = {
      zipCodes: selectedZipCodes,
      delayBetweenRequests,
      maxRetries,
      headless
    };
    onStartScraping(config);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Zap className="w-6 h-6 text-blue-600 mr-2" />
          PowerSetter.com Configuration
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Database className="w-4 h-4" />
          <span>Data stored in Supabase</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ZIP Code Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">ZIP Codes to Scrape</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleSelectNone}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(defaultUtilities).map(([zipCode, utility]) => (
                <label key={zipCode} className="flex items-center space-x-2 cursor-pointer hover:bg-white rounded p-2 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedZipCodes.includes(zipCode)}
                    onChange={() => handleZipCodeToggle(zipCode)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{zipCode}</div>
                    <div className="text-xs text-gray-500 truncate">{utility}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Selected: {selectedZipCodes.length} of {Object.keys(defaultUtilities).length} ZIP codes
          </div>
        </div>

        {/* Scraping Settings */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Scraping Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Delay Between Requests (ms)
              </label>
              <input
                type="number"
                value={delayBetweenRequests}
                onChange={(e) => setDelayBetweenRequests(Number(e.target.value))}
                min="1000"
                max="30000"
                step="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 5000ms to avoid rate limiting</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Retries per ZIP Code
              </label>
              <select
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 retry</option>
                <option value={2}>2 retries</option>
                <option value={3}>3 retries</option>
                <option value={5}>5 retries</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="headless"
                checked={headless}
                onChange={(e) => setHeadless(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="headless" className="text-sm font-medium text-gray-700 flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Run in headless mode (recommended)
              </label>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Estimated Time</h4>
            <p className="text-sm text-blue-700">
              ~{Math.ceil((selectedZipCodes.length * delayBetweenRequests) / 60000)} minutes for {selectedZipCodes.length} ZIP codes
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleStartScraping}
          disabled={selectedZipCodes.length === 0 || isRunning}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isRunning ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Play className="w-5 h-5" />
          )}
          <span>{isRunning ? 'Scraping...' : 'Start PowerSetter Scraping'}</span>
        </button>
      </div>
    </div>
  );
};