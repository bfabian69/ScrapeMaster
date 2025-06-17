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

export const getPowerSetterData = async (zipCode?: string): Promise<PowerSetterData[]> => {
  try {
    console.log('getPowerSetterData called with zipCode:', zipCode);
    
    let query = supabase
      .from('powersetter')
      .select('*')
      .order('scraped_at', { ascending: false });
    
    if (zipCode) {
      query = query.eq('zip_code', zipCode);
    }
    
    console.log('Executing query...');
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching PowerSetter data:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Check if this is an RLS policy issue
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        throw new Error('Database access denied. This may be due to Row Level Security policies. Please check your database permissions.');
      }
      
      throw error;
    }
    
    console.log('PowerSetter data query result:', {
      recordCount: data?.length || 0,
      sampleRecord: data?.[0] || null
    });
    
    return data || [];
  } catch (error) {
    console.error('Supabase query failed:', error);
    throw error;
  }
};

export const getUtilities = async (): Promise<string[]> => {
  try {
    console.log('=== Starting getUtilities function ===');
    
    // First, let's check if we can connect to the table at all
    console.log('Step 1: Testing basic table access...');
    const { data: testData, error: testError } = await supabase
      .from('powersetter')
      .select('*')
      .limit(5);
    
    if (testError) {
      console.error('Basic table access failed:', testError);
      console.error('Error details:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      });
      
      // Check if this is an RLS policy issue
      if (testError.code === 'PGRST116' || testError.message.includes('row-level security')) {
        throw new Error('Database access denied due to Row Level Security policies. Please run the database migration to fix permissions.');
      }
      
      throw testError;
    }
    
    console.log('Step 1 SUCCESS: Basic table access works');
    console.log('Sample records from table:', testData);
    
    // Now let's specifically query for utilities
    console.log('Step 2: Querying for utility column...');
    const { data, error } = await supabase
      .from('powersetter')
      .select('utility')
      .limit(1000);
    
    if (error) {
      console.error('Utility query failed:', error);
      throw error;
    }
    
    console.log('Step 2 SUCCESS: Utility query completed');
    console.log('Raw utility data:', data);
    console.log('Number of records returned:', data?.length || 0);
    
    if (!data || data.length === 0) {
      console.warn('No records returned from utility query');
      return [];
    }
    
    // Let's examine the actual utility values
    console.log('Step 3: Processing utility values...');
    const allUtilities = data.map(row => row.utility);
    console.log('All utility values (including nulls/empty):', allUtilities);
    
    // Filter out null, undefined, and empty strings
    const validUtilities = allUtilities.filter(utility => 
      utility && 
      utility.trim && 
      utility.trim().length > 0
    );
    console.log('Valid utility values:', validUtilities);
    
    // Get unique utilities
    const uniqueUtilities = [...new Set(validUtilities.map(u => u.trim()))].sort();
    console.log('Unique utilities:', uniqueUtilities);
    console.log('Final count:', uniqueUtilities.length);
    
    console.log('=== getUtilities function completed ===');
    return uniqueUtilities;
    
  } catch (error) {
    console.error('=== getUtilities function FAILED ===');
    console.error('Error details:', error);
    throw error;
  }
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

export const insertPowerSetterData = async (data: PowerSetterData[]) => {
  try {
    console.log('=== ATTEMPTING TO INSERT DATA ===');
    console.log('Data to insert:', data.length, 'records');
    console.log('Sample record:', data[0]);
    
    // Test permissions first
    console.log('Testing INSERT permissions...');
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
    console.log('Inserting actual data...');
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
      console.log('✅ Verification: Total records in table after insert:', count);
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

// Test connection function
export const testConnection = async () => {
  try {
    console.log('=== Testing Supabase connection ===');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');
    
    const { data, error, count } = await supabase
      .from('powersetter')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Connection test failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        return { 
          success: false, 
          error: 'Row Level Security policies are blocking data access. Please run the database migration to fix permissions.',
          isRLSIssue: true
        };
      }
      
      throw error;
    }
    
    console.log('Connection test successful');
    console.log('Total records in powersetter table:', count);
    
    return { 
      success: true, 
      message: 'Connected successfully',
      recordCount: count 
    };
  } catch (error) {
    console.error('Connection test error:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error' 
    };
  }
};

// Check database permissions
export const checkDatabasePermissions = async () => {
  try {
    console.log('=== Checking Database Permissions ===');
    
    const permissions = {
      select: false,
      insert: false,
      update: false,
      delete: false
    };
    
    // Test SELECT
    try {
      await supabase.from('powersetter').select('*').limit(1);
      permissions.select = true;
      console.log('✅ SELECT permission: GRANTED');
    } catch (error) {
      console.log('❌ SELECT permission: DENIED -', error.message);
    }
    
    // Test INSERT
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
        .from('powersetter')
        .insert([testRecord])
        .select();
      
      if (error) throw error;
      
      permissions.insert = true;
      console.log('✅ INSERT permission: GRANTED');
      
      // Clean up test record
      if (data && data[0]) {
        await supabase
          .from('powersetter')
          .delete()
          .eq('zip_code', 'PERM_TEST');
      }
    } catch (error) {
      console.log('❌ INSERT permission: DENIED -', error.message);
    }
    
    return permissions;
  } catch (error) {
    console.error('Permission check failed:', error);
    return null;
  }
};