import { createClient } from '@supabase/supabase-js';
import { PowerSetterData } from '../types/scraping';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase configuration:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseKey ? 'Set' : 'Missing'
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// COMPLETELY REWRITTEN: Get data from any table with proper pagination to get ALL records
export const getEnergyData = async (tableName: string, zipCode?: string): Promise<PowerSetterData[]> => {
  try {
    console.log(`=== getEnergyData called for table: ${tableName} ===`);
    console.log('Querying table with zipCode:', zipCode);
    
    // Step 1: Get total count first
    console.log(`Step 1: Getting total record count for ${tableName}...`);
    let countQuery = supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (zipCode) {
      countQuery = countQuery.eq('zip_code', zipCode);
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error(`Error getting count from ${tableName}:`, countError);
      throw countError;
    }
    
    console.log(`Total records in ${tableName} table${zipCode ? ` for ZIP ${zipCode}` : ''}:`, count);
    
    // Step 2: Use pagination to get ALL records
    console.log(`Step 2: Fetching ALL records using pagination...`);
    
    const allData: PowerSetterData[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    let totalProcessed = 0;
    
    while (hasMore) {
      console.log(`Fetching batch ${from} to ${from + pageSize - 1}...`);
      
      let query = supabase
        .from(tableName)
        .select('*')
        .order('scraped_at', { ascending: false })
        .range(from, from + pageSize - 1);
      
      if (zipCode) {
        query = query.eq('zip_code', zipCode);
      }
      
      const { data: batchData, error: batchError } = await query;
      
      if (batchError) {
        console.error(`Error fetching batch ${from}-${from + pageSize - 1}:`, batchError);
        throw batchError;
      }
      
      if (!batchData || batchData.length === 0) {
        console.log('No more data, stopping pagination');
        hasMore = false;
        break;
      }
      
      console.log(`Batch ${from}-${from + pageSize - 1}: ${batchData.length} records`);
      totalProcessed += batchData.length;
      
      // Add this batch to our results
      allData.push(...batchData);
      
      // Check if we got a full page (if not, we're at the end)
      if (batchData.length < pageSize) {
        console.log('Partial page received, stopping pagination');
        hasMore = false;
      } else {
        from += pageSize;
      }
      
      // Safety check to prevent infinite loops
      if (from > 100000) {
        console.warn('Stopping pagination at 100k records to prevent infinite loop');
        hasMore = false;
      }
    }
    
    console.log(`✅ Successfully retrieved ${allData.length} total records from ${tableName}`);
    
    // ENHANCED DEBUGGING: If this is electricityrates table, let's examine the data more closely
    if (tableName === 'electricityrates' && allData && allData.length > 0) {
      console.log('=== ENHANCED DEBUGGING FOR ELECTRICITYRATES ===');
      
      // Check for West Penn Power specifically
      const westPennRecords = allData.filter(record => 
        record.utility && record.utility.includes('West Penn')
      );
      console.log('🎯 West Penn Power records found in ALL data:', westPennRecords.length);
      console.log('Sample West Penn Power records:', westPennRecords.slice(0, 3));
      
      // Show all unique utilities in the returned data
      const utilitiesInData = [...new Set(allData.map(d => d.utility).filter(u => u))];
      console.log('All utilities in returned data:', utilitiesInData.length, 'unique utilities');
      console.log('Utilities list:', utilitiesInData.sort());
      
      // Check exact utility values
      const exactWestPenn = allData.filter(record => record.utility === 'West Penn Power');
      console.log('🎯 Exact "West Penn Power" matches:', exactWestPenn.length);
      
      if (exactWestPenn.length > 0) {
        console.log('Sample exact West Penn Power record:', exactWestPenn[0]);
      }
      
      // Check for variations
      const westPennVariations = allData.filter(record => 
        record.utility && (
          record.utility.toLowerCase().includes('west penn') ||
          record.utility.toLowerCase().includes('penn power')
        )
      );
      console.log('🎯 All West Penn variations found:', westPennVariations.length);
      
      if (westPennVariations.length > 0) {
        const uniqueWestPennNames = [...new Set(westPennVariations.map(r => r.utility))];
        console.log('🎯 Unique West Penn utility names:', uniqueWestPennNames);
      }
    }
    
    return allData || [];
  } catch (error) {
    console.error(`Supabase query failed for ${tableName}:`, error);
    throw error;
  }
};

// Backward compatibility function
export const getPowerSetterData = async (zipCode?: string): Promise<PowerSetterData[]> => {
  return getEnergyData('powersetter', zipCode);
};

// OPTIMIZED: Get utilities using a more efficient approach with proper pagination
export const getUtilitiesFromTable = async (tableName: string): Promise<string[]> => {
  try {
    console.log(`=== Starting getUtilities function for ${tableName} ===`);
    console.log(`Querying ${tableName} table for utilities...`);
    
    // Step 1: Test basic table access
    console.log(`Step 1: Testing basic table access for ${tableName}...`);
    const { data: testData, error: testError } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (testError) {
      console.error(`Basic table access failed for ${tableName}:`, testError);
      console.error('Error details:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      });
      
      // Check if this is an RLS policy issue
      if (testError.code === 'PGRST116' || testError.message.includes('row-level security')) {
        throw new Error(`Database access denied due to Row Level Security policies for ${tableName} table. Please run the database migration to fix permissions.`);
      }
      
      throw testError;
    }
    
    console.log(`Step 1 SUCCESS: Basic table access works for ${tableName}`);
    console.log(`Sample records from ${tableName} table:`, testData);
    
    // Step 2: Get total count to understand data size
    console.log(`Step 2: Getting total record count for ${tableName}...`);
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error getting count:', countError);
    } else {
      console.log(`Total records in ${tableName} table:`, count);
    }
    
    // Step 3: Use DISTINCT query to get unique utilities more efficiently
    console.log(`Step 3: Using DISTINCT query to get unique utilities...`);
    
    // Try to use a more efficient approach first
    try {
      const { data: distinctData, error: distinctError } = await supabase
        .from(tableName)
        .select('utility')
        .not('utility', 'is', null)
        .neq('utility', '');
      
      if (distinctError) {
        throw distinctError;
      }
      
      console.log(`Retrieved ${distinctData?.length || 0} utility records`);
      
      if (distinctData && distinctData.length > 0) {
        // Process all utilities
        const allUtilities = new Set<string>();
        
        distinctData.forEach(row => {
          if (row.utility && typeof row.utility === 'string' && row.utility.trim()) {
            const cleanUtility = row.utility.trim();
            allUtilities.add(cleanUtility);
            
            // Special logging for West Penn Power
            if (cleanUtility.includes('West Penn')) {
              console.log('🎯 Found West Penn Power variant:', cleanUtility);
            }
          }
        });
        
        console.log(`Found ${allUtilities.size} unique utilities`);
        
        // Convert Set to sorted array
        const uniqueUtilities = Array.from(allUtilities).sort();
        console.log('Final unique utilities:', uniqueUtilities);
        
        // Special check for West Penn Power and variations
        const westPennVariations = uniqueUtilities.filter(u => 
          u.toLowerCase().includes('west penn') || 
          u.toLowerCase().includes('westpenn') ||
          u.toLowerCase().includes('west penn power') ||
          u.toLowerCase().includes('penn power')
        );
        console.log('🎯 West Penn Power variations found:', westPennVariations);
        
        // Check for exact match
        const exactMatch = uniqueUtilities.find(u => u === 'West Penn Power');
        console.log('🎯 Exact "West Penn Power" match found:', exactMatch ? 'YES' : 'NO');
        
        console.log(`=== getUtilities function completed for ${tableName} ===`);
        console.log(`Final result: ${uniqueUtilities.length} utilities`);
        
        return uniqueUtilities;
      }
    } catch (distinctError) {
      console.log('DISTINCT query failed, falling back to pagination approach:', distinctError.message);
    }
    
    // Fallback: Use pagination approach if DISTINCT fails
    console.log(`Step 3 FALLBACK: Using pagination to get ALL utilities...`);
    
    const allUtilities = new Set<string>();
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    let totalProcessed = 0;
    
    while (hasMore) {
      console.log(`Fetching utilities batch ${from} to ${from + pageSize - 1}...`);
      
      const { data: batchData, error: batchError } = await supabase
        .from(tableName)
        .select('utility')
        .not('utility', 'is', null)
        .neq('utility', '')
        .range(from, from + pageSize - 1);
      
      if (batchError) {
        console.error(`Error fetching batch ${from}-${from + pageSize - 1}:`, batchError);
        throw batchError;
      }
      
      if (!batchData || batchData.length === 0) {
        console.log('No more data, stopping pagination');
        hasMore = false;
        break;
      }
      
      console.log(`Batch ${from}-${from + pageSize - 1}: ${batchData.length} records`);
      totalProcessed += batchData.length;
      
      // Process this batch and add utilities to our set
      batchData.forEach(row => {
        if (row.utility && typeof row.utility === 'string' && row.utility.trim()) {
          const cleanUtility = row.utility.trim();
          allUtilities.add(cleanUtility);
          
          // Special logging for West Penn Power
          if (cleanUtility.includes('West Penn')) {
            console.log('🎯 Found West Penn Power variant:', cleanUtility);
          }
        }
      });
      
      console.log(`Current unique utilities count: ${allUtilities.size}`);
      
      // Check if we got a full page (if not, we're at the end)
      if (batchData.length < pageSize) {
        console.log('Partial page received, stopping pagination');
        hasMore = false;
      } else {
        from += pageSize;
      }
      
      // Safety check to prevent infinite loops
      if (from > 100000) {
        console.warn('Stopping pagination at 100k records to prevent infinite loop');
        hasMore = false;
      }
    }
    
    console.log(`Step 3 SUCCESS: Processed ${totalProcessed} records, found ${allUtilities.size} unique utilities`);
    
    // Convert Set to sorted array
    const uniqueUtilities = Array.from(allUtilities).sort();
    console.log('Final unique utilities:', uniqueUtilities);
    
    // Special check for West Penn Power and variations
    const westPennVariations = uniqueUtilities.filter(u => 
      u.toLowerCase().includes('west penn') || 
      u.toLowerCase().includes('westpenn') ||
      u.toLowerCase().includes('west penn power') ||
      u.toLowerCase().includes('penn power')
    );
    console.log('🎯 West Penn Power variations found:', westPennVariations);
    
    // Check for exact match
    const exactMatch = uniqueUtilities.find(u => u === 'West Penn Power');
    console.log('🎯 Exact "West Penn Power" match found:', exactMatch ? 'YES' : 'NO');
    
    console.log(`=== getUtilities function completed for ${tableName} ===`);
    console.log(`Final result: ${uniqueUtilities.length} utilities`);
    
    return uniqueUtilities;
    
  } catch (error) {
    console.error(`=== getUtilities function FAILED for ${tableName} ===`);
    console.error('Error details:', error);
    throw error;
  }
};

// Backward compatibility function
export const getUtilities = async (): Promise<string[]> => {
  return getUtilitiesFromTable('powersetter');
};

export const getPTCData = async (): Promise<{ [utility: string]: number }> => {
  try {
    console.log('Loading PTC data...');
    const { data, error } = await supabase
      .from('ptc')
      .select('utility, price_to_compare');
    
    if (error) {
      console.error('Error fetching PTC data:', error);
      return {};
    }
    
    const ptcData: { [utility: string]: number } = {};
    
    if (data) {
      data.forEach(row => {
        const utility = row.utility?.trim();
        const price = row.price_to_compare;
        
        if (utility && price !== null && price !== undefined) {
          try {
            // Convert to cents (multiply by 100) to match the Flask app logic
            ptcData[utility] = parseFloat(price) * 100;
          } catch (e) {
            console.error(`Failed to convert price for ${utility}:`, price);
          }
        }
      });
    }
    
    console.log('PTC data loaded:', ptcData);
    return ptcData;
  } catch (error) {
    console.error('Error fetching PTC data:', error);
    return {};
  }
};

// New function to get full PTC data with utility details from the state column
export const getPTCDataWithDetails = async (): Promise<Array<{
  utility: string;
  price_to_compare: number;
  state: string;
}>> => {
  try {
    console.log('Loading detailed PTC data with state information...');
    const { data, error } = await supabase
      .from('ptc')
      .select('utility, price_to_compare, state')
      .order('state, utility');
    
    if (error) {
      console.error('Error fetching detailed PTC data:', error);
      return [];
    }
    
    if (!data) {
      return [];
    }
    
    // Process the data and convert price to cents
    const ptcDataWithDetails = data
      .map(row => {
        const utility = row.utility?.trim();
        const price = row.price_to_compare;
        const state = row.state?.trim() || 'Other';
        
        if (!utility || price === null || price === undefined) {
          return null;
        }
        
        return {
          utility,
          price_to_compare: parseFloat(price) * 100, // Convert to cents
          state
        };
      })
      .filter(item => item !== null);
    
    console.log('Detailed PTC data loaded:', ptcDataWithDetails);
    return ptcDataWithDetails;
  } catch (error) {
    console.error('Error fetching detailed PTC data:', error);
    return [];
  }
};

export const insertPowerSetterData = async (data: PowerSetterData[]) => {
  try {
    console.log('=== ATTEMPTING TO INSERT DATA INTO POWERSETTER TABLE ===');
    console.log('Data to insert:', data.length, 'records');
    console.log('Sample record:', data[0]);
    
    // Test permissions first
    console.log('Testing INSERT permissions on powersetter table...');
    const testRecord = {
      zip_code: "TEST",
      price_per_kwh: 0.01,
      savings: "Test",
      terms: "Test",
      info: "Test insert",
      green: "N",
      supplier_logo_url: "",
      signup_url: "",
      utility: "Test Utility",
      fee: "",
      scraped_at: new Date().toISOString()
    };
    
    const { data: testResult, error: testError } = await supabase
      .from('powersetter')
      .insert([testRecord])
      .select();
    
    if (testError) {
      console.error('❌ INSERT permission test FAILED:', testError);
      console.error('Error details:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      });
      
      if (testError.code === 'PGRST116' || testError.message.includes('row-level security')) {
        throw new Error(`Database INSERT permission denied due to Row Level Security policies. Please run the database migration to fix permissions. Error: ${testError.message}`);
      }
      
      throw new Error(`Database INSERT permission denied: ${testError.message}. Check your RLS policies.`);
    }
    
    console.log('✅ INSERT permission test PASSED:', testResult);
    
    // Clean up test record
    if (testResult && testResult[0]) {
      await supabase
        .from('powersetter')
        .delete()
        .eq('zip_code', 'TEST');
      console.log('Test record cleaned up');
    }
    
    // Now insert the actual data
    console.log('Inserting actual data into powersetter table...');
    const { data: insertResult, error: insertError } = await supabase
      .from('powersetter')
      .insert(data)
      .select();
    
    if (insertError) {
      console.error('❌ Data insertion FAILED:', insertError);
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      throw insertError;
    }
    
    console.log('✅ Data insertion SUCCESSFUL:', insertResult?.length, 'records inserted');
    console.log('Inserted records:', insertResult);
    
    // Verify the insertion by counting records
    const { count, error: countError } = await supabase
      .from('powersetter')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log('✅ Verification: Total records in powersetter table after insert:', count);
    }
    
    return insertResult;
    
  } catch (error) {
    console.error('❌ insertPowerSetterData FAILED:', error);
    throw error;
  }
};

export const deletePowerSetterData = async (zipCode?: string) => {
  try {
    let query = supabase.from('powersetter').delete();
    
    if (zipCode) {
      query = query.eq('zip_code', zipCode);
    } else {
      query = query.neq('id', 0); // Delete all records
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Error deleting PowerSetter data:', error);
      throw error;
    }
  } catch (error) {
    console.error('Supabase delete failed:', error);
    throw error;
  }
};

// Test connection function for any table
export const testTableConnection = async (tableName: string) => {
  try {
    console.log(`=== Testing Supabase connection to ${tableName} table ===`);
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');
    
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Connection test failed for ${tableName}:`, error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        return { 
          success: false, 
          error: `Row Level Security policies are blocking data access to ${tableName} table. Please run the database migration to fix permissions.`,
          isRLSIssue: true
        };
      }
      
      throw error;
    }
    
    console.log(`Connection test successful for ${tableName}`);
    console.log(`Total records in ${tableName} table:`, count);
    
    return { 
      success: true, 
      message: `Connected successfully to ${tableName} table`,
      recordCount: count 
    };
  } catch (error) {
    console.error(`Connection test error for ${tableName}:`, error);
    return { 
      success: false, 
      error: error.message || 'Unknown error' 
    };
  }
};

// Backward compatibility function
export const testConnection = async () => {
  return testTableConnection('powersetter');
};

// Check database permissions for any table
export const checkTablePermissions = async (tableName: string) => {
  try {
    console.log(`=== Checking Database Permissions for ${tableName} table ===`);
    
    const permissions = {
      select: false,
      insert: false,
      update: false,
      delete: false
    };
    
    // Test SELECT
    try {
      await supabase.from(tableName).select('*').limit(1);
      permissions.select = true;
      console.log(`✅ SELECT permission for ${tableName}: GRANTED`);
    } catch (error) {
      console.log(`❌ SELECT permission for ${tableName}: DENIED -`, error.message);
    }
    
    // Test INSERT (only for powersetter table to avoid creating test data in other tables)
    if (tableName === 'powersetter') {
      try {
        const testRecord = {
          zip_code: "PERM_TEST",
          price_per_kwh: 0.01,
          savings: "Test",
          terms: "Test",
          info: "Permission test",
          green: "N",
          supplier_logo_url: "",
          signup_url: "",
          utility: "Permission Test",
          fee: "",
          scraped_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from(tableName)
          .insert([testRecord])
          .select();
        
        if (error) throw error;
        
        permissions.insert = true;
        console.log(`✅ INSERT permission for ${tableName}: GRANTED`);
        
        // Clean up test record
        if (data && data[0]) {
          await supabase
            .from(tableName)
            .delete()
            .eq('zip_code', 'PERM_TEST');
        }
      } catch (error) {
        console.log(`❌ INSERT permission for ${tableName}: DENIED -`, error.message);
      }
    }
    
    return permissions;
  } catch (error) {
    console.error(`Permission check failed for ${tableName}:`, error);
    return null;
  }
};

// Backward compatibility function
export const checkDatabasePermissions = async () => {
  return checkTablePermissions('powersetter');
};

// Get available tables that contain energy data
export const getAvailableTables = async (): Promise<string[]> => {
  const tables = ['powersetter', 'chooseenergy', 'electricityrates'];
  const availableTables: string[] = [];
  
  for (const table of tables) {
    try {
      const result = await testTableConnection(table);
      if (result.success) {
        availableTables.push(table);
      }
    } catch (error) {
      console.log(`Table ${table} not available:`, error.message);
    }
  }
  
  // Always include tables that exist, even if they're empty
  // This ensures the UI shows all available data sources
  if (availableTables.length === 0) {
    // Fallback: try to detect which tables exist by attempting basic queries
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          availableTables.push(table);
        }
      } catch (error) {
        console.log(`Table ${table} does not exist or is not accessible`);
      }
    }
  }
  
  return availableTables;
};