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
  "07083": "Public Service Electric & Gas (PSEG)",
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
    
    for (let i = 0; i < totalZipCodes; i++) {
      const zipCode = this.config.zipCodes[i];
      
      try {
        // Simulate scraping process with realistic delays
        await this.delay(this.config.delayBetweenRequests);
        
        const scrapedData = await this.scrapeZipCode(zipCode);
        results.push(...scrapedData);
        
        // Store data in Supabase immediately after scraping each ZIP
        if (scrapedData.length > 0) {
          try {
            await insertPowerSetterData(scrapedData);
            console.log(`Stored ${scrapedData.length} records for ZIP ${zipCode}`);
          } catch (error) {
            console.error(`Failed to store data for ZIP ${zipCode}:`, error);
          }
        }
        
        // Update progress
        const progress = Math.round(((i + 1) / totalZipCodes) * 100);
        const itemsScraped = results.length;
        
        if (this.onProgress) {
          this.onProgress(progress, itemsScraped);
        }
        
      } catch (error) {
        console.error(`Error scraping ZIP ${zipCode}:`, error);
        // Continue with next ZIP code even if one fails
      }
    }
    
    return results;
  }

  private async scrapeZipCode(zipCode: string): Promise<PowerSetterData[]> {
    // This simulates the scraping logic from your Python script
    // In a real implementation, this would call your actual scraping logic
    
    const utility = defaultUtilities[zipCode] || "Unknown Utility";
    const mockData: PowerSetterData[] = [];
    
    // Simulate 3-5 plans per ZIP code (matching your Python script)
    const planCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < planCount; i++) {
      mockData.push({
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
    
    return mockData;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}