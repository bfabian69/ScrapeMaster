import { PowerSetterData, ScrapingConfig } from '../types/scraping';
import { insertPowerSetterData } from './supabase';

// Default utilities mapping from your Python script
export const defaultUtilities: Record<string, string> = {
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
  "07083": "Public Service Electric & Gas (NSEG)",
  "07885": "JCPL",
  "01069": "Nat Grid - MA"
};

export class PowerSetterScraper {
  private config: ScrapingConfig;
  private onProgress?: (progress: number, itemsScraped: number) => void;

  constructor(config: ScrapingConfig, onProgress?: (progress: number, itemsScraped: number) => void) {
    this.config = config;
    this.onProgress = onProgress;
  }

  async startScraping(): Promise<PowerSetterData[]> {
    const results: PowerSetterData[] = [];
    const totalZipCodes = this.config.zipCodes.length;
    
    console.log(`🚀 Starting PowerSetter scraping for ${totalZipCodes} ZIP codes via Edge Function`);
    
    for (let i = 0; i < totalZipCodes; i++) {
      const zipCode = this.config.zipCodes[i];
      
      try {
        console.log(`📍 Processing ZIP code ${zipCode} (${i + 1}/${totalZipCodes})`);
        
        // Add delay between requests to avoid rate limiting
        if (i > 0) {
          console.log(`⏱️ Waiting ${this.config.delayBetweenRequests}ms before next request...`);
          await this.delay(this.config.delayBetweenRequests);
        }
        
        const scrapedData = await this.scrapeZipCodeViaEdgeFunction(zipCode);
        
        if (scrapedData.length > 0) {
          results.push(...scrapedData);
          console.log(`✅ Successfully scraped ${scrapedData.length} plans for ZIP ${zipCode}`);
          
          // Store data in Supabase immediately after scraping each ZIP
          try {
            await insertPowerSetterData(scrapedData);
            console.log(`💾 Stored ${scrapedData.length} records for ZIP ${zipCode} in database`);
          } catch (error) {
            console.error(`❌ Failed to store data for ZIP ${zipCode}:`, error);
          }
        } else {
          console.warn(`⚠️ No plans found for ZIP ${zipCode}`);
        }
        
        // Update progress
        const progress = Math.round(((i + 1) / totalZipCodes) * 100);
        const itemsScraped = results.length;
        
        if (this.onProgress) {
          this.onProgress(progress, itemsScraped);
        }
        
      } catch (error) {
        console.error(`❌ Error scraping ZIP ${zipCode}:`, error);
        
        // Try retries if configured
        let retryCount = 0;
        while (retryCount < this.config.maxRetries) {
          retryCount++;
          console.log(`🔄 Retry ${retryCount}/${this.config.maxRetries} for ZIP ${zipCode}`);
          
          try {
            await this.delay(this.config.delayBetweenRequests * 2); // Longer delay for retries
            const retryData = await this.scrapeZipCodeViaEdgeFunction(zipCode);
            
            if (retryData.length > 0) {
              results.push(...retryData);
              console.log(`✅ Retry successful: ${retryData.length} plans for ZIP ${zipCode}`);
              
              try {
                await insertPowerSetterData(retryData);
                console.log(`💾 Stored retry data for ZIP ${zipCode}`);
              } catch (storeError) {
                console.error(`❌ Failed to store retry data for ZIP ${zipCode}:`, storeError);
              }
              break;
            }
          } catch (retryError) {
            console.error(`❌ Retry ${retryCount} failed for ZIP ${zipCode}:`, retryError);
            if (retryCount === this.config.maxRetries) {
              console.error(`💀 All retries exhausted for ZIP ${zipCode}`);
            }
          }
        }
      }
    }
    
    console.log(`🎉 Scraping completed! Total records: ${results.length}`);
    return results;
  }

  private async scrapeZipCodeViaEdgeFunction(zipCode: string): Promise<PowerSetterData[]> {
    console.log(`🔍 Scraping PowerSetter for ZIP code via Edge Function: ${zipCode}`);
    
    try {
      // Call the Supabase Edge Function instead of making direct requests
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/powersetter-scraper`;
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const requestBody = {
        zipCode: zipCode,
        utility: defaultUtilities[zipCode] || "Unknown Utility"
      };

      console.log(`📡 Calling Edge Function: ${apiUrl}`);
      console.log(`📦 Request payload:`, requestBody);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge Function HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`📄 Edge Function response:`, result);
      
      // The Edge Function should return an array of PowerSetterData
      if (result.success && Array.isArray(result.data)) {
        console.log(`✅ Successfully received ${result.data.length} plans from Edge Function`);
        return result.data;
      } else if (result.error) {
        throw new Error(`Edge Function error: ${result.error}`);
      } else {
        console.warn(`⚠️ Unexpected response format from Edge Function`);
        return [];
      }
      
    } catch (error) {
      console.error(`❌ Failed to scrape ZIP ${zipCode} via Edge Function:`, error);
      return [];
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}