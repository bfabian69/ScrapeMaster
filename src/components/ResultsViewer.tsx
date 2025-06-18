import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Filter, 
  Search, 
  ExternalLink, 
  Zap, 
  DollarSign, 
  Calendar, 
  Leaf,
  RefreshCw,
  TrendingDown,
  Award,
  Clock,
  MapPin,
  Building2,
  AlertTriangle,
  Play,
  CheckCircle,
  Shield,
  XCircle,
  Image
} from 'lucide-react';
import { PowerSetterData } from '../types/scraping';
import { getPowerSetterData, getUtilities, getPTCData, testConnection, insertPowerSetterData, checkDatabasePermissions } from '../services/supabase';

interface GroupedRates {
  [utility: string]: {
    [date: string]: PowerSetterData[];
  };
}

interface PTCData {
  [utility: string]: number;
}

export const ResultsViewer: React.FC = () => {
  const [data, setData] = useState<PowerSetterData[]>([]);
  const [groupedRates, setGroupedRates] = useState<GroupedRates>({});
  const [utilities, setUtilities] = useState<string[]>([]);
  const [ptcData, setPtcData] = useState<PTCData>({});
  const [loading, setLoading] = useState(false);
  const [utilitiesLoading, setUtilitiesLoading] = useState(true);
  const [selectedUtility, setSelectedUtility] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isPopulating, setIsPopulating] = useState(false);
  const [permissions, setPermissions] = useState<any>(null);
  const [isRLSIssue, setIsRLSIssue] = useState(false);

  useEffect(() => {
    console.log('=== ResultsViewer Component Mounted ===');
    initializeData();
  }, []);

  useEffect(() => {
    if (selectedUtility) {
      console.log('Selected utility changed to:', selectedUtility);
      loadRatesData();
    } else {
      setGroupedRates({});
    }
  }, [selectedUtility]);

  const initializeData = async () => {
    console.log('=== Initializing ResultsViewer Data ===');
    setDebugInfo('Starting initialization...');
    setIsRLSIssue(false);
    
    try {
      // Step 1: Test connection
      setDebugInfo('Testing database connection...');
      await checkConnection();
      
      // Step 2: Check permissions
      setDebugInfo('Checking database permissions...');
      await checkPermissions();
      
      // Step 3: Load utilities
      setDebugInfo('Loading utilities from powersetter table...');
      await loadUtilities();
      
      // Step 4: Load PTC data
      setDebugInfo('Loading PTC data...');
      await loadPTCData();
      
      setDebugInfo('Initialization complete');
    } catch (error) {
      console.error('Initialization failed:', error);
      setDebugInfo(`Initialization failed: ${error.message}`);
    }
  };

  const checkConnection = async () => {
    try {
      console.log('=== Testing Database Connection ===');
      setConnectionStatus('checking');
      
      const result = await testConnection();
      console.log('Connection test result:', result);
      
      if (result.success) {
        console.log('✅ Database connection successful');
        setConnectionStatus('connected');
        setDebugInfo(`Connected successfully. Found ${result.recordCount || 0} records in powersetter table.`);
      } else {
        console.error('❌ Database connection failed:', result.error);
        setConnectionStatus('error');
        setDebugInfo(`Connection failed: ${result.error}`);
        
        if (result.isRLSIssue) {
          setIsRLSIssue(true);
        }
      }
    } catch (error) {
      console.error('❌ Connection test threw error:', error);
      setConnectionStatus('error');
      setDebugInfo(`Connection error: ${error.message}`);
    }
  };

  const checkPermissions = async () => {
    try {
      console.log('=== Checking Database Permissions ===');
      const perms = await checkDatabasePermissions();
      setPermissions(perms);
      
      if (perms) {
        console.log('Permissions check result:', perms);
        if (!perms.insert) {
          setDebugInfo('Warning: No INSERT permission detected. Sample data insertion may fail.');
        }
      }
    } catch (error) {
      console.error('Permission check failed:', error);
    }
  };

  const loadUtilities = async () => {
    try {
      console.log('=== Loading Utilities from PowerSetter Table ===');
      setUtilitiesLoading(true);
      
      const utilitiesList = await getUtilities();
      console.log('✅ Utilities loaded successfully:', utilitiesList);
      
      setUtilities(utilitiesList);
      
      if (utilitiesList.length === 0) {
        console.warn('⚠️ No utilities found in powersetter table');
        setDebugInfo('No utilities found in powersetter table. The table may be empty or have no utility data.');
        
        // Get sample data for debugging
        try {
          const sampleData = await getPowerSetterData();
          console.log('Sample data for debugging:', sampleData.slice(0, 3));
          
          if (sampleData.length > 0) {
            const utilitiesInData = [...new Set(sampleData.map(d => d.utility).filter(u => u))];
            console.log('Utilities found in sample data:', utilitiesInData);
            setDebugInfo(`Found ${sampleData.length} total records, but utilities extraction failed. Sample utilities: ${utilitiesInData.join(', ')}`);
          } else {
            setDebugInfo('No data found in powersetter table. Please add some data first.');
          }
        } catch (sampleError) {
          console.error('Failed to get sample data:', sampleError);
          setDebugInfo(`Failed to get sample data: ${sampleError.message}`);
          
          if (sampleError.message.includes('Row Level Security')) {
            setIsRLSIssue(true);
          }
        }
      } else {
        setDebugInfo(`Successfully loaded ${utilitiesList.length} utilities from powersetter table: ${utilitiesList.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error loading utilities:', error);
      setUtilities([]);
      setConnectionStatus('error');
      setDebugInfo(`Failed to load utilities: ${error.message}`);
      
      if (error.message.includes('Row Level Security')) {
        setIsRLSIssue(true);
      }
    } finally {
      setUtilitiesLoading(false);
    }
  };

  const loadPTCData = async () => {
    try {
      console.log('=== Loading PTC Data ===');
      const ptc = await getPTCData();
      console.log('✅ PTC data loaded:', ptc);
      setPtcData(ptc);
    } catch (error) {
      console.error('❌ Error loading PTC data:', error);
      setPtcData({});
    }
  };

  const loadRatesData = async () => {
    if (!selectedUtility) return;
    
    try {
      console.log('=== Loading Rates Data ===');
      console.log('Loading rates data for utility:', selectedUtility);
      setLoading(true);
      const ratesData = await getPowerSetterData();
      
      // Filter by utility
      const filteredData = ratesData.filter(rate => rate.utility === selectedUtility);
      console.log('Filtered data for', selectedUtility, ':', filteredData.length, 'records');
      setData(filteredData);
      
      // Group by utility and date (matching Flask app logic)
      const grouped: GroupedRates = {};
      
      filteredData.forEach(rate => {
        const utility = rate.utility;
        const scrapedDate = new Date(rate.scraped_at);
        const formattedDate = scrapedDate.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
        
        if (!grouped[utility]) {
          grouped[utility] = {};
        }
        
        if (!grouped[utility][formattedDate]) {
          grouped[utility][formattedDate] = [];
        }
        
        grouped[utility][formattedDate].push(rate);
      });
      
      // Sort dates (most recent first) and limit to 5 dates per utility
      Object.keys(grouped).forEach(utility => {
        const sortedDates = Object.keys(grouped[utility])
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          .slice(0, 5);
        
        const limitedDates: { [date: string]: PowerSetterData[] } = {};
        sortedDates.forEach(date => {
          // Sort rates by price within each date
          limitedDates[date] = grouped[utility][date].sort((a, b) => 
            (a.price_per_kwh || 0) - (b.price_per_kwh || 0)
          );
        });
        
        grouped[utility] = limitedDates;
      });
      
      console.log('Grouped rates:', grouped);
      setGroupedRates(grouped);
    } catch (error) {
      console.error('Error loading rates data:', error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const populateWithSampleData = async () => {
    try {
      setIsPopulating(true);
      console.log('=== Populating with sample data ===');
      
      // Check permissions first
      if (permissions && !permissions.insert) {
        throw new Error('No INSERT permission. Please check your database RLS policies.');
      }
      
      // Sample data with realistic supplier logos (as they would be extracted from div.col-logo)
      const sampleData: PowerSetterData[] = [
        {
          zip_code: "60021",
          price_per_kwh: 9.85,
          savings: "Save 15%",
          terms: "12 months",
          info: "Fixed rate plan",
          green: "100% Green",
          supplier_logo_url: "https://www.powersetter.com/images/suppliers/constellation-logo.png",
          signup_url: "https://example.com/signup/1",
          utility: "ComEd",
          fee: "$25 enrollment fee",
          scraped_at: new Date().toISOString()
        },
        {
          zip_code: "60021",
          price_per_kwh: 10.25,
          savings: "Save 10%",
          terms: "24 months",
          info: "Variable rate plan",
          green: "N",
          supplier_logo_url: "https://www.powersetter.com/images/suppliers/direct-energy-logo.png",
          signup_url: "https://example.com/signup/2",
          utility: "ComEd",
          fee: "",
          scraped_at: new Date().toISOString()
        },
        {
          zip_code: "62634",
          price_per_kwh: 8.95,
          savings: "Save 20%",
          terms: "18 months",
          info: "Introductory rate",
          green: "50% Green",
          supplier_logo_url: "https://www.powersetter.com/images/suppliers/green-mountain-logo.png",
          signup_url: "https://example.com/signup/3",
          utility: "Ameren",
          fee: "$15 monthly fee",
          scraped_at: new Date().toISOString()
        },
        {
          zip_code: "01746",
          price_per_kwh: 11.45,
          savings: "Save 8%",
          terms: "12 months",
          info: "Standard rate",
          green: "100% Green",
          supplier_logo_url: "https://www.powersetter.com/images/suppliers/nrg-logo.png",
          signup_url: "https://example.com/signup/4",
          utility: "Eversource - NSTAR",
          fee: "",
          scraped_at: new Date().toISOString()
        },
        {
          zip_code: "44052",
          price_per_kwh: 9.75,
          savings: "Save 12%",
          terms: "36 months",
          info: "Long-term fixed rate",
          green: "N",
          supplier_logo_url: "https://www.powersetter.com/images/suppliers/reliant-logo.png",
          signup_url: "https://example.com/signup/5",
          utility: "Ohio Edison",
          fee: "$10 connection fee",
          scraped_at: new Date().toISOString()
        }
      ];

      console.log('Inserting sample data:', sampleData);
      await insertPowerSetterData(sampleData);
      console.log('✅ Sample data inserted successfully');
      
      // Wait a moment for the database to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force refresh all data
      console.log('🔄 Refreshing all data after sample insertion...');
      setDebugInfo('Sample data added successfully. Refreshing utilities dropdown...');
      
      // Reset states
      setUtilities([]);
      setSelectedUtility('');
      setGroupedRates({});
      setIsRLSIssue(false);
      
      // Reload everything
      await checkConnection();
      await loadUtilities();
      await loadPTCData();
      
      setDebugInfo(`Successfully added ${sampleData.length} sample records and refreshed utilities dropdown.`);
    } catch (error) {
      console.error('❌ Error populating sample data:', error);
      setDebugInfo(`Failed to populate sample data: ${error.message}`);
      
      if (error.message.includes('Row Level Security')) {
        setIsRLSIssue(true);
      }
    } finally {
      setIsPopulating(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'ZIP Code', 'Utility', 'Price (¢/kWh)', 'Terms', 'Fee', 'Green', 'Savings'];
    const csvContent = [
      headers.join(','),
      ...Object.entries(groupedRates).flatMap(([utility, dates]) =>
        Object.entries(dates).flatMap(([date, rates]) =>
          rates.map(rate => [
            date,
            rate.zip_code,
            `"${rate.utility}"`,
            rate.price_per_kwh,
            `"${rate.terms}"`,
            `"${rate.fee || 'No fee'}"`,
            `"${rate.green}"`,
            `"${rate.savings || 'N/A'}"`
          ].join(','))
        )
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `energy_rates_${selectedUtility.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getBestRate = (rates: PowerSetterData[]) => {
    return rates.reduce((best, current) => 
      (current.price_per_kwh || Infinity) < (best.price_per_kwh || Infinity) ? current : best
    );
  };

  const calculateSavings = (rate: PowerSetterData, ptcPrice: number) => {
    if (!rate.price_per_kwh || !ptcPrice) return null;
    const savings = ((ptcPrice - rate.price_per_kwh) / ptcPrice) * 100;
    return savings > 0 ? savings.toFixed(1) : null;
  };

  // Component for supplier logo with fallback
  const SupplierLogo: React.FC<{ logoUrl: string; supplierName?: string; className?: string }> = ({ 
    logoUrl, 
    supplierName = "Supplier", 
    className = "h-8 w-auto max-w-20 object-contain" 
  }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleImageError = () => {
      setImageError(true);
      setImageLoaded(false);
    };

    const handleImageLoad = () => {
      setImageLoaded(true);
      setImageError(false);
    };

    if (!logoUrl || imageError) {
      return (
        <div className={`${className} bg-gray-100 border border-gray-200 rounded flex items-center justify-center`}>
          <div className="flex flex-col items-center justify-center p-2">
            <Image className="w-4 h-4 text-gray-400 mb-1" />
            <span className="text-xs text-gray-500 text-center leading-tight">
              {supplierName.length > 10 ? supplierName.substring(0, 10) + '...' : supplierName}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <img 
          src={logoUrl}
          alt={`${supplierName} Logo`}
          className={className}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
        {!imageLoaded && !imageError && (
          <div className={`${className} bg-gray-100 border border-gray-200 rounded flex items-center justify-center animate-pulse`}>
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
          </div>
        )}
      </div>
    );
  };

  if (utilitiesLoading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-600">Loading utilities from powersetter table...</span>
        </div>
        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
            Debug: {debugInfo}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Zap className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Energy Rate Analysis</h1>
              <p className="text-blue-100">Compare electricity rates from PowerSetter database</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {connectionStatus === 'checking' && (
              <div className="flex items-center text-yellow-200">
                <div className="w-2 h-2 bg-yellow-300 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm">Checking...</span>
              </div>
            )}
            {connectionStatus === 'connected' && (
              <div className="flex items-center text-green-200">
                <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
                <span className="text-sm">Connected to Database</span>
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center text-red-200">
                <div className="w-2 h-2 bg-red-300 rounded-full mr-2"></div>
                <span className="text-sm">Connection Error</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">
              <Building2 className="w-4 h-4 inline mr-1" />
              Select Utility Company
            </label>
            <select
              value={selectedUtility}
              onChange={(e) => setSelectedUtility(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:border-transparent backdrop-blur-sm"
            >
              <option value="" className="text-gray-900">-- Select a Utility --</option>
              {utilities.map(utility => (
                <option key={utility} value={utility} className="text-gray-900">
                  {utility}
                </option>
              ))}
            </select>
            {utilities.length === 0 && connectionStatus === 'connected' && (
              <p className="text-xs text-red-200 mt-1">No utilities found in powersetter table</p>
            )}
            {utilities.length > 0 && (
              <p className="text-xs text-blue-200 mt-1">{utilities.length} utilities available in database</p>
            )}
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => { 
                console.log('🔄 Refresh button clicked');
                initializeData();
                if (selectedUtility) loadRatesData(); 
              }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center space-x-2 backdrop-blur-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            {Object.keys(groupedRates).length > 0 && (
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RLS Issue Alert */}
      {isRLSIssue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <Shield className="w-6 h-6 text-red-600 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">Database Permission Issue</h3>
              <p className="text-sm text-red-700 mb-4">
                Row Level Security (RLS) policies are preventing access to the powersetter table. Even though you have data in your database, 
                the current policies don't allow the anonymous user to read it.
              </p>
              
              <div className="bg-red-100 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-800 mb-2">To fix this issue:</h4>
                <ol className="list-decimal list-inside text-sm text-red-700 space-y-1">
                  <li>Go to your Supabase dashboard</li>
                  <li>Navigate to the SQL Editor</li>
                  <li>Run the migration script to fix the RLS policies</li>
                  <li>Come back and refresh this page</li>
                </ol>
              </div>
              
              <div className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                Error: {debugInfo}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Error Alert */}
      {connectionStatus === 'error' && !isRLSIssue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 text-red-600 mr-2">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Database Connection Error</h3>
              <p className="text-sm text-red-700 mt-1">
                Unable to connect to the powersetter table. Please check your configuration and try again.
              </p>
              {debugInfo && (
                <p className="text-xs text-red-600 mt-2 font-mono">{debugInfo}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty Database Alert with Sample Data Option */}
      {connectionStatus === 'connected' && utilities.length === 0 && !isPopulating && !isRLSIssue && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">No Data Found in PowerSetter Table</h3>
              <p className="text-sm text-yellow-700 mb-4">
                Your database is connected but the powersetter table is empty. You can add sample data to test the interface:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-800">Add Sample Energy Rate Data</h4>
                    <p className="text-sm text-yellow-600">
                      Add 5 sample energy rate records with realistic supplier logos to test the interface
                    </p>
                  </div>
                  <button
                    onClick={populateWithSampleData}
                    disabled={isPopulating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isPopulating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Database className="w-4 h-4" />
                    )}
                    <span>{isPopulating ? 'Adding...' : 'Add Sample Data'}</span>
                  </button>
                </div>
              </div>
              
              {debugInfo && (
                <div className="mt-4 p-3 bg-yellow-100 rounded text-xs text-yellow-700 font-mono">
                  Debug: {debugInfo}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State for Sample Data Population */}
      {isPopulating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Adding Sample Data</h3>
              <p className="text-sm text-blue-700 mt-1">
                Inserting 5 sample energy rate records and refreshing the utilities dropdown...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Content */}
      {!selectedUtility ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Utility to View Rates</h3>
          <p className="text-gray-600">Choose a utility company from the dropdown above to compare energy rates and find the best deals.</p>
          {utilities.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {utilities.length} utilities available: {utilities.slice(0, 3).join(', ')}{utilities.length > 3 ? '...' : ''}
            </p>
          )}
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-gray-600">Loading energy rates for {selectedUtility}...</span>
          </div>
        </div>
      ) : Object.keys(groupedRates).length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
          <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">No energy rate data found for {selectedUtility} in the powersetter table.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {Object.entries(groupedRates).map(([utility, dates]) => (
            <div key={utility} className="border-b border-gray-200 last:border-b-0">
              {/* Utility Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{utility}</h2>
                      <div className="flex items-center space-x-4 mt-1">
                        {ptcData[utility] && (
                          <div className="flex items-center text-sm text-gray-600">
                            <TrendingDown className="w-4 h-4 mr-1" />
                            <span>PTC: {ptcData[utility].toFixed(2)}¢/kWh</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{Object.keys(dates).length} recent updates</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {ptcData[utility] && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Price to Compare</div>
                      <div className="text-lg font-bold text-gray-900">{ptcData[utility].toFixed(2)}¢</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rates by Date */}
              {Object.entries(dates).map(([date, rates]) => {
                const bestRate = getBestRate(rates);
                return (
                  <div key={date} className="border-b border-gray-100 last:border-b-0">
                    {/* Date Header */}
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-900">{date}</span>
                          <span className="text-sm text-gray-500">({rates.length} plans)</span>
                        </div>
                        {bestRate && (
                          <div className="flex items-center space-x-2 text-green-600">
                            <Award className="w-4 h-4" />
                            <span className="text-sm font-medium">Best: {bestRate.price_per_kwh}¢/kWh</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rates Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ZIP Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Supplier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price per kWh
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Term
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Green
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rates.map((rate, index) => {
                            const savings = ptcData[utility] ? calculateSavings(rate, ptcData[utility]) : null;
                            const isBestRate = rate === bestRate;
                            
                            return (
                              <tr key={`${rate.zip_code}-${index}`} className={`hover:bg-gray-50 ${isBestRate ? 'bg-green-50 border-l-4 border-green-500' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-sm font-medium text-gray-900">{rate.zip_code}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <SupplierLogo 
                                    logoUrl={rate.supplier_logo_url} 
                                    supplierName="Energy Supplier"
                                    className="h-8 w-auto max-w-24 object-contain"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <span className={`text-sm font-semibold ${isBestRate ? 'text-green-700' : 'text-gray-900'}`}>
                                      {rate.price_per_kwh}¢
                                    </span>
                                    {isBestRate && (
                                      <Award className="w-4 h-4 text-green-600" />
                                    )}
                                  </div>
                                  {savings && (
                                    <div className="text-xs text-green-600 mt-1">
                                      Save {savings}%
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-sm text-gray-900">{rate.terms}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm text-gray-900">
                                    {rate.fee || 'No fee'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {rate.green && rate.green !== 'N' && rate.green !== '' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <Leaf className="w-3 h-3 mr-1" />
                                      {rate.green}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {rate.signup_url && (
                                    <a
                                      href={rate.signup_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Sign Up
                                    </a>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};