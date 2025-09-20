import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();
// Type assertion to fix TypeScript issues
const puppeteerExtra = puppeteer as any;
puppeteerExtra.use(StealthPlugin());

interface JobListing {
  title: string;
  company: string;
  location: string;
  jobUrl: string;
  description?: string;
  salary?: string;
  scrapedAt: Date;
  source: string;
}

interface ErrorLog {
  timestamp: Date;
  level: 'ERROR' | 'WARN' | 'INFO';
  site: string;
  operation: string;
  message: string;
  stack?: string;
  context?: any;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class RobustScraper {
  private browser: any;
  private logFile: string;
  private errorLogFile: string;
  private errors: ErrorLog[] = [];
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  };

  constructor() {
    this.logFile = path.join(process.cwd(), 'robust-scraper.log');
    this.errorLogFile = path.join(process.cwd(), 'scraper-errors.json');
  }

  private log(message: string, level: 'INFO' | 'ERROR' | 'WARN' = 'INFO', site: string = 'SYSTEM', operation: string = 'GENERAL', context?: any) {
    const timestamp = new Date();
    const logMessage = `[${timestamp.toISOString()}] ${level} [${site}] ${operation}: ${message}`;
    
    console.log(logMessage);
    
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
      
      if (level === 'ERROR' || level === 'WARN') {
        const errorLog: ErrorLog = {
          timestamp,
          level,
          site,
          operation,
          message,
          context
        };
        
        this.errors.push(errorLog);
        this.saveErrorLog();
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private saveErrorLog() {
    try {
      fs.writeFileSync(this.errorLogFile, JSON.stringify(this.errors, null, 2));
    } catch (error) {
      console.error('Failed to save error log:', error);
    }
  }

  private async retry<T>(
    operation: () => Promise<T>,
    operationName: string,
    site: string,
    context?: any
  ): Promise<T | null> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        this.log(`Attempt ${attempt}/${this.retryConfig.maxRetries} for ${operationName}`, 'INFO', site, operationName);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
          this.retryConfig.maxDelay
        );
        
        this.log(
          `Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms`,
          'WARN',
          site,
          operationName,
          { attempt, error: lastError.message, context }
        );
        
        if (attempt < this.retryConfig.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    this.log(
      `All ${this.retryConfig.maxRetries} attempts failed for ${operationName}: ${lastError?.message}`,
      'ERROR',
      site,
      operationName,
      { finalError: lastError?.message, context }
    );
    
    return null;
  }

  async initialize(): Promise<boolean> {
    try {
      this.log('Initializing browser...', 'INFO');
      
      this.browser = await puppeteerExtra.launch({ 
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run'
        ]
      });
      
      this.log('Browser initialized successfully', 'INFO');
      return true;
    } catch (error) {
      this.log(`Failed to initialize browser: ${(error as Error).message}`, 'ERROR', 'SYSTEM', 'INIT', { error });
      return false;
    }
  }

  private safeExtractText(element: Element | null, fallback: string = ''): string {
    try {
      return element?.textContent?.trim() || fallback;
    } catch (error) {
      return fallback;
    }
  }

