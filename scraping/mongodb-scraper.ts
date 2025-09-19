import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

puppeteer.use(StealthPlugin());

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

class JobScraper {
  private browser: any;
  private page: any;
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'scraper.log');
  }

  private log(message: string, level: 'INFO' | 'ERROR' | 'WARN' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;
    
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async initialize() {
    try {
      this.log('Initializing browser...');
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
      
      // Set realistic browser properties
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await this.page.setViewport({ width: 1366, height: 768 });
      
      this.log('Browser initialized successfully');
    } catch (error) {
      this.log(`Failed to initialize browser: ${error}`, 'ERROR');
      throw error;
    }
  }

  async scrapeRemoteOK(maxPages: number = 3): Promise<JobListing[]> {
    const allJobs: JobListing[] = [];
    
    try {
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        this.log(`Scraping RemoteOK page ${pageNum}...`);
        
        const url = pageNum === 1 
          ? 'https://remoteok.io/remote-dev-jobs'
          : `https://remoteok.io/remote-dev-jobs?page=${pageNum}`;
        
        await this.page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });

        // Wait for job listings to load
        try {
          await this.page.waitForSelector('tr.job', { timeout: 10000 });
        } catch (error) {
          this.log(`No jobs found on page ${pageNum}, stopping pagination`, 'WARN');
          break;
        }

        const jobs = await this.page.$$eval('tr.job', (jobRows: Element[]) => {
          return jobRows.map((row: Element) => {
            try {
              const titleElement = row.querySelector('.company h2');
              const companyElement = row.querySelector('.company h3');
              const locationElement = row.querySelector('.location');
              const linkElement = row.querySelector('a');
              const salaryElement = row.querySelector('.salary');

              const title = titleElement?.textContent?.trim() || null;
              const company = companyElement?.textContent?.trim() || null;
              const location = locationElement?.textContent?.trim() || 'Remote';
              const salary = salaryElement?.textContent?.trim() || null;
              const jobUrl = linkElement ? 'https://remoteok.io' + (linkElement as HTMLAnchorElement).getAttribute('href') : null;

              if (title && company && jobUrl) {
                return { title, company, location, jobUrl, salary };
              }
              return null;
            } catch (error) {
              console.error('Error extracting job data:', error);
              return null;
            }
          }).filter((job: any) => job !== null);
        });

        this.log(`Found ${jobs.length} jobs on page ${pageNum}`);
        
        // Transform to JobListing format
        const jobListings: JobListing[] = jobs.map((job: any) => ({
          title: job.title,
          company: job.company,
          location: job.location,
          jobUrl: job.jobUrl,
          salary: job.salary,
          scrapedAt: new Date(),
          source: 'RemoteOK'
        }));

        allJobs.push(...jobListings);

        // Add delay between pages to be respectful
        if (pageNum < maxPages) {
          this.log(`Waiting 2 seconds before next page...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      this.log(`Total jobs scraped: ${allJobs.length}`);
      return allJobs;

    } catch (error) {
      this.log(`Error scraping RemoteOK: ${error}`, 'ERROR');
      throw error;
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

      // Insert jobs with upsert to avoid duplicates
      const operations = jobs.map(job => ({
        updateOne: {
          filter: { jobUrl: job.jobUrl },
          update: { $set: job },
          upsert: true
        }
      }));

      const result = await collection.bulkWrite(operations);
      this.log(`Database operation completed: ${result.upsertedCount} new jobs, ${result.modifiedCount} updated jobs`);
      
      await client.close();
      this.log('MongoDB connection closed');
      
      return result;
    } catch (error) {
      this.log(`Error saving to database: ${error}`, 'ERROR');
      
      // Fallback: save to JSON file if database fails
      this.log('Falling back to JSON file storage...', 'WARN');
      const filename = `jobs_${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(filename, JSON.stringify(jobs, null, 2));
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

  async run() {
    try {
      await this.initialize();
      
      const jobs = await this.scrapeRemoteOK(3); // Scrape 3 pages
      
      if (jobs.length > 0) {
        await this.saveToDatabase(jobs);
        this.log(`Scraping completed successfully. Total jobs: ${jobs.length}`);
      } else {
        this.log('No jobs found during scraping', 'WARN');
      }
      
    } catch (error) {
      this.log(`Scraping failed: ${error}`, 'ERROR');
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the scraper
(async () => {
  const scraper = new JobScraper();
  try {
    await scraper.run();
  } catch (error) {
    console.error('Scraper execution failed:', error);
    process.exit(1);
  }
})();
