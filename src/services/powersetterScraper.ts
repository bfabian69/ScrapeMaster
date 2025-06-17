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
    
    // Sample supplier logos that would be extracted from div.col-logo
    const supplierLogos = [
      "https://www.powersetter.com/images/suppliers/constellation-logo.png",
      "https://www.powersetter.com/images/suppliers/direct-energy-logo.png", 
      "https://www.powersetter.com/images/suppliers/green-mountain-logo.png",
      "https://www.powersetter.com/images/suppliers/nrg-logo.png",
      "https://www.powersetter.com/images/suppliers/reliant-logo.png",
      "https://www.powersetter.com/images/suppliers/txu-energy-logo.png",
      "https://www.powersetter.com/images/suppliers/vistra-logo.png",
      "https://www.powersetter.com/images/suppliers/ambit-energy-logo.png"
    ];
    
    for (let i = 0; i < planCount; i++) {
      // Simulate extracting supplier logo from div.col-logo
      const logoUrl = supplierLogos[Math.floor(Math.random() * supplierLogos.length)];
      
      mockData.push({
        zip_code: zipCode,
        price_per_kwh: parseFloat((Math.random() * 5 + 8).toFixed(4)), // 8-13 cents
        savings: `${Math.floor(Math.random() * 30 + 10)}%`,
        terms: `${Math.floor(Math.random() * 24 + 12)} months`,
        info: `Plan ${i + 1} details for ${utility}`,
        green: Math.random() > 0.5 ? "100% Green" : "N",
        supplier_logo_url: logoUrl, // This would be extracted from div.col-logo
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

  // Method to extract supplier logo from PowerSetter HTML structure
  private extractSupplierLogo(htmlElement: any): string {
    try {
      // Look for the logo in div.col-logo
      const logoDiv = htmlElement.querySelector('div.col-logo');
      if (logoDiv) {
        // Check for img tag within the logo div
        const imgTag = logoDiv.querySelector('img');
        if (imgTag) {
          const src = imgTag.getAttribute('src');
          if (src) {
            // Handle relative URLs by making them absolute
            if (src.startsWith('/')) {
              return `https://www.powersetter.com${src}`;
            } else if (src.startsWith('http')) {
              return src;
            } else {
              return `https://www.powersetter.com/${src}`;
            }
          }
        }
        
        // Check for background-image in style attribute
        const style = logoDiv.getAttribute('style');
        if (style) {
          const bgImageMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
          if (bgImageMatch && bgImageMatch[1]) {
            const bgImage = bgImageMatch[1];
            if (bgImage.startsWith('/')) {
              return `https://www.powersetter.com${bgImage}`;
            } else if (bgImage.startsWith('http')) {
              return bgImage;
            } else {
              return `https://www.powersetter.com/${bgImage}`;
            }
          }
        }
        
        // Check for data-src attribute (lazy loading)
        const dataSrc = logoDiv.querySelector('img[data-src]');
        if (dataSrc) {
          const src = dataSrc.getAttribute('data-src');
          if (src) {
            if (src.startsWith('/')) {
              return `https://www.powersetter.com${src}`;
            } else if (src.startsWith('http')) {
              return src;
            } else {
              return `https://www.powersetter.com/${src}`;
            }
          }
        }
      }
      
      return ''; // Return empty string if no logo found
    } catch (error) {
      console.error('Error extracting supplier logo:', error);
      return '';
    }
  }
}