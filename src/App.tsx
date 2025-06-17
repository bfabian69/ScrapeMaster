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
import { PowerSetterConfig } from './components/PowerSetterConfig';
import { ScrapedDataViewer } from './components/ScrapedDataViewer';
import { ResultsViewer } from './components/ResultsViewer';
import { PowerSetterScraper } from './services/powersetterScraper';
import { ScrapingJob, ScrapingConfig } from './types/scraping';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scrapingJobs, setScrapingJobs] = useState<ScrapingJob[]>([
    {
      id: '1',
      url: 'https://powersetter.com',
      status: 'completed',
      progress: 100,
      itemsScraped: 156,
      startTime: '2 hours ago',
      dataType: 'powersetter',
      zipCodes: ['60021', '62634', '01746']
    }
  ]);

  const [newUrl, setNewUrl] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [powersetterScraper, setPowersetterScraper] = useState<PowerSetterScraper | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setScrapingJobs(jobs => 
        jobs.map(job => 
          job.status === 'running' 
            ? { ...job, progress: Math.min(job.progress + Math.random() * 2, 100), itemsScraped: job.itemsScraped + Math.floor(Math.random() * 10) }
            : job
        )
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStartPowersetterScraping = async (config: ScrapingConfig) => {
    const jobId = Date.now().toString();
    const newJob: ScrapingJob = {
      id: jobId,
      url: 'https://powersetter.com',
      status: 'running',
      progress: 0,
      itemsScraped: 0,
      startTime: 'Just now',
      dataType: 'powersetter',
      zipCodes: config.zipCodes
    };

    setScrapingJobs(prev => [...prev, newJob]);

    const scraper = new PowerSetterScraper(config, (progress, itemsScraped) => {
      setScrapingJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, progress, itemsScraped }
          : job
      ));
    });

    setPowersetterScraper(scraper);

    try {
      const results = await scraper.startScraping();
      
      setScrapingJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed', progress: 100 }
          : job
      ));

      console.log('Scraping completed:', results);
    } catch (error) {
      console.error('Scraping failed:', error);
      setScrapingJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'error' }
          : job
      ));
    }
  };

  const handleStartScraping = () => {
    if (newUrl) {
      setIsAnimating(true);
      setTimeout(() => {
        const newJob: ScrapingJob = {
          id: Date.now().toString(),
          url: newUrl,
          status: 'running',
          progress: 0,
          itemsScraped: 0,
          startTime: 'Just now',
          dataType: 'general'
        };
        setScrapingJobs([...scrapingJobs, newJob]);
        setNewUrl('');
        setIsAnimating(false);
      }, 1000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Globe className="w-8 h-8 text-blue-400" />
                <span className="text-xl font-bold text-white">ScrapeMaster</span>
              </div>
              <div className="hidden md:flex space-x-8">
                <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="text-white/80 hover:text-white transition-colors">Pricing</a>
                <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
              </div>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all transform hover:scale-105"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <span className="inline-block bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
                🚀 Now with PowerSetter.com integration
              </span>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Energy Data
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                  Scraping Platform
                </span>
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
                Extract electricity rate data from PowerSetter.com and other energy comparison sites. 
                Built for energy professionals and data analysts.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Start Scraping Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setActiveTab('results')}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold transition-all backdrop-blur-sm border border-white/20"
              >
                View Demo Data
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">18</div>
                <div className="text-white/60">ZIP Codes Supported</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">5K+</div>
                <div className="text-white/60">Energy Plans Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">99.9%</div>
                <div className="text-white/60">Data Accuracy</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Specialized for Energy Data</h2>
              <p className="text-xl text-white/80">Built specifically for electricity rate comparison sites</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="w-8 h-8" />,
                  title: "PowerSetter Integration",
                  description: "Native support for PowerSetter.com with all 18 supported ZIP codes and utilities"
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Anti-Detection",
                  description: "Advanced techniques to bypass bot detection while respecting rate limits"
                },
                {
                  icon: <Database className="w-8 h-8" />,
                  title: "Supabase Storage",
                  description: "Automatic data storage in Supabase with real-time access and querying"
                },
                {
                  icon: <Download className="w-8 h-8" />,
                  title: "CSV Export",
                  description: "Export scraped energy data as CSV for analysis in Excel or other tools"
                },
                {
                  icon: <BarChart3 className="w-8 h-8" />,
                  title: "Real-time Monitoring",
                  description: "Track scraping progress and data quality in real-time dashboard"
                },
                {
                  icon: <Settings className="w-8 h-8" />,
                  title: "Configurable Settings",
                  description: "Adjust delays, retry limits, and ZIP code selection for optimal performance"
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
                <Globe className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-semibold text-white">ScrapeMaster</span>
              </div>
              <div className="flex space-x-6 text-white/60">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Support</a>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-white/20 text-center text-white/60">
              <p>&copy; 2024 ScrapeMaster. All rights reserved.</p>
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
                <Globe className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">ScrapeMaster</span>
              </div>
              <nav className="hidden md:flex space-x-6">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('powersetter')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'powersetter' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  PowerSetter
                </button>
                <button 
                  onClick={() => setActiveTab('results')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'results' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Results
                </button>
                <button 
                  onClick={() => setActiveTab('data')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'data' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Scraped Data
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Settings
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: "Active Jobs", value: scrapingJobs.filter(j => j.status === 'running').length.toString(), icon: <Play className="w-6 h-6" />, color: "blue" },
                { title: "Total Scraped", value: scrapingJobs.reduce((sum, job) => sum + job.itemsScraped, 0).toString(), icon: <Database className="w-6 h-6" />, color: "green" },
                { title: "Success Rate", value: "98.7%", icon: <CheckCircle className="w-6 h-6" />, color: "emerald" },
                { title: "ZIP Codes", value: "18", icon: <Zap className="w-6 h-6" />, color: "orange" }
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* New Scraping Job */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Zap className="w-6 h-6 text-blue-600 mr-2" />
                Start New Scraping Job
              </h2>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Enter website URL to scrape..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Globe className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                </div>
                <button
                  onClick={handleStartScraping}
                  disabled={!newUrl || isAnimating}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isAnimating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  <span>Start Scraping</span>
                </button>
              </div>
            </div>

            {/* Active Jobs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <BarChart3 className="w-6 h-6 text-green-600 mr-2" />
                  Scraping Jobs
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {scrapingJobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`${getStatusColor(job.status)}`}>
                          {getStatusIcon(job.status)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{job.url}</p>
                          <p className="text-sm text-gray-500">
                            Started {job.startTime}
                            {job.zipCodes && ` • ${job.zipCodes.length} ZIP codes`}
                            {job.dataType && ` • ${job.dataType}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{job.itemsScraped} items</p>
                          <p className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Settings className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">{job.progress}% complete</span>
                      <span className="text-sm font-medium text-gray-700">{job.progress === 100 ? 'Completed' : 'In Progress'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'powersetter' && (
          <div className="space-y-8">
            <PowerSetterConfig 
              onStartScraping={handleStartPowersetterScraping}
              isRunning={scrapingJobs.some(job => job.status === 'running' && job.dataType === 'powersetter')}
            />
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

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Settings className="w-6 h-6 text-gray-600 mr-2" />
                Settings
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Export Format
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>CSV</option>
                      <option>JSON</option>
                      <option>Excel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Concurrent Jobs Limit
                    </label>
                    <input type="number" defaultValue="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Delay Between Requests (ms)
                    </label>
                    <input type="number" defaultValue="5000" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="notifications" className="rounded" />
                    <label htmlFor="notifications" className="text-sm font-medium text-gray-700">
                      Email notifications for completed jobs
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;