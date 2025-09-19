import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

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
  private mongoClient: MongoClient;
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'scraper.log');
    this.mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  }

  private log(message: string, level: 'INFO' | 'ERROR' | 'WARN' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}\n`;
    
    console.log(logMessage.trim());
    fs.appendFileSync(this.logFile, logMessage);
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

  async connectToDatabase() {
    try {
      this.log('Connecting to MongoDB...');
      await this.mongoClient.connect();
      this.log('Connected to MongoDB successfully');
    } catch (error) {
      this.log(`Failed to connect to MongoDB: ${error}`, 'ERROR');
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
        await this.page.waitForSelector('tr.job', { timeout: 10000 });

        const jobs = await this.page.$$eval('tr.job', (jobRows: Element[]) => {
          return jobRows.map(row => {
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
          }).filter(job => job !== null);
        });

        this.log(`Found ${jobs.length} jobs on page ${pageNum}`);
        
        // Transform to JobListing format
        const jobListings: JobListing[] = jobs.map(job => ({
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
      const db = this.mongoClient.db('jobnest');
      const collection = db.collection('raw_jobs');

      // Insert jobs with upsert to avoid duplicates
      const operations = jobs.map(job => ({
        updateOne: {
          filter: { jobUrl: job.jobUrl },
          update: { $set: job },
          upsert: true
        }
      }));

      const result = await collection.bulkWrite(operations);
      this.log(`Saved ${result.upsertedCount} new jobs, updated ${result.modifiedCount} existing jobs`);
      
      return result;
    } catch (error) {
      this.log(`Error saving to database: ${error}`, 'ERROR');
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.log('Browser closed');
      }
      
      if (this.mongoClient) {
        await this.mongoClient.close();
        this.log('Database connection closed');
      }
    } catch (error) {
      this.log(`Error during cleanup: ${error}`, 'ERROR');
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.connectToDatabase();
      
      const jobs = await this.scrapeRemoteOK(3); // Scrape 3 pages
      await this.saveToDatabase(jobs);
      
      this.log(`Scraping completed successfully. Total jobs: ${jobs.length}`);
      
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
  await scraper.run();
})();
