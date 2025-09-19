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

class SimpleMultiScraper {
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
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      
      this.log('Browser initialized successfully');
    } catch (error) {
      this.log(`Failed to initialize browser: ${error}`, 'ERROR');
      throw error;
    }
  }

  async scrapeIndeed(query: string, location?: string, maxPages: number = 2): Promise<JobListing[]> {
    const jobs: JobListing[] = [];
    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const params = new URLSearchParams();
        params.set('q', query);
        if (location) params.set('l', location);
        if (pageNum > 1) params.set('start', ((pageNum - 1) * 10).toString());
        
        const url = `https://www.indeed.com/jobs?${params.toString()}`;
        this.log(`[Indeed] Scraping page ${pageNum}: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for job listings
        try {
          await page.waitForSelector('[data-jk]', { timeout: 10000 });
        } catch (error) {
          this.log(`[Indeed] No jobs found on page ${pageNum}`, 'WARN');
          break;
        }

        const pageJobs = await page.evaluate(() => {
          const jobCards = document.querySelectorAll('[data-jk]');
          const jobs: any[] = [];

          jobCards.forEach((card: Element) => {
            try {
              const titleElement = card.querySelector('h2[data-testid="job-title"] a span, .jobTitle a span');
              const companyElement = card.querySelector('[data-testid="company-name"], .companyName');
              const locationElement = card.querySelector('[data-testid="job-location"], .companyLocation');
              const linkElement = card.querySelector('h2[data-testid="job-title"] a, .jobTitle a');
              const salaryElement = card.querySelector('.salary-snippet, [data-testid="job-salary"]');

              const title = titleElement?.textContent?.trim();
              const company = companyElement?.textContent?.trim();
              const location = locationElement?.textContent?.trim();
              const salary = salaryElement?.textContent?.trim();
              
              let jobUrl = null;
              if (linkElement) {
                const href = (linkElement as HTMLAnchorElement).href;
                jobUrl = href?.startsWith('http') ? href : 
                        href?.startsWith('/') ? 'https://www.indeed.com' + href : null;
              }

              if (title && company && jobUrl) {
                jobs.push({
                  title,
                  company,
                  location: location || 'Not specified',
                  jobUrl,
                  salary,
                  scrapedAt: new Date(),
                  source: 'Indeed'
                });
              }
            } catch (error) {
              console.error('Error extracting Indeed job:', error);
            }
          });

          return jobs;
        });

        jobs.push(...pageJobs);
        this.log(`[Indeed] Found ${pageJobs.length} jobs on page ${pageNum}`);
        
        if (pageNum < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    } catch (error) {
      this.log(`[Indeed] Error: ${error}`, 'ERROR');
    } finally {
      await page.close();
    }
    
    return jobs;
  }

  async scrapeRemoteOK(query: string, maxPages: number = 2): Promise<JobListing[]> {
    const jobs: JobListing[] = [];
    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const url = pageNum === 1 
          ? 'https://remoteok.io/remote-dev-jobs'
          : `https://remoteok.io/remote-dev-jobs?page=${pageNum}`;
        
        this.log(`[RemoteOK] Scraping page ${pageNum}: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        try {
          await page.waitForSelector('tr.job', { timeout: 10000 });
        } catch (error) {
          this.log(`[RemoteOK] No jobs found on page ${pageNum}`, 'WARN');
          break;
        }

        const pageJobs = await page.evaluate(() => {
          const jobRows = document.querySelectorAll('tr.job');
          const jobs: any[] = [];

          jobRows.forEach((row: Element) => {
            try {
              const titleElement = row.querySelector('.company h2');
              const companyElement = row.querySelector('.company h3');
              const locationElement = row.querySelector('.location');
              const linkElement = row.querySelector('a');
              const salaryElement = row.querySelector('.salary');

              const title = titleElement?.textContent?.trim();
              const company = companyElement?.textContent?.trim();
              const location = locationElement?.textContent?.trim() || 'Remote';
              const salary = salaryElement?.textContent?.trim();
              const jobUrl = linkElement ? 'https://remoteok.io' + (linkElement as HTMLAnchorElement).getAttribute('href') : null;

              if (title && company && jobUrl) {
                jobs.push({
                  title,
                  company,
                  location,
                  jobUrl,
                  salary,
                  scrapedAt: new Date(),
                  source: 'RemoteOK'
                });
              }
            } catch (error) {
              console.error('Error extracting RemoteOK job:', error);
            }
          });

          return jobs;
        });

        jobs.push(...pageJobs);
        this.log(`[RemoteOK] Found ${pageJobs.length} jobs on page ${pageNum}`);
        
        if (pageNum < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      this.log(`[RemoteOK] Error: ${error}`, 'ERROR');
    } finally {
      await page.close();
    }
    
    return jobs;
  }

  async scrapeGlassdoor(query: string, location?: string, maxPages: number = 2): Promise<JobListing[]> {
    const jobs: JobListing[] = [];
    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Handle cookie consent
      try {
        await page.goto('https://www.glassdoor.com', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 3000 });
        await page.click('#onetrust-accept-btn-handler');
        this.log('[Glassdoor] Accepted cookies');
      } catch (error) {
        // Cookie banner might not appear
      }
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const params = new URLSearchParams();
        params.set('sc.keyword', query);
        if (location) {
          params.set('locT', 'C');
          params.set('locId', location);
        }
        if (pageNum > 1) params.set('p', pageNum.toString());
        
        const url = `https://www.glassdoor.com/Job/jobs.htm?${params.toString()}`;
        this.log(`[Glassdoor] Scraping page ${pageNum}: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        try {
          await page.waitForSelector('[data-test="job-listing"], .react-job-listing', { timeout: 10000 });
        } catch (error) {
          this.log(`[Glassdoor] No jobs found on page ${pageNum}`, 'WARN');
          break;
        }

        const pageJobs = await page.evaluate(() => {
          const jobCards = document.querySelectorAll('[data-test="job-listing"], .react-job-listing');
          const jobs: any[] = [];

          jobCards.forEach((card: Element) => {
            try {
              const titleElement = card.querySelector('[data-test="job-title"], .jobTitle');
              const companyElement = card.querySelector('[data-test="employer-name"], .employerName');
              const locationElement = card.querySelector('[data-test="job-location"], .location');
              const linkElement = card.querySelector('[data-test="job-title"] a, .jobTitle a');
              const salaryElement = card.querySelector('[data-test="detailSalary"], .salaryText');

              const title = titleElement?.textContent?.trim();
              const company = companyElement?.textContent?.trim();
              const location = locationElement?.textContent?.trim();
              const salary = salaryElement?.textContent?.trim();
              
              let jobUrl = null;
              if (linkElement) {
                const href = (linkElement as HTMLAnchorElement).href;
                jobUrl = href?.startsWith('http') ? href : 
                        href?.startsWith('/') ? 'https://www.glassdoor.com' + href : null;
              }

              if (title && company && jobUrl) {
                jobs.push({
                  title,
                  company,
                  location: location || 'Not specified',
                  jobUrl,
                  salary,
                  scrapedAt: new Date(),
                  source: 'Glassdoor'
                });
              }
            } catch (error) {
              console.error('Error extracting Glassdoor job:', error);
            }
          });

          return jobs;
        });

        jobs.push(...pageJobs);
        this.log(`[Glassdoor] Found ${pageJobs.length} jobs on page ${pageNum}`);
        
        if (pageNum < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
      }
    } catch (error) {
      this.log(`[Glassdoor] Error: ${error}`, 'ERROR');
    } finally {
      await page.close();
    }
    
    return jobs;
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
      
      // Fallback: save to JSON file
      this.log('Falling back to JSON file storage...', 'WARN');
      const filename = `multi-site-jobs_${new Date().toISOString().split('T')[0]}.json`;
      
      const organizedJobs = jobs.reduce((acc: any, job) => {
        if (!acc[job.source]) acc[job.source] = [];
        acc[job.source].push(job);
        return acc;
      }, {});
      
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

  async run(query: string, location?: string) {
    try {
      await this.initialize();
      
      this.log(`Starting multi-site scraping for query: "${query}"`);
      this.log(`Location: ${location || 'Any'}`);
      
      const allJobs: JobListing[] = [];
      
      // Scrape RemoteOK (most reliable)
      this.log('Starting RemoteOK scraping...');
      const remoteOKJobs = await this.scrapeRemoteOK(query, 2);
      allJobs.push(...remoteOKJobs);
      
      // Wait between sites
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Scrape Indeed
      this.log('Starting Indeed scraping...');
      const indeedJobs = await this.scrapeIndeed(query, location, 2);
      allJobs.push(...indeedJobs);
      
      // Wait between sites
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Scrape Glassdoor
      this.log('Starting Glassdoor scraping...');
      const glassdoorJobs = await this.scrapeGlassdoor(query, location, 1);
      allJobs.push(...glassdoorJobs);
      
      if (allJobs.length > 0) {
        await this.saveToDatabase(allJobs);
        
        // Log summary
        const summary = allJobs.reduce((acc: any, job) => {
          acc[job.source] = (acc[job.source] || 0) + 1;
          return acc;
        }, {});
        
        this.log('=== SCRAPING SUMMARY ===');
        Object.entries(summary).forEach(([source, count]) => {
          this.log(`${source}: ${count} jobs`);
        });
        this.log(`Total jobs scraped: ${allJobs.length}`);
        
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

// Run the scraper
(async () => {
  const scraper = new SimpleMultiScraper();
  
  try {
    await scraper.run('software developer', 'New York, NY');
  } catch (error) {
    console.error('Scraper execution failed:', error);
    process.exit(1);
  }
})();
