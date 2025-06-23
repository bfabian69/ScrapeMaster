import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Zap, 
  MapPin, 
  Building2, 
  BarChart3, 
  TrendingUp,
  Calendar,
  Activity,
  RefreshCw,
  DollarSign,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { getAvailableTables, getEnergyData, getUtilitiesFromTable, getPTCDataWithDetails } from '../services/supabase';

interface DashboardData {
  totalRecords: number;
  totalUtilities: number;
  totalZipCodes: number;
  availableTables: string[];
  tableStats: {
    [tableName: string]: {
      records: number;
      utilities: number;
      zipCodes: number;
      lastUpdated?: string;
    };
  };
  ptcUtilities: Array<{
    utility: string;
    price_to_compare: number;
    state: string;
  }>;
}

export const DashboardStats: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRecords: 0,
    totalUtilities: 0,
    totalZipCodes: 0,
    availableTables: [],
    tableStats: {},
    ptcUtilities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStates, setExpandedStates] = useState<{ [state: string]: boolean }>({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== Loading Dashboard Data ===');
      
      // Get available tables
      const tables = await getAvailableTables();
      console.log('Available tables:', tables);
      
      // Load PTC data with details (including state from database)
      const ptcUtilities = await getPTCDataWithDetails();
      console.log('PTC utilities loaded:', ptcUtilities);
      
      if (tables.length === 0) {
        setDashboardData({
          totalRecords: 0,
          totalUtilities: 0,
          totalZipCodes: 0,
          availableTables: [],
          tableStats: {},
          ptcUtilities
        });
        setLoading(false);
        return;
      }
      
      const tableStats: DashboardData['tableStats'] = {};
      const allUtilities = new Set<string>();
      const allZipCodes = new Set<string>();
      let totalRecords = 0;
      
      // Load data for each table
      for (const table of tables) {
        try {
          console.log(`Loading data for ${table} table...`);
          
          // Get all data for this table
          const tableData = await getEnergyData(table);
          const tableUtilities = await getUtilitiesFromTable(table);
          
          // Extract unique ZIP codes from this table
          const tableZipCodes = [...new Set(tableData.map(record => record.zip_code).filter(zip => zip))];
          
          // Find most recent record for last updated
          const mostRecent = tableData.length > 0 ? 
            tableData.reduce((latest, current) => 
              new Date(current.scraped_at) > new Date(latest.scraped_at) ? current : latest
            ) : null;
          
          tableStats[table] = {
            records: tableData.length,
            utilities: tableUtilities.length,
            zipCodes: tableZipCodes.length,
            lastUpdated: mostRecent?.scraped_at
          };
          
          // Add to totals
          totalRecords += tableData.length;
          tableUtilities.forEach(utility => allUtilities.add(utility));
          tableZipCodes.forEach(zip => allZipCodes.add(zip));
          
          console.log(`${table} stats:`, tableStats[table]);
          
        } catch (tableError) {
          console.error(`Error loading data for ${table}:`, tableError);
          tableStats[table] = {
            records: 0,
            utilities: 0,
            zipCodes: 0
          };
        }
      }
      
      // Set initial expanded states to true (all open) for all states found in PTC data
      const initialExpandedStates: { [state: string]: boolean } = {};
      const stateGroups = groupUtilitiesByState(ptcUtilities);
      Object.keys(stateGroups).forEach(state => {
        initialExpandedStates[state] = true;
      });
      setExpandedStates(initialExpandedStates);
      
      setDashboardData({
        totalRecords,
        totalUtilities: allUtilities.size,
        totalZipCodes: allZipCodes.size,
        availableTables: tables,
        tableStats,
        ptcUtilities
      });
      
      console.log('Dashboard data loaded:', {
        totalRecords,
        totalUtilities: allUtilities.size,
        totalZipCodes: allZipCodes.size,
        tables: tables.length,
        ptcUtilities: ptcUtilities.length
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTableDisplayName = (tableName: string) => {
    switch (tableName) {
      case 'powersetter': return 'PowerSetter';
      case 'chooseenergy': return 'ChooseEnergy';
      case 'electricityrates': return 'ElectricityRates';
      default: return tableName;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Group utilities by state using the state column from PTC table
  const groupUtilitiesByState = (utilities: typeof dashboardData.ptcUtilities) => {
    const stateGroups: { [state: string]: typeof utilities } = {};
    
    utilities.forEach(item => {
      const state = item.state || 'Other';
      if (!stateGroups[state]) {
        stateGroups[state] = [];
      }
      stateGroups[state].push(item);
    });
    
    // Sort states alphabetically and utilities within each state
    const sortedStates = Object.keys(stateGroups).sort();
    const result: { [state: string]: typeof utilities } = {};
    
    sortedStates.forEach(state => {
      result[state] = stateGroups[state].sort((a, b) => a.utility.localeCompare(b.utility));
    });
    
    return result;
  };

  const toggleStateExpansion = (state: string) => {
    setExpandedStates(prev => ({
      ...prev,
      [state]: !prev[state]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-gray-600">Loading dashboard data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-5 h-5 text-red-600 mr-2">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Dashboard Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const utilitiesByState = groupUtilitiesByState(dashboardData.ptcUtilities);

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardData.totalRecords.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Database className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilities</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardData.totalUtilities}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ZIP Codes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardData.totalZipCodes}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Sources</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardData.availableTables.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Utilities with PTC Prices by State */}
      {Object.keys(utilitiesByState).length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Building2 className="w-6 h-6 text-blue-600 mr-2" />
            Utilities & Price to Compare (PTC) by State
          </h2>
          
          <div className="space-y-4">
            {Object.entries(utilitiesByState).map(([state, utilities]) => (
              <div key={state} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* State Header */}
                <button
                  onClick={() => toggleStateExpansion(state)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">{state}</span>
                    <span className="text-sm text-gray-500">({utilities.length} utilities)</span>
                  </div>
                  {expandedStates[state] ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {/* Utilities List */}
                {expandedStates[state] && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {utilities.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Zap className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{item.utility}</div>
                              <div className="text-xs text-gray-500">Utility Company</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center text-green-600 font-semibold">
                              <DollarSign className="w-4 h-4 mr-1" />
                              <span>{item.price_to_compare.toFixed(2)}¢</span>
                            </div>
                            <div className="text-xs text-gray-500">per kWh</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Price to Compare (PTC):</strong> The official utility rate used as a baseline for comparing energy supplier offers. 
              Rates below the PTC represent potential savings.
            </p>
          </div>
        </div>
      )}

      {/* Data Sources Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Data Sources Overview</h2>
          <button
            onClick={loadDashboardData}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
        
        {dashboardData.availableTables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No data sources available</p>
            <p className="text-sm text-gray-400 mt-2">Add some energy rate data to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.availableTables.map(table => {
              const stats = dashboardData.tableStats[table];
              return (
                <div key={table} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{getTableDisplayName(table)}</h3>
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Records:</span>
                      <span className="font-medium text-gray-900">{stats.records.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Utilities:</span>
                      <span className="font-medium text-gray-900">{stats.utilities}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ZIP Codes:</span>
                      <span className="font-medium text-gray-900">{stats.zipCodes}</span>
                    </div>
                    {stats.lastUpdated && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium text-gray-900">{formatDate(stats.lastUpdated)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};