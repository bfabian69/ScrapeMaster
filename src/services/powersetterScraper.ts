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
    
    console.log(`🚀 Starting PowerSetter scraping for ${totalZipCodes} ZIP codes`);
    
    for (let i = 0; i < totalZipCodes; i++) {
      const zipCode = this.config.zipCodes[i];
      
      try {
        console.log(`📍 Processing ZIP code ${zipCode} (${i + 1}/${totalZipCodes})`);
        
        // Add delay between requests to avoid rate limiting
        if (i > 0) {
          console.log(`⏱️ Waiting ${this.config.delayBetweenRequests}ms before next request...`);
          await this.delay(this.config.delayBetweenRequests);
        }
        
        const scrapedData = await this.scrapeZipCode(zipCode);
        
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
            const retryData = await this.scrapeZipCode(zipCode);
            
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

  private async scrapeZipCode(zipCode: string): Promise<PowerSetterData[]> {
    console.log(`🔍 Scraping PowerSetter for ZIP code: ${zipCode}`);
    
    try {
      // Construct the PowerSetter URL for this ZIP code
      const url = `https://www.powersetter.com/results?zip=${zipCode}`;
      console.log(`📡 Fetching: ${url}`);
      
      // Fetch the page
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log(`📄 Received HTML response (${html.length} characters)`);
      
      // Parse the HTML and extract data
      const extractedData = this.parseHTML(html, zipCode);
      
      if (extractedData.length === 0) {
        console.warn(`⚠️ No data extracted from HTML for ZIP ${zipCode}`);
        console.log('HTML preview:', html.substring(0, 500) + '...');
      }
      
      return extractedData;
      
    } catch (error) {
      console.error(`❌ Failed to scrape ZIP ${zipCode}:`, error);
      
      // If real scraping fails, return empty array instead of mock data
      // This ensures we only get real data in the database
      return [];
    }
  }

  private parseHTML(html: string, zipCode: string): PowerSetterData[] {
    console.log(`🔧 Parsing HTML for ZIP ${zipCode}`);
    
    try {
      // Create a DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const results: PowerSetterData[] = [];
      const utility = defaultUtilities[zipCode] || "Unknown Utility";
      
      // Look for result rows - PowerSetter typically uses table rows or div containers
      const resultSelectors = [
        'tr.result-row',
        '.result-row',
        '.plan-row',
        '.rate-row',
        'tbody tr',
        '.results-table tr',
        '[data-plan]',
        '.plan-container'
      ];
      
      let resultElements: NodeListOf<Element> | null = null;
      
      // Try different selectors to find the results
      for (const selector of resultSelectors) {
        resultElements = doc.querySelectorAll(selector);
        if (resultElements.length > 0) {
          console.log(`✅ Found ${resultElements.length} results using selector: ${selector}`);
          break;
        }
      }
      
      if (!resultElements || resultElements.length === 0) {
        console.warn(`⚠️ No result elements found with any selector`);
        
        // Log some debug info about the page structure
        const bodyText = doc.body?.textContent?.substring(0, 200) || 'No body content';
        console.log('Page body preview:', bodyText);
        
        // Look for any tables or structured content
        const tables = doc.querySelectorAll('table');
        const divs = doc.querySelectorAll('div[class*="result"], div[class*="plan"], div[class*="rate"]');
        console.log(`Found ${tables.length} tables and ${divs.length} potential result divs`);
        
        return [];
      }
      
      // Process each result element
      resultElements.forEach((element, index) => {
        try {
          console.log(`🔍 Processing result element ${index + 1}`);
          
          const planData = this.extractPlanData(element, zipCode, utility);
          if (planData) {
            results.push(planData);
            console.log(`✅ Extracted plan ${index + 1}: ${planData.price_per_kwh}¢/kWh`);
          } else {
            console.warn(`⚠️ Failed to extract data from result element ${index + 1}`);
          }
        } catch (error) {
          console.error(`❌ Error processing result element ${index + 1}:`, error);
        }
      });
      
      console.log(`📊 Extracted ${results.length} plans for ZIP ${zipCode}`);
      return results;
      
    } catch (error) {
      console.error(`❌ Error parsing HTML for ZIP ${zipCode}:`, error);
      return [];
    }
  }

  private extractPlanData(element: Element, zipCode: string, utility: string): PowerSetterData | null {
    try {
      // Extract price per kWh
      const priceSelectors = [
        '.price',
        '.rate',
        '.cost',
        '[class*="price"]',
        '[class*="rate"]',
        '[class*="cost"]',
        'td:nth-child(2)', // Common position for price in tables
        '.col-price',
        '.price-value'
      ];
      
      let priceText = '';
      for (const selector of priceSelectors) {
        const priceElement = element.querySelector(selector);
        if (priceElement) {
          priceText = priceElement.textContent?.trim() || '';
          if (priceText) break;
        }
      }
      
      // Extract numeric price
      const priceMatch = priceText.match(/(\d+\.?\d*)/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
      
      if (price === 0) {
        console.warn('⚠️ No valid price found in element');
        return null;
      }
      
      // Extract supplier logo from div.col-logo
      const supplierLogo = this.extractSupplierLogo(element);
      
      // Extract terms
      const termsSelectors = [
        '.terms',
        '.contract',
        '.duration',
        '[class*="term"]',
        '[class*="contract"]',
        '[class*="duration"]',
        'td:nth-child(3)', // Common position for terms
        '.col-terms'
      ];
      
      let terms = '';
      for (const selector of termsSelectors) {
        const termsElement = element.querySelector(selector);
        if (termsElement) {
          terms = termsElement.textContent?.trim() || '';
          if (terms) break;
        }
      }
      
      // Extract green/renewable info
      const greenSelectors = [
        '.green',
        '.renewable',
        '.eco',
        '[class*="green"]',
        '[class*="renewable"]',
        '[class*="eco"]',
        '.col-green'
      ];
      
      let green = 'N';
      for (const selector of greenSelectors) {
        const greenElement = element.querySelector(selector);
        if (greenElement) {
          const greenText = greenElement.textContent?.trim() || '';
          if (greenText && greenText.toLowerCase() !== 'n' && greenText.toLowerCase() !== 'no') {
            green = greenText;
            break;
          }
        }
      }
      
      // Extract signup URL
      const signupSelectors = [
        'a[href*="signup"]',
        'a[href*="enroll"]',
        'a[href*="apply"]',
        '.signup-link',
        '.enroll-link',
        '.apply-link'
      ];
      
      let signupUrl = '';
      for (const selector of signupSelectors) {
        const signupElement = element.querySelector(selector);
        if (signupElement) {
          signupUrl = signupElement.getAttribute('href') || '';
          if (signupUrl) {
            signupUrl = this.normalizeUrl(signupUrl);
            break;
          }
        }
      }
      
      // Extract fee information
      const feeSelectors = [
        '.fee',
        '.fees',
        '.cost',
        '[class*="fee"]',
        '.col-fee'
      ];
      
      let fee = '';
      for (const selector of feeSelectors) {
        const feeElement = element.querySelector(selector);
        if (feeElement) {
          const feeText = feeElement.textContent?.trim() || '';
          if (feeText && !feeText.toLowerCase().includes('no fee')) {
            fee = feeText;
            break;
          }
        }
      }
      
      // Extract savings information
      const savingsSelectors = [
        '.savings',
        '.save',
        '[class*="saving"]',
        '[class*="save"]',
        '.col-savings'
      ];
      
      let savings = '';
      for (const selector of savingsSelectors) {
        const savingsElement = element.querySelector(selector);
        if (savingsElement) {
          savings = savingsElement.textContent?.trim() || '';
          if (savings) break;
        }
      }
      
      // Create the plan data object
      const planData: PowerSetterData = {
        zip_code: zipCode,
        price_per_kwh: price,
        savings: savings || '',
        terms: terms || 'Not specified',
        info: `Plan extracted from PowerSetter for ${utility}`,
        green: green,
        supplier_logo_url: supplierLogo,
        signup_url: signupUrl,
        utility: utility,
        fee: fee || '',
        scraped_at: new Date().toISOString()
      };
      
      return planData;
      
    } catch (error) {
      console.error('❌ Error extracting plan data:', error);
      return null;
    }
  }

  // Method to extract supplier logo from PowerSetter HTML structure
  private extractSupplierLogo(element: Element): string {
    try {
      console.log('🔍 Extracting supplier logo from element...');
      
      // Look for the logo in div.col-logo (PowerSetter structure)
      const logoDiv = element.querySelector('div.col-logo');
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
            return this.normalizeUrl(src);
          }
          
          // Check data-src attribute (lazy loading)
          const dataSrc = imgTag.getAttribute('data-src');
          if (dataSrc && dataSrc.trim()) {
            console.log('🎯 Found data-src attribute:', dataSrc);
            return this.normalizeUrl(dataSrc);
          }
          
          // Check data-original attribute (another lazy loading pattern)
          const dataOriginal = imgTag.getAttribute('data-original');
          if (dataOriginal && dataOriginal.trim()) {
            console.log('🎯 Found data-original attribute:', dataOriginal);
            return this.normalizeUrl(dataOriginal);
          }
        }
        
        // Method 2: Check for background-image in style attribute
        const style = logoDiv.getAttribute('style');
        if (style) {
          console.log('🎨 Checking style attribute for background-image');
          const bgImageMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
          if (bgImageMatch && bgImageMatch[1]) {
            console.log('🎯 Found background-image:', bgImageMatch[1]);
            return this.normalizeUrl(bgImageMatch[1]);
          }
        }
        
        // Method 3: Look for nested elements with logo classes
        const logoImg = logoDiv.querySelector('img[class*="logo"], img[class*="supplier"], .logo img, .supplier-logo img');
        if (logoImg) {
          const src = logoImg.getAttribute('src') || logoImg.getAttribute('data-src');
          if (src) {
            console.log('🎯 Found nested logo image:', src);
            return this.normalizeUrl(src);
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
          'img[src*="supplier" i]',
          '.col-supplier img',
          '.supplier img'
        ];
        
        for (const selector of fallbackSelectors) {
          const fallbackImg = element.querySelector(selector);
          if (fallbackImg) {
            const src = fallbackImg.getAttribute('src') || fallbackImg.getAttribute('data-src');
            if (src) {
              console.log(`🔄 Found logo using fallback selector "${selector}":`, src);
              return this.normalizeUrl(src);
            }
          }
        }
      }
      
      console.log('❌ No supplier logo found in element');
      return ''; // Return empty string if no logo found
    } catch (error) {
      console.error('❌ Error extracting supplier logo:', error);
      return '';
    }
  }

  // Helper method to normalize URLs
  private normalizeUrl(url: string): string {
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}