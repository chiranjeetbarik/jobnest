import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Type assertion to fix TypeScript issues
const puppeteerExtra = puppeteer as any;
puppeteerExtra.use(StealthPlugin());
import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Import site-specific scrapers
import { IndeedScraper } from './sites/indeed-scraper.js';
import { GlassdoorScraper } from './sites/glassdoor-scraper.js';
import { LinkedInScraper } from './sites/linkedin-scraper.js';
import { JobListing } from './sites/base-scraper.js';

// Load environment variables
dotenv.config();

interface ScrapingConfig {
  query: string;
  location?: string;
  sites: string[];
  maxPagesPerSite: number;
  includeDescriptions: boolean;
}

class MultiSiteScraper {
  private browser: any;
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'multi-scraper.log');
  }

  private log(message: string, level: 'INFO' | 'ERROR' | 'WARN' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;
    
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async initialize() {
    try {
      this.log('Initializing browser for multi-site scraping...');
      this.browser = await puppeteerExtra.launch({ 
        headless: true,
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
      
      this.log('Browser initialized successfully');
    } catch (error) {
      this.log(`Failed to initialize browser: ${error}`, 'ERROR');
      throw error;
    }
  }

  async scrapeAllSites(config: ScrapingConfig): Promise<JobListing[]> {
    const allJobs: JobListing[] = [];
    
    for (const siteName of config.sites) {
      try {
        this.log(`Starting scraping for ${siteName}...`);
        
        const page = await this.browser.newPage();
        
        // Set common page properties
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });
        
        let scraper;
        
        switch (siteName.toLowerCase()) {
          case 'indeed':
            scraper = new IndeedScraper(page);
            await (scraper as IndeedScraper).setupPage();
            break;
            
          case 'glassdoor':
            scraper = new GlassdoorScraper(page);
            await (scraper as GlassdoorScraper).setupPage();
            break;
            
          case 'linkedin':
            scraper = new LinkedInScraper(page);
            await (scraper as LinkedInScraper).setupPage();
            break;
            
          default:
            this.log(`Unknown site: ${siteName}`, 'WARN');
            await page.close();
            continue;
        }
        
        const jobs = await scraper.scrapeJobs(
          config.query, 
          config.location, 
          config.maxPagesPerSite
        );
        
        this.log(`${siteName}: Found ${jobs.length} jobs`);
        
        // Optionally fetch job descriptions
        if (config.includeDescriptions && jobs.length > 0) {
          this.log(`${siteName}: Fetching job descriptions...`);
          await this.fetchJobDescriptions(scraper, jobs.slice(0, 5)); // Limit to first 5 for demo
        }
        
        allJobs.push(...jobs);
        await page.close();
        
        // Delay between sites to be respectful
        if (config.sites.indexOf(siteName) < config.sites.length - 1) {
          this.log('Waiting 5 seconds before next site...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (error) {
        this.log(`Error scraping ${siteName}: ${error}`, 'ERROR');
        continue;
      }
    }
    
    return allJobs;
  }

  private async fetchJobDescriptions(scraper: any, jobs: JobListing[]) {
    for (let i = 0; i < Math.min(jobs.length, 3); i++) {
      try {
        const description = await scraper.getJobDescription(jobs[i].jobUrl);
        if (description) {
          jobs[i].description = description;
        }
        
        // Small delay between description fetches
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        this.log(`Error fetching description for ${jobs[i].jobUrl}: ${error}`, 'WARN');
      }
    }
  }

  async saveToDatabase(jobs: JobListing[]) {
    try {
      this.log('Connecting to MongoDB...');
      const MONGODB_URI = process.env.MONGODB_URI;
      
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      
      const db = client.db('jobnest');
      const collection = db.collection('raw_jobs');

      this.log(`Saving ${jobs.length} jobs to database...`);

      // Group jobs by source for better organization
      const jobsBySource = jobs.reduce((acc, job) => {
        if (!acc[job.source]) acc[job.source] = [];
        acc[job.source].push(job);
        return acc;
      }, {} as Record<string, JobListing[]>);

      let totalUpserted = 0;
      let totalModified = 0;

      for (const [source, sourceJobs] of Object.entries(jobsBySource)) {
        const operations = sourceJobs.map(job => ({
          updateOne: {
            filter: { jobUrl: job.jobUrl },
            update: { $set: job },
            upsert: true
          }
        }));

        const result = await collection.bulkWrite(operations);
        totalUpserted += result.upsertedCount;
        totalModified += result.modifiedCount;
        
        this.log(`${source}: ${result.upsertedCount} new, ${result.modifiedCount} updated`);
      }
      
      await client.close();
      this.log('MongoDB connection closed');
      
      return { upsertedCount: totalUpserted, modifiedCount: totalModified };
      
    } catch (error) {
      this.log(`Error saving to database: ${error}`, 'ERROR');
      
      // Fallback: save to JSON file
      this.log('Falling back to JSON file storage...', 'WARN');
      const filename = `multi-site-jobs_${new Date().toISOString().split('T')[0]}.json`;
      
      // Organize by source in the JSON file
      const organizedJobs = jobs.reduce((acc, job) => {
        if (!acc[job.source]) acc[job.source] = [];
        acc[job.source].push(job);
        return acc;
      }, {} as Record<string, JobListing[]>);
      
      fs.writeFileSync(filename, JSON.stringify(organizedJobs, null, 2));
      this.log(`Jobs saved to ${filename}`);
      
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.log('Browser closed');
      }
    } catch (error) {
      this.log(`Error during cleanup: ${error}`, 'ERROR');
    }
  }

  async run(config: ScrapingConfig) {
    try {
      await this.initialize();
      
      this.log(`Starting multi-site scraping for query: "${config.query}"`);
      this.log(`Sites: ${config.sites.join(', ')}`);
      this.log(`Location: ${config.location || 'Any'}`);
      
      const jobs = await this.scrapeAllSites(config);
      
      if (jobs.length > 0) {
        await this.saveToDatabase(jobs);
        
        // Log summary
        const summary = jobs.reduce((acc, job) => {
          acc[job.source] = (acc[job.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        this.log('=== SCRAPING SUMMARY ===');
        Object.entries(summary).forEach(([source, count]) => {
          this.log(`${source}: ${count} jobs`);
        });
        this.log(`Total jobs scraped: ${jobs.length}`);
        
      } else {
        this.log('No jobs found across all sites', 'WARN');
      }
      
    } catch (error) {
      this.log(`Multi-site scraping failed: ${error}`, 'ERROR');
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Example usage
(async () => {
  const scraper = new MultiSiteScraper();
  
  const config: ScrapingConfig = {
    query: 'software developer',
    location: 'New York, NY',
    sites: ['indeed', 'glassdoor', 'linkedin'],
    maxPagesPerSite: 2,
    includeDescriptions: false // Set to true to fetch job descriptions (slower)
  };
  
  try {
    await scraper.run(config);
  } catch (error) {
    console.error('Scraper execution failed:', error);
    process.exit(1);
  }
})();
