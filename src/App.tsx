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
  TrendingUp,
  Target,
  Eye,
  Lightbulb,
  Award,
  Building2,
  MapPin
} from 'lucide-react';
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
                <button 
                  onClick={() => setActiveTab('about')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  About
                </button>
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
                onClick={() => setActiveTab('dashboard')}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold transition-all backdrop-blur-sm border border-white/20"
              >
                View Dashboard
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

  if (activeTab === 'about') {
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
                <button 
                  onClick={() => setActiveTab('landing')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Home
                </button>
                <button 
                  onClick={() => setActiveTab('about')}
                  className="text-white border-b-2 border-blue-400 transition-colors"
                >
                  About
                </button>
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

        {/* About Content */}
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600/20 rounded-full mb-6">
                <Target className="w-10 h-10 text-blue-400" />
              </div>
              <h1 className="text-5xl font-bold text-white mb-6">
                About <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">FindEnergyRates.com</span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-green-400 mx-auto rounded-full"></div>
            </div>

            {/* Mission Statement */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/20 mb-12">
              <div className="flex items-start space-x-4 mb-6">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                  <p className="text-lg text-white/90 leading-relaxed mb-6">
                    At FindEnergyRates.com, our mission is to bring <span className="text-blue-400 font-semibold">transparency and clarity</span> to the retail energy market. We continuously track and compare real-time utility rates alongside the latest offers from competitive energy providers—so you don't have to.
                  </p>
                  <p className="text-lg text-white/90 leading-relaxed">
                    Our platform compiles data from both public utility pricing and major comparison sites, giving you a clear view of who's offering the most competitive rates at any given time. Whether you're a <span className="text-green-400 font-semibold">residential customer</span> or a <span className="text-green-400 font-semibold">small business</span>, we help you make informed decisions by putting accurate, up-to-date energy pricing at your fingertips.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Database className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Comprehensive Data</h3>
                </div>
                <p className="text-white/80">
                  We aggregate data from multiple sources including PowerSetter, ChooseEnergy, and ElectricityRates to provide the most complete picture of available energy rates.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Real-Time Updates</h3>
                </div>
                <p className="text-white/80">
                  Our platform continuously monitors rate changes and new offers, ensuring you always have access to the latest pricing information.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Transparent Comparison</h3>
                </div>
                <p className="text-white/80">
                  No hidden fees or biased recommendations. We present all available options clearly, allowing you to make the best decision for your needs.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-orange-600/20 rounded-lg">
                    <Users className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">For Everyone</h3>
                </div>
                <p className="text-white/80">
                  Whether you're a homeowner looking to save on electricity bills or a small business owner managing energy costs, our platform serves all customers.
                </p>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/20 mb-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
                  <Lightbulb className="w-8 h-8 text-yellow-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">Why Choose FindEnergyRates.com?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-4xl font-bold text-blue-400 mb-2">100%</div>
                    <div className="text-white/80">Transparent</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-green-400 mb-2">24/7</div>
                    <div className="text-white/80">Updated</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-purple-400 mb-2">Free</div>
                    <div className="text-white/80">To Use</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage Areas */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/20 mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <MapPin className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Coverage Areas</h2>
              </div>
              <p className="text-lg text-white/90 mb-6">
                We currently provide comprehensive energy rate data for deregulated markets across multiple states, including:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Illinois', 'Ohio', 'Pennsylvania', 'Massachusetts', 'New Jersey'].map((state) => (
                  <div key={state} className="flex items-center space-x-2 text-white/80">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>{state}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-6">Ready to Find Better Energy Rates?</h2>
              <p className="text-xl text-white/80 mb-8">
                Start exploring our comprehensive database of energy rates and find the best deal for your home or business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setActiveTab('results')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>Start Comparing Rates</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold transition-all backdrop-blur-sm border border-white/20"
                >
                  View Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

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
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <button
                  onClick={() => setActiveTab('results')}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Analyze Energy Rates</div>
                      <div className="text-sm text-gray-500">Compare rates across multiple data sources and utilities</div>
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
      </div>
    </div>
  );
}

export default App;