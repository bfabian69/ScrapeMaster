import React, { useState, useEffect } from 'react';
import { Database, Download, Filter, Search, ExternalLink, Zap, DollarSign, Calendar, Leaf, RefreshCw, Table, Building2 } from 'lucide-react';
import { PowerSetterData } from '../types/scraping';
import { getEnergyData, getUtilitiesFromTable, supabase, getAvailableTables } from '../services/supabase';

export const ScrapedDataViewer: React.FC = () => {
  const [data, setData] = useState<PowerSetterData[]>([]);
  const [filteredData, setFilteredData] = useState<PowerSetterData[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('powersetter');
  const [loading, setLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUtility, setSelectedUtility] = useState('');
  const [greenOnly, setGreenOnly] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    loadAvailableTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      checkConnection();
      loadData();
    }
  }, [selectedTable]);

  useEffect(() => {
    filterData();
  }, [data, searchTerm, selectedUtility, greenOnly]);

  const loadAvailableTables = async () => {
    try {
      setTablesLoading(true);
      const tables = await getAvailableTables();
      setAvailableTables(tables);
      
      // Set default table if current selection is not available
      if (tables.length > 0 && !tables.includes(selectedTable)) {
        setSelectedTable(tables[0]);
      }
    } catch (error) {
      console.error('Error loading available tables:', error);
      setAvailableTables(['powersetter']); // Fallback to powersetter
    } finally {
      setTablesLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from(selectedTable).select('count', { count: 'exact', head: true });
      if (error) {
        console.error('Connection error:', error);
        setConnectionStatus('error');
      } else {
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionStatus('error');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const scrapedData = await getEnergyData(selectedTable);
      setData(scrapedData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.zip_code.includes(searchTerm) ||
        item.utility.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedUtility) {
      filtered = filtered.filter(item => item.utility === selectedUtility);
    }

    if (greenOnly) {
      filtered = filtered.filter(item => item.green !== 'N' && item.green !== '');
    }

    setFilteredData(filtered);
  };

  const exportToCSV = () => {
    const headers = ['ZIP Code', 'Utility', 'Price (¢/kWh)', 'Savings', 'Terms', 'Green', 'Fee', 'Scraped At'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.zip_code,
        `"${item.utility}"`,
        item.price_per_kwh,
        `"${item.savings}"`,
        `"${item.terms}"`,
        `"${item.green}"`,
        `"${item.fee}"`,
        new Date(item.scraped_at).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTableDisplayName = (tableName: string) => {
    switch (tableName) {
      case 'powersetter': return 'PowerSetter';
      case 'chooseenergy': return 'ChooseEnergy';
      case 'electricityrates': return 'ElectricityRates';
      default: return tableName;
    }
  };

  const uniqueUtilities = [...new Set(data.map(item => item.utility))].sort();

  if (loading || tablesLoading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-600">
            {tablesLoading ? 'Loading available tables...' : `Loading data from ${selectedTable}...`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Database className="w-6 h-6 text-green-600 mr-2" />
            Raw Energy Data
            <div className="ml-4 flex items-center">
              {connectionStatus === 'checking' && (
                <div className="flex items-center text-yellow-600">
                  <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-sm">Checking connection...</span>
                </div>
              )}
              {connectionStatus === 'connected' && (
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  <span className="text-sm">Connected to Database</span>
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="flex items-center text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                  <span className="text-sm">Connection Error</span>
                </div>
              )}
            </div>
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => { checkConnection(); loadData(); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredData.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Connection Status Alert */}
        {connectionStatus === 'error' && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-5 h-5 text-red-600 mr-2">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Database Connection Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  Unable to connect to the {selectedTable} table. Please check your database setup.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Table className="w-4 h-4 inline mr-1" />
              Data Source
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableTables.map(table => (
                <option key={table} value={table}>
                  {getTableDisplayName(table)}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <Search className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ZIP or utility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" />
              Utility
            </label>
            <select
              value={selectedUtility}
              onChange={(e) => setSelectedUtility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Utilities</option>
              {uniqueUtilities.map(utility => (
                <option key={utility} value={utility}>{utility}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={greenOnly}
                onChange={(e) => setGreenOnly(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <Leaf className="w-4 h-4 mr-1 text-green-600" />
                Green Only
              </span>
            </label>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600 flex items-center">
              <Filter className="w-4 h-4 mr-1" />
              {filteredData.length} of {data.length} records
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {connectionStatus === 'error' ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-4 text-red-300" />
            <p className="text-red-600 font-medium">Database Connection Failed</p>
            <p className="text-sm text-gray-500 mt-2">Please check your database configuration for {selectedTable}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No data found matching your filters in {getTableDisplayName(selectedTable)}.</p>
            <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or selecting a different data source.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">ZIP Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Utility</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Savings</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Terms</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Green</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Fee</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Scraped</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={`${item.zip_code}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.zip_code}</td>
                    <td className="py-3 px-4 text-gray-700">{item.utility}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                        <span className="font-semibold text-green-600">{item.price_per_kwh}¢</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {item.savings && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.savings}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-gray-700">
                        <Calendar className="w-4 h-4 mr-1" />
                        {item.terms}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {item.green !== 'N' && item.green !== '' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Leaf className="w-3 h-3 mr-1" />
                          {item.green}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{item.fee || 'No fee'}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(item.scraped_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {item.signup_url && (
                        <a
                          href={item.signup_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Sign Up
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};