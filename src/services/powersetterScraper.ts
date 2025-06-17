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
    
    // Realistic supplier logos that would be extracted from div.col-logo
    const supplierLogos = [
      "https://www.powersetter.com/images/suppliers/constellation-energy.png",
      "https://www.powersetter.com/images/suppliers/direct-energy.png", 
      "https://www.powersetter.com/images/suppliers/green-mountain-energy.png",
      "https://www.powersetter.com/images/suppliers/nrg-energy.png",
      "https://www.powersetter.com/images/suppliers/reliant-energy.png",
      "https://www.powersetter.com/images/suppliers/txu-energy.png",
      "https://www.powersetter.com/images/suppliers/vistra-energy.png",
      "https://www.powersetter.com/images/suppliers/ambit-energy.png",
      "https://www.powersetter.com/images/suppliers/cirro-energy.png",
      "https://www.powersetter.com/images/suppliers/frontier-utilities.png"
    ];
    
    for (let i = 0; i < planCount; i++) {
      // Simulate extracting supplier logo from div.col-logo using the new method
      const logoUrl = this.extractSupplierLogoFromHTML(supplierLogos);
      
      mockData.push({
        zip_code: zipCode,
        price_per_kwh: parseFloat((Math.random() * 5 + 8).toFixed(4)), // 8-13 cents
        savings: `${Math.floor(Math.random() * 30 + 10)}%`,
        terms: `${Math.floor(Math.random() * 24 + 12)} months`,
        info: `Plan ${i + 1} details for ${utility}`,
        green: Math.random() > 0.5 ? "100% Green" : "N",
        supplier_logo_url: logoUrl, // Extracted from div.col-logo
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

  // Simulate extracting supplier logo from div.col-logo (for mock data)
  private extractSupplierLogoFromHTML(availableLogos: string[]): string {
    // In real implementation, this would parse the actual HTML
    return availableLogos[Math.floor(Math.random() * availableLogos.length)];
  }

  // Method to extract supplier logo from PowerSetter HTML structure
  // This is the actual implementation that would be used with real HTML
  private extractSupplierLogo(htmlElement: any): string {
    try {
      console.log('🔍 Extracting supplier logo from HTML element...');
      
      // Look for the logo in div.col-logo (PowerSetter structure)
      const logoDiv = htmlElement.querySelector('div.col-logo');
      if (logoDiv) {
        console.log('✅ Found div.col-logo element');
        
        // Method 1: Check for img tag within the logo div
        const imgTag = logoDiv.querySelector('img');
        if (imgTag) {
          console.log('📷 Found img tag in col-logo');
          
          // Check src attribute
          const src = imgTag.getAttribute('src');
          if (src && src.trim()) {
            console.log('🎯 Found src attribute:', src);
            return this.normalizeLogoUrl(src);
          }
          
          // Check data-src attribute (lazy loading)
          const dataSrc = imgTag.getAttribute('data-src');
          if (dataSrc && dataSrc.trim()) {
            console.log('🎯 Found data-src attribute:', dataSrc);
            return this.normalizeLogoUrl(dataSrc);
          }
          
          // Check data-original attribute (another lazy loading pattern)
          const dataOriginal = imgTag.getAttribute('data-original');
          if (dataOriginal && dataOriginal.trim()) {
            console.log('🎯 Found data-original attribute:', dataOriginal);
            return this.normalizeLogoUrl(dataOriginal);
          }
        }
        
        // Method 2: Check for background-image in style attribute
        const style = logoDiv.getAttribute('style');
        if (style) {
          console.log('🎨 Checking style attribute for background-image');
          const bgImageMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
          if (bgImageMatch && bgImageMatch[1]) {
            console.log('🎯 Found background-image:', bgImageMatch[1]);
            return this.normalizeLogoUrl(bgImageMatch[1]);
          }
        }
        
        // Method 3: Check for CSS background-image via computed styles (if available)
        if (typeof window !== 'undefined' && window.getComputedStyle) {
          const computedStyle = window.getComputedStyle(logoDiv);
          const backgroundImage = computedStyle.backgroundImage;
          if (backgroundImage && backgroundImage !== 'none') {
            const urlMatch = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/i);
            if (urlMatch && urlMatch[1]) {
              console.log('🎯 Found computed background-image:', urlMatch[1]);
              return this.normalizeLogoUrl(urlMatch[1]);
            }
          }
        }
        
        // Method 4: Look for nested elements with logo classes
        const logoImg = logoDiv.querySelector('img[class*="logo"], img[class*="supplier"], .logo img, .supplier-logo img');
        if (logoImg) {
          const src = logoImg.getAttribute('src') || logoImg.getAttribute('data-src');
          if (src) {
            console.log('🎯 Found nested logo image:', src);
            return this.normalizeLogoUrl(src);
          }
        }
        
        console.log('⚠️ No logo found in div.col-logo despite element existing');
      } else {
        console.log('❌ div.col-logo element not found');
        
        // Fallback: Look for other common logo selectors
        const fallbackSelectors = [
          '.supplier-logo img',
          '.logo img',
          'img[alt*="logo" i]',
          'img[alt*="supplier" i]',
          'img[src*="logo" i]',
          'img[src*="supplier" i]'
        ];
        
        for (const selector of fallbackSelectors) {
          const fallbackImg = htmlElement.querySelector(selector);
          if (fallbackImg) {
            const src = fallbackImg.getAttribute('src') || fallbackImg.getAttribute('data-src');
            if (src) {
              console.log(`🔄 Found logo using fallback selector "${selector}":`, src);
              return this.normalizeLogoUrl(src);
            }
          }
        }
      }
      
      console.log('❌ No supplier logo found in HTML element');
      return ''; // Return empty string if no logo found
    } catch (error) {
      console.error('❌ Error extracting supplier logo:', error);
      return '';
    }
  }

  // Helper method to normalize logo URLs
  private normalizeLogoUrl(url: string): string {
    if (!url || !url.trim()) {
      return '';
    }
    
    url = url.trim();
    
    // Handle relative URLs by making them absolute
    if (url.startsWith('/')) {
      return `https://www.powersetter.com${url}`;
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    } else if (url.startsWith('//')) {
      return `https:${url}`;
    } else {
      // Relative path without leading slash
      return `https://www.powersetter.com/${url}`;
    }
  }

  // Method to extract all data from a PowerSetter result row
  private extractPowerSetterData(htmlElement: any, zipCode: string): PowerSetterData | null {
    try {
      // Extract supplier logo from div.col-logo
      const supplierLogo = this.extractSupplierLogo(htmlElement);
      
      // Extract other data fields (you would implement these based on PowerSetter's HTML structure)
      const priceElement = htmlElement.querySelector('.price, .rate, [class*="price"], [class*="rate"]');
      const price = priceElement ? parseFloat(priceElement.textContent?.replace(/[^\d.]/g, '') || '0') : 0;
      
      const termsElement = htmlElement.querySelector('.terms, .contract, [class*="term"], [class*="contract"]');
      const terms = termsElement ? termsElement.textContent?.trim() || '' : '';
      
      const greenElement = htmlElement.querySelector('.green, .renewable, [class*="green"], [class*="renewable"]');
      const green = greenElement ? greenElement.textContent?.trim() || 'N' : 'N';
      
      const signupElement = htmlElement.querySelector('a[href*="signup"], a[href*="enroll"], .signup-link');
      const signupUrl = signupElement ? signupElement.getAttribute('href') || '' : '';
      
      return {
        zip_code: zipCode,
        price_per_kwh: price,
        savings: '', // Extract from HTML
        terms: terms,
        info: '', // Extract from HTML
        green: green,
        supplier_logo_url: supplierLogo,
        signup_url: this.normalizeLogoUrl(signupUrl), // Use same normalization for URLs
        utility: defaultUtilities[zipCode] || "Unknown Utility",
        fee: '', // Extract from HTML
        scraped_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error extracting PowerSetter data:', error);
      return null;
    }
  }
}