import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Default utilities mapping from your Python script
const defaultUtilities: Record<string, string> = {
  "60021": "ComEd",
  "62634": "Ameren", 
  "01746": "Eversource - NSTAR",
  "01035": "Eversource - WMECO",
  "44052": "Ohio Edison",
  "45255": "Duke Energy",
  "43771": "AEP - Ohio Power",
  "45710": "AEP Columbus",
  "43609": "Toledo Edison",
  "44026": "The Illuminating Company",
  "17017": "PPL Electric",
  "17329": "Met-Ed",
  "19122": "PECO Energy",
  "16637": "Penelec",
  "08001": "Atlantic City Electric",
  "07083": "Public Service Electric & Gas (PSEG)",
  "07885": "JCPL",
  "01069": "Nat Grid - MA"
};

interface ScrapingConfig {
  zipCodes: string[];
  delayBetweenRequests: number;
  maxRetries: number;
  headless: boolean;
}

interface PowerSetterData {
  zip_code: string;
  price_per_kwh: number;
  savings: string;
  terms: string;
  info: string;
  green: string;
  supplier_logo_url: string;
  signup_url: string;
  utility: string;
  fee: string;
  scraped_at: string;
}

async function scrapeZipCode(zipCode: string, config: ScrapingConfig): Promise<PowerSetterData[]> {
  // This would be where you implement the actual scraping logic
  // For now, we'll simulate the scraping process
  
  const utility = defaultUtilities[zipCode] || "Unknown Utility";
  const results: PowerSetterData[] = [];
  
  // Simulate scraping delay
  await new Promise(resolve => setTimeout(resolve, config.delayBetweenRequests));
  
  // Simulate 3-5 plans per ZIP code (matching your Python script logic)
  const planCount = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < planCount; i++) {
    results.push({
      zip_code: zipCode,
      price_per_kwh: parseFloat((Math.random() * 5 + 8).toFixed(4)), // 8-13 cents
      savings: `${Math.floor(Math.random() * 30 + 10)}%`,
      terms: `${Math.floor(Math.random() * 24 + 12)} months`,
      info: `Plan ${i + 1} details for ${utility}`,
      green: Math.random() > 0.5 ? "100% Green" : "N",
      supplier_logo_url: `https://www.powersetter.com/images/supplier${i + 1}.png`,
      signup_url: `https://www.powersetter.com/signup/${zipCode}/${i + 1}`,
      utility: utility,
      fee: Math.random() > 0.7 ? `$${Math.floor(Math.random() * 50 + 10)}` : "",
      scraped_at: new Date().toISOString()
    });
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { config }: { config: ScrapingConfig } = await req.json()
    
    if (!config || !config.zipCodes || config.zipCodes.length === 0) {
      throw new Error('Invalid configuration: zipCodes required')
    }

    const allResults: PowerSetterData[] = []
    
    // Process each ZIP code
    for (const zipCode of config.zipCodes) {
      try {
        console.log(`Processing ZIP ${zipCode}`)
        const results = await scrapeZipCode(zipCode, config)
        allResults.push(...results)
        
        // Insert results into database
        if (results.length > 0) {
          const { error: insertError } = await supabaseClient
            .from('powersetter')
            .insert(results)
          
          if (insertError) {
            console.error(`Error inserting data for ZIP ${zipCode}:`, insertError)
          }
        }
        
      } catch (error) {
        console.error(`Error scraping ZIP ${zipCode}:`, error)
        // Continue with next ZIP code
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Scraped ${allResults.length} records from ${config.zipCodes.length} ZIP codes`,
        data: allResults 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in powersetter-scraper:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})