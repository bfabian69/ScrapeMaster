import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Zap, 
  Download, 
  Shield, 
  Play, 
  Pause, 
  Settings, 
  BarChart3, 
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Database,
  Filter,
  Search,
  Star,
  Users,
  Smartphone,
  Monitor,
  TrendingUp
} from 'lucide-react';
import { ScrapedDataViewer } from './components/ScrapedDataViewer';
import { ResultsViewer } from './components/ResultsViewer';
import { DashboardStats } from './components/DashboardStats';

function App() {
  const [activeTab, setActiveTab] = useState('landing');

  // Listen for navigation events from child components
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate', handleNavigate as EventListener);
  }, []);

  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Zap className="w-8 h-8 text-blue-400" />
                <span className="text-xl font-bold text-white">Find Energy Rates</span>
              </div>
              <div className="hidden md:flex space-x-8">
                <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
                <a href="#data" className="text-white/80 hover:text-white transition-colors">Data</a>
                <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
              </div>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all transform hover:scale-105"
              >
                View Data
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <span className="inline-block bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
                ⚡ Multi-Source Energy Rate Database
              </span>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Find Energy
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                  Rates
                </span>
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
                Explore and analyze electricity rate data from multiple sources including PowerSetter, ChooseEnergy, and ElectricityRates. 
                Compare rates across utilities, ZIP codes, and energy plans.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button 
                onClick={() => setActiveTab('results')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Explore Rate Data</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setActiveTab('data')}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold transition-all backdrop-blur-sm border border-white/20"
              >
                View Raw Data
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">Multiple</div>
                <div className="text-white/60">Data Sources</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">Comprehensive</div>
                <div className="text-white/60">Utility Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">Real-time</div>
                <div className="text-white/60">Rate Comparisons</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Multi-Source Energy Data Analysis</h2>
              <p className="text-xl text-white/80">Comprehensive tools for energy rate exploration across multiple platforms</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <BarChart3 className="w-8 h-8" />,
                  title: "Multi-Source Comparison",
                  description: "Compare electricity rates from PowerSetter, ChooseEnergy, and ElectricityRates in one place"
                },
                {
                  icon: <Database className="w-8 h-8" />,
                  title: "Comprehensive Database",
                  description: "Access detailed information including terms, fees, green energy options across all platforms"
                },
                {
                  icon: <Filter className="w-8 h-8" />,
                  title: "Advanced Filtering",
                  description: "Filter by data source, utility, ZIP code, green energy, and more"
                },
                {
                  icon: <Download className="w-8 h-8" />,
                  title: "Data Export",
                  description: "Export filtered data as CSV for further analysis with source identification"
                },
                {
                  icon: <TrendingUp className="w-8 h-8" />,
                  title: "Cross-Platform Analysis",
                  description: "Identify the best rates and savings opportunities across all data sources"
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Reliable Multi-Source Data",
                  description: "Accurate, up-to-date energy rate information from multiple trusted sources"
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all">
                  <div className="text-blue-400 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <Zap className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-semibold text-white">Find Energy Rates</span>
              </div>
              <div className="flex space-x-6 text-white/60">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Support</a>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-white/20 text-center text-white/60">
              <p>&copy; 2024 Find Energy Rates. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Zap className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Find Energy Rates</span>
              </div>
              <nav className="hidden md:flex space-x-6">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('results')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'results' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Rate Analysis
                </button>
                <button 
                  onClick={() => setActiveTab('data')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'data' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Database className="w-4 h-4 inline mr-1" />
                  Raw Data
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveTab('landing')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Monitor className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Energy Rate Database Dashboard</h1>
                  <p className="text-blue-100 text-lg">
                    Comprehensive electricity rate data from multiple sources including PowerSetter, ChooseEnergy, and ElectricityRates
                  </p>
                </div>
                <div className="hidden md:block">
                  <Database className="w-16 h-16 text-blue-200" />
                </div>
              </div>
            </div>

            {/* Dashboard Stats Component */}
            <DashboardStats />

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('results')}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Analyze Rates</div>
                      <div className="text-sm text-gray-500">Compare rates across multiple data sources and utilities</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </button>

                <button
                  onClick={() => setActiveTab('data')}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Database className="w-6 h-6 text-green-600" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Browse Raw Data</div>
                      <div className="text-sm text-gray-500">View and export all energy rate data from all sources</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-8">
            <ResultsViewer />
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-8">
            <ScrapedDataViewer />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;