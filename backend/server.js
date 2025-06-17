const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { Client } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Default utilities mapping
const defaultUtilities = {
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

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'db.apermcjpipcaffwbykll.supabase.co',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'tey5aYqyxGRnctPB',
  ssl: { rejectUnauthorized: false }
};

// Create database connection
async function getDbConnection() {
  const client = new Client(dbConfig);
  await client.connect();
  return client;
}

// Scrape a single ZIP code
async function scrapeZipCode(zipCode, browser) {
  console.log(`🔍 Scraping ZIP ${zipCode} from PowerSetter.com`);
  
  const page = await browser.newPage();
  
  try {
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to PowerSetter homepage
    await page.goto('https://www.powersetter.com/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for and click the ZIP code modal trigger
    await page.waitForSelector('[data-modal="#zipFormModal"]', { timeout: 10000 });
    await page.click('[data-modal="#zipFormModal"]');
    
    // Wait for modal to appear and enter ZIP code
    await page.waitForSelector('#zipFormModal', { visible: true, timeout: 10000 });
    await page.waitForSelector('#zipFormModal input#zip', { timeout: 5000 });
    
    // Clear and enter ZIP code
    await page.evaluate(() => {
      const zipInput = document.querySelector('#zipFormModal input#zip');
      if (zipInput) {
        zipInput.value = '';
      }
    });
    await page.type('#zipFormModal input#zip', zipCode);
    
    // Click Compare Rates button
    await page.waitForSelector('#zipFormModal button:contains("Compare Rates")', { timeout: 5000 });
    await page.click('#zipFormModal button');
    
    // Wait for results to load
    await page.waitForSelector('[id*="ratesTable"]', { timeout: 15000 });
    await page.waitForTimeout(3000); // Additional wait for dynamic content
    
    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const utility = defaultUtilities[zipCode] || "Unknown Utility";
    const results = [];
    
    // Find and parse rate cards
    const ratesTable = $('.rates-table');
    if (ratesTable.length === 0) {
      console.log(`❌ No rates table found for ZIP ${zipCode}`);
      return results;
    }
    
    const cards = ratesTable.find('.card').slice(0, 5); // Limit to first 5 cards
    
    cards.each((index, card) => {
      const $card = $(card);
      
      // Extract price per kWh
      const priceText = $card.find('.price').text().trim();
      const priceMatch = priceText.match(/(\d+\.\d+)¢/);
      if (!priceMatch) return; // Skip if no price found
      
      const pricePerKwh = parseFloat(priceMatch[1]);
      
      // Extract other fields
      const fee = $card.attr('data-fee') || '';
      const feeText = fee && fee !== '0' ? `$${fee}` : '';
      
      const savings = $card.find('.persent').text().trim() || '';
      const terms = $card.find('.term').text().trim() || '';
      const info = $card.find('.more-info-button').attr('data-encoded-contents') || '';
      const green = $card.find('.green').text().trim() || 'N';
      
      // Extract supplier logo URL
      const logoImg = $card.find('.logo img');
      let supplierLogoUrl = '';
      if (logoImg.length > 0) {
        const src = logoImg.attr('src');
        if (src) {
          if (src.startsWith('/')) {
            supplierLogoUrl = `https://www.powersetter.com${src}`;
          } else if (!src.startsWith('http')) {
            supplierLogoUrl = `https://www.powersetter.com/${src}`;
          } else {
            supplierLogoUrl = src;
          }
        }
      }
      
      // Extract signup URL
      const signupBtn = $card.find('.button-redirect');
      const signupUrl = signupBtn.attr('data-redirect') || '';
      
      const record = {
        zip_code: zipCode,
        price_per_kwh: pricePerKwh,
        savings: savings,
        terms: terms,
        info: info,
        green: green,
        supplier_logo_url: supplierLogoUrl,
        signup_url: signupUrl,
        utility: utility,
        fee: feeText,
        scraped_at: new Date().toISOString()
      };
      
      results.push(record);
    });
    
    console.log(`✅ Successfully scraped ${results.length} records for ZIP ${zipCode}`);
    return results;
    
  } catch (error) {
    console.error(`❌ Error scraping ZIP ${zipCode}:`, error.message);
    return [];
  } finally {
    await page.close();
  }
}

// API endpoint to start scraping
app.post('/api/scrape', async (req, res) => {
  try {
    const { zipCodes, delayBetweenRequests = 5000, headless = true } = req.body;
    
    if (!zipCodes || zipCodes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No ZIP codes provided' 
      });
    }
    
    console.log(`🚀 Starting PowerSetter scraping for ${zipCodes.length} ZIP codes`);
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    // Setup database connection
    const client = await getDbConnection();
    
    let allRecords = [];
    
    try {
      // Process each ZIP code
      for (let i = 0; i < zipCodes.length; i++) {
        const zipCode = zipCodes[i];
        console.log(`📍 Processing ZIP ${zipCode} (${i + 1}/${zipCodes.length})`);
        
        const records = await scrapeZipCode(zipCode, browser);
        
        if (records.length > 0) {
          // Insert records into database
          for (const record of records) {
            const insertQuery = `
              INSERT INTO powersetter (
                zip_code, price_per_kwh, savings, terms, info, green,
                supplier_logo_url, signup_url, utility, fee, scraped_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;
            
            await client.query(insertQuery, [
              record.zip_code,
              record.price_per_kwh,
              record.savings,
              record.terms,
              record.info,
              record.green,
              record.supplier_logo_url,
              record.signup_url,
              record.utility,
              record.fee,
              record.scraped_at
            ]);
          }
          
          allRecords.push(...records);
          console.log(`💾 Stored ${records.length} records for ZIP ${zipCode}`);
        }
        
        // Add delay between requests (except for the last one)
        if (i < zipCodes.length - 1) {
          console.log(`⏳ Waiting ${delayBetweenRequests}ms before next ZIP...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
        }
      }
      
    } finally {
      await browser.close();
      await client.end();
    }
    
    console.log(`🎉 Scraping completed! Total records: ${allRecords.length}`);
    
    res.json({
      success: true,
      message: `Successfully scraped ${allRecords.length} records from ${zipCodes.length} ZIP codes`,
      recordCount: allRecords.length,
      zipCodes: zipCodes
    });
    
  } catch (error) {
    console.error('❌ Scraping error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'PowerSetter Node.js scraper API is running',
    timestamp: new Date().toISOString()
  });
});

// Initialize database table
async function initializeDatabase() {
  try {
    const client = await getDbConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS powersetter (
        id SERIAL PRIMARY KEY,
        zip_code TEXT,
        price_per_kwh NUMERIC(10, 4),
        savings TEXT,
        terms TEXT,
        info TEXT,
        green TEXT,
        supplier_logo_url TEXT,
        signup_url TEXT,
        utility TEXT,
        fee TEXT,
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await client.query(createTableQuery);
    await client.end();
    
    console.log('✅ Database table verified/created successfully');
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
  }
}

// Start server
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 PowerSetter Node.js Backend running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 Scraping endpoint: POST http://localhost:${PORT}/api/scrape`);
  });
}

startServer().catch(console.error);