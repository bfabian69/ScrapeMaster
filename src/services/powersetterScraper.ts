import { PowerSetterData, ScrapingConfig } from '../types/scraping';
import { insertPowerSetterData } from './supabase';

// Default utilities mapping from your Node.js script
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
    console.log(`🚀 Starting REAL PowerSetter scraping for ${this.config.zipCodes.length} ZIP codes via Node.js backend`);
    
    try {
      // Call the Node.js backend API
      const response = await fetch('http://localhost:5000/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCodes: this.config.zipCodes,
          delayBetweenRequests: this.config.delayBetweenRequests,
          maxRetries: this.config.maxRetries,
          headless: this.config.headless
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Successfully scraped ${result.recordCount} records from Node.js backend`);
        
        // Update progress to 100% since the backend handles the actual scraping
        if (this.onProgress) {
          this.onProgress(100, result.recordCount);
        }
        
        // The Node.js backend already inserted the data into the database,
        // so we don't need to call insertPowerSetterData here
        
        return []; // Return empty array since data is already in database
      } else {
        throw new Error(`Backend scraping failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ Node.js backend scraping failed:', error);
      
      // Check if it's a connection error to the backend
      if (error.message.includes('fetch')) {
        throw new Error('Cannot connect to Node.js backend. Please ensure the backend server is running on http://localhost:5000');
      }
      
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}