  private safeExtractAttribute(element: Element | null, attribute: string, fallback: string = ''): string {
    try {
      return (element as HTMLElement)?.getAttribute(attribute) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  private safeExtractHref(element: Element | null, baseUrl: string = ''): string | null {
    try {
      if (!element) return null;
      
      const href = (element as HTMLAnchorElement).href || 
                  (element as HTMLAnchorElement).getAttribute('href');
      
      if (!href) return null;
      
      if (href.startsWith('http')) return href;
      if (href.startsWith('/') && baseUrl) return baseUrl + href;
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async scrapeRemoteOKRobust(maxPages: number = 3): Promise<JobListing[]> {
    const siteName = 'RemoteOK';
    const jobs: JobListing[] = [];
    let page: any = null;
    
    try {
      page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const pageJobs = await this.retry(
          async () => await this.scrapeRemoteOKPage(page, pageNum),
          `scrape_page_${pageNum}`,
          siteName,
          { pageNum, maxPages }
        );
        
        if (pageJobs && pageJobs.length > 0) {
          jobs.push(...pageJobs);
          this.log(`Successfully scraped ${pageJobs.length} jobs from page ${pageNum}`, 'INFO', siteName, 'SCRAPE_PAGE');
        } else {
          this.log(`No jobs found on page ${pageNum}, stopping pagination`, 'WARN', siteName, 'SCRAPE_PAGE');
          break;
        }
        
        if (pageNum < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
    } catch (error) {
      this.log(`Critical error in RemoteOK scraping: ${(error as Error).message}`, 'ERROR', siteName, 'SCRAPE_SITE', { error });
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (error) {
          this.log(`Error closing page: ${(error as Error).message}`, 'WARN', siteName, 'CLEANUP');
        }
      }
    }
    
    return jobs;
  }

  private async scrapeRemoteOKPage(page: any, pageNum: number): Promise<JobListing[]> {
    const siteName = 'RemoteOK';
    const url = pageNum === 1 
      ? 'https://remoteok.io/remote-dev-jobs'
      : `https://remoteok.io/remote-dev-jobs?page=${pageNum}`;
    
    this.log(`Navigating to ${url}`, 'INFO', siteName, 'NAVIGATE');
    
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for job listings with timeout
    try {
      await page.waitForSelector('tr.job', { timeout: 10000 });
    } catch (error) {
      throw new Error(`No job listings found on page ${pageNum}`);
    }
    
    // Extract jobs with comprehensive error handling
    const jobs = await page.evaluate((pageNum: number) => {
      const jobRows = document.querySelectorAll('tr.job');
      const jobs: any[] = [];
      const errors: string[] = [];
      
      jobRows.forEach((row: Element, index: number) => {
        try {
          // Safe extraction with fallbacks
          const titleElement = row.querySelector('.company h2');
          const companyElement = row.querySelector('.company h3');
          const locationElement = row.querySelector('.location');
          const linkElement = row.querySelector('a');
          const salaryElement = row.querySelector('.salary');
          
          const title = titleElement?.textContent?.trim() || null;
          const company = companyElement?.textContent?.trim() || null;
          const location = locationElement?.textContent?.trim() || 'Remote';
          const salary = salaryElement?.textContent?.trim() || null;
          
          let jobUrl = null;
          if (linkElement) {
            const href = (linkElement as HTMLAnchorElement).getAttribute('href');
            jobUrl = href ? 'https://remoteok.io' + href : null;
          }
          
          // Validate required fields
          if (!title || !company || !jobUrl) {
            errors.push(`Job ${index + 1}: Missing required fields - title: ${!!title}, company: ${!!company}, jobUrl: ${!!jobUrl}`);
            return;
          }
          
          jobs.push({
            title,
            company,
            location,
            jobUrl,
            salary,
            scrapedAt: new Date(),
            source: 'RemoteOK'
          });
          
        } catch (error) {
          errors.push(`Job ${index + 1}: Extraction error - ${(error as Error).message}`);
        }
      });
      
      return { jobs, errors, totalRows: jobRows.length };
    }, pageNum);
    
    // Log any extraction errors
    if (jobs.errors && jobs.errors.length > 0) {
      jobs.errors.forEach((error: string) => {
        this.log(error, 'WARN', siteName, 'EXTRACT_JOB', { pageNum });
      });
    }
    
    this.log(
      `Extracted ${jobs.jobs.length}/${jobs.totalRows} jobs from page ${pageNum}`,
      'INFO',
      siteName,
      'EXTRACT_PAGE',
      { successCount: jobs.jobs.length, totalRows: jobs.totalRows, errorCount: jobs.errors.length }
    );
    
    return jobs.jobs;
  }

  async scrapeIndeedRobust(query: string, location?: string, maxPages: number = 3): Promise<JobListing[]> {
    const siteName = 'Indeed';
    const jobs: JobListing[] = [];
    let page: any = null;
    
    try {
      page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Set extra headers to avoid detection
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const pageJobs = await this.retry(
          async () => await this.scrapeIndeedPage(page, query, location, pageNum),
          `scrape_page_${pageNum}`,
          siteName,
          { pageNum, query, location }
        );
        
        if (pageJobs && pageJobs.length > 0) {
          jobs.push(...pageJobs);
          this.log(`Successfully scraped ${pageJobs.length} jobs from page ${pageNum}`, 'INFO', siteName, 'SCRAPE_PAGE');
        } else {
          this.log(`No jobs found on page ${pageNum}, stopping pagination`, 'WARN', siteName, 'SCRAPE_PAGE');
          break;
        }
        
        if (pageNum < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
    } catch (error) {
      this.log(`Critical error in Indeed scraping: ${(error as Error).message}`, 'ERROR', siteName, 'SCRAPE_SITE', { error, query, location });
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (error) {
          this.log(`Error closing page: ${(error as Error).message}`, 'WARN', siteName, 'CLEANUP');
        }
      }
    }
    
    return jobs;
  }

  private async scrapeIndeedPage(page: any, query: string, location?: string, pageNum: number = 1): Promise<JobListing[]> {
    const siteName = 'Indeed';
    
    // Build URL with error handling
    const params = new URLSearchParams();
    params.set('q', query);
    if (location) params.set('l', location);
    if (pageNum > 1) params.set('start', ((pageNum - 1) * 10).toString());
    
    const url = `https://www.indeed.com/jobs?${params.toString()}`;
    this.log(`Navigating to ${url}`, 'INFO', siteName, 'NAVIGATE');
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (error) {
      throw new Error(`Failed to navigate to Indeed page: ${(error as Error).message}`);
    }
    
    // Check for CAPTCHA or blocking
    try {
      const captcha = await page.$('.g-recaptcha, #captcha, .captcha');
      if (captcha) {
        throw new Error('CAPTCHA detected - Indeed is blocking requests');
      }
    } catch (error) {
      // Continue if CAPTCHA check fails
    }
    
    // Wait for job listings
    try {
      await page.waitForSelector('[data-jk], .job_seen_beacon', { timeout: 15000 });
    } catch (error) {
      throw new Error(`No job listings found on Indeed page ${pageNum}`);
    }
    
    // Extract jobs with comprehensive error handling
    const jobs = await page.evaluate((pageNum: number) => {
      const jobCards = document.querySelectorAll('[data-jk], .job_seen_beacon');
      const jobs: any[] = [];
      const errors: string[] = [];
      
      jobCards.forEach((card: Element, index: number) => {
        try {
          // Multiple selector fallbacks for Indeed's changing layout
          const titleElement = card.querySelector('h2[data-testid="job-title"] a span') ||
                              card.querySelector('.jobTitle a span') ||
                              card.querySelector('h2 a span[title]');
          
          const companyElement = card.querySelector('[data-testid="company-name"]') ||
                                card.querySelector('.companyName') ||
                                card.querySelector('span[data-testid="company-name"]');
          
          const locationElement = card.querySelector('[data-testid="job-location"]') ||
                                 card.querySelector('.companyLocation') ||
                                 card.querySelector('div[data-testid="job-location"]');
          
          const linkElement = card.querySelector('h2[data-testid="job-title"] a') ||
                             card.querySelector('.jobTitle a') ||
                             card.querySelector('h2 a');
          
          const salaryElement = card.querySelector('.salary-snippet') ||
                               card.querySelector('[data-testid="job-salary"]');
          
          // Safe extraction
          const title = titleElement?.textContent?.trim() || 
                       titleElement?.getAttribute('title')?.trim() || null;
          const company = companyElement?.textContent?.trim() || null;
          const location = locationElement?.textContent?.trim() || 'Not specified';
          const salary = salaryElement?.textContent?.trim() || null;
          
          let jobUrl = null;
          if (linkElement) {
            const href = (linkElement as HTMLAnchorElement).href || 
                        (linkElement as HTMLAnchorElement).getAttribute('href');
            jobUrl = href?.startsWith('http') ? href : 
                    href?.startsWith('/') ? 'https://www.indeed.com' + href : null;
          }
          
          // Validate required fields
          if (!title || !company || !jobUrl) {
            errors.push(`Job ${index + 1}: Missing required fields - title: ${!!title}, company: ${!!company}, jobUrl: ${!!jobUrl}`);
            return;
          }
          
          jobs.push({
            title,
            company,
            location,
            jobUrl,
            salary,
            scrapedAt: new Date(),
            source: 'Indeed'
          });
          
        } catch (error) {
          errors.push(`Job ${index + 1}: Extraction error - ${(error as Error).message}`);
        }
      });
      
      return { jobs, errors, totalCards: jobCards.length };
    }, pageNum);
    
    // Log extraction results
    if (jobs.errors && jobs.errors.length > 0) {
      jobs.errors.forEach((error: string) => {
        this.log(error, 'WARN', siteName, 'EXTRACT_JOB', { pageNum });
      });
    }
    
    this.log(
      `Extracted ${jobs.jobs.length}/${jobs.totalCards} jobs from page ${pageNum}`,
      'INFO',
      siteName,
      'EXTRACT_PAGE',
      { successCount: jobs.jobs.length, totalCards: jobs.totalCards, errorCount: jobs.errors.length }
    );
    
    return jobs.jobs;
  }

  async saveToDatabase(jobs: JobListing[]): Promise<boolean> {
    if (jobs.length === 0) {
      this.log('No jobs to save to database', 'WARN', 'DATABASE', 'SAVE');
      return false;
    }
    
    const saveOperation = async () => {
      const MONGODB_URI = process.env.MONGODB_URI;
      
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      
      const db = client.db('jobnest');
      const collection = db.collection('raw_jobs');
      
      const operations = jobs.map(job => ({
        updateOne: {
          filter: { jobUrl: job.jobUrl },
          update: { $set: job },
          upsert: true
        }
      }));
      
      const result = await collection.bulkWrite(operations);
      await client.close();
      
      return result;
    };
    
    const result = await this.retry(
      saveOperation,
      'save_to_database',
      'DATABASE',
      { jobCount: jobs.length }
    );
    
    if (result) {
      this.log(
        `Database save successful: ${result.upsertedCount} new, ${result.modifiedCount} updated`,
        'INFO',
        'DATABASE',
        'SAVE',
        { upserted: result.upsertedCount, modified: result.modifiedCount }
      );
      return true;
    } else {
      // Fallback to JSON
      try {
        const filename = `robust-jobs_${new Date().toISOString().split('T')[0]}.json`;
        const organizedJobs = jobs.reduce((acc: any, job) => {
          if (!acc[job.source]) acc[job.source] = [];
          acc[job.source].push(job);
          return acc;
        }, {});
        
        fs.writeFileSync(filename, JSON.stringify(organizedJobs, null, 2));
        this.log(`Fallback: Jobs saved to ${filename}`, 'WARN', 'DATABASE', 'FALLBACK_SAVE');
        return true;
      } catch (error) {
        this.log(`Fallback save failed: ${(error as Error).message}`, 'ERROR', 'DATABASE', 'FALLBACK_SAVE');
        return false;
      }
    }
  }

  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.log('Browser closed successfully', 'INFO', 'SYSTEM', 'CLEANUP');
      }
    } catch (error) {
      this.log(`Error during cleanup: ${(error as Error).message}`, 'ERROR', 'SYSTEM', 'CLEANUP');
    }
    
    // Save final error report
    if (this.errors.length > 0) {
      this.saveErrorLog();
      this.log(`Session completed with ${this.errors.length} errors/warnings logged`, 'INFO', 'SYSTEM', 'SUMMARY');
    }
  }

  async run(query: string, location?: string) {
    const startTime = Date.now();
    
    try {
      this.log(`Starting robust scraping session for query: "${query}", location: "${location || 'Any'}"`, 'INFO', 'SYSTEM', 'START');
      
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize browser');
      }
      
      const allJobs: JobListing[] = [];
      
      // Scrape RemoteOK (most reliable)
      this.log('Starting RemoteOK scraping...', 'INFO', 'SYSTEM', 'SITE_START');
      const remoteOKJobs = await this.scrapeRemoteOKRobust(3);
      allJobs.push(...remoteOKJobs);
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Scrape Indeed
      this.log('Starting Indeed scraping...', 'INFO', 'SYSTEM', 'SITE_START');
      const indeedJobs = await this.scrapeIndeedRobust(query, location, 2);
      allJobs.push(...indeedJobs);
      
      // Save results
      const saved = await this.saveToDatabase(allJobs);
      
      // Generate summary
      const summary = allJobs.reduce((acc: any, job) => {
        acc[job.source] = (acc[job.source] || 0) + 1;
        return acc;
      }, {});
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      this.log('=== ROBUST SCRAPING SUMMARY ===', 'INFO', 'SYSTEM', 'SUMMARY');
      Object.entries(summary).forEach(([source, count]) => {
        this.log(`${source}: ${count} jobs`, 'INFO', 'SYSTEM', 'SUMMARY');
      });
      this.log(`Total jobs: ${allJobs.length}`, 'INFO', 'SYSTEM', 'SUMMARY');
      this.log(`Duration: ${duration}s`, 'INFO', 'SYSTEM', 'SUMMARY');
      this.log(`Errors/Warnings: ${this.errors.length}`, 'INFO', 'SYSTEM', 'SUMMARY');
      this.log(`Database save: ${saved ? 'SUCCESS' : 'FAILED'}`, 'INFO', 'SYSTEM', 'SUMMARY');
      
    } catch (error) {
      this.log(`Critical scraping failure: ${(error as Error).message}`, 'ERROR', 'SYSTEM', 'CRITICAL_FAILURE', { error });
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the scraper
(async () => {
  const scraper = new RobustScraper();
  
  try {
    await scraper.run('software developer', 'New York, NY');
  } catch (error) {
    console.error('Scraper execution failed:', error);
    process.exit(1);
  }
})();
