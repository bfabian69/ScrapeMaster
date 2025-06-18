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
  RefreshCw
} from 'lucide-react';
import { getAvailableTables, getEnergyData, getUtilitiesFromTable } from '../services/supabase';

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
  recentActivity: {
    table: string;
    utility: string;
    zipCode: string;
    date: string;
  }[];
}

export const DashboardStats: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRecords: 0,
    totalUtilities: 0,
    totalZipCodes: 0,
    availableTables: [],
    tableStats: {},
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      if (tables.length === 0) {
        setDashboardData({
          totalRecords: 0,
          totalUtilities: 0,
          totalZipCodes: 0,
          availableTables: [],
          tableStats: {},
          recentActivity: []
        });
        setLoading(false);
        return;
      }
      
      const tableStats: DashboardData['tableStats'] = {};
      const allUtilities = new Set<string>();
      const allZipCodes = new Set<string>();
      const recentActivity: DashboardData['recentActivity'] = [];
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
          
          // Add recent activity (last 5 records from this table)
          const recentFromTable = tableData
            .slice(0, 5)
            .map(record => ({
              table,
              utility: record.utility || 'Unknown',
              zipCode: record.zip_code || 'Unknown',
              date: record.scraped_at
            }));
          
          recentActivity.push(...recentFromTable);
          
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
      
      // Sort recent activity by date (most recent first) and limit to 10
      recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const limitedActivity = recentActivity.slice(0, 10);
      
      setDashboardData({
        totalRecords,
        totalUtilities: allUtilities.size,
        totalZipCodes: allZipCodes.size,
        availableTables: tables,
        tableStats,
        recentActivity: limitedActivity
      });
      
      console.log('Dashboard data loaded:', {
        totalRecords,
        totalUtilities: allUtilities.size,
        totalZipCodes: allZipCodes.size,
        tables: tables.length
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

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
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

      {/* Recent Activity */}
      {dashboardData.recentActivity.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="w-6 h-6 text-green-600 mr-2" />
            Recent Activity
          </h2>
          
          <div className="space-y-3">
            {dashboardData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {activity.utility} • {activity.zipCode}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTableDisplayName(activity.table)} data source
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDateTime(activity.date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};