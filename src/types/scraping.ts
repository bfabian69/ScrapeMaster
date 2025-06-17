export interface PowerSetterData {
  id?: number;
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

export interface ScrapingJob {
  id: string;
  url: string;
  status: 'running' | 'completed' | 'paused' | 'error';
  progress: number;
  itemsScraped: number;
  startTime: string;
  zipCodes?: string[];
  dataType?: 'powersetter' | 'general';
}

export interface ScrapingConfig {
  zipCodes: string[];
  delayBetweenRequests: number;
  maxRetries: number;
  headless: boolean;
}