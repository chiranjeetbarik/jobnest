import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
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

interface PaginationConfig {
  nextButtonSelectors: string[];
  disabledNextSelectors?: string[];
  maxPages: number;
  waitAfterClick: number;
}

class PaginationScraper {
  private browser: any;
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'pagination-scraper.log');
  }

  private log(message: string, level: 'INFO' | 'ERROR' | 'WARN' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;
    
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async initialize() {
    try {
      this.log('Initializing browser for pagination scraping...');
      this.browser = await puppeteerExtra.launch({ 
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

  async scrapeIndeedWithPagination(query: string, location?: string, maxPages: number = 5): Promise<JobListing[]> {
    const jobs: JobListing[] = [];
    const page = await this.browser.newPage();
    
    const paginationConfig: PaginationConfig = {
      nextButtonSelectors: [
        'a[aria-label="Next Page"]',
        'a[aria-label="Next"]', 
        '.np:last-child:not(.np-disabled)',
        'a[data-testid="pagination-page-next"]'
      ],
      disabledNextSelectors: [
        '.np-disabled',
        'a[aria-label="Next Page"][aria-disabled="true"]'
      ],
      maxPages,
      waitAfterClick: 3000
    };
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Build initial search URL
      const params = new URLSearchParams();
      params.set('q', query);
      if (location) params.set('l', location);
      
      const initialUrl = `https://www.indeed.com/jobs?${params.toString()}`;
      this.log(`[Indeed] Starting pagination scraping: ${initialUrl}`);
      
      await page.goto(initialUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      let currentPage = 1;
      
      while (currentPage <= maxPages) {
        this.log(`[Indeed] Scraping page ${currentPage}...`);
        
        // Wait for job listings to load
        try {
          await page.waitForSelector('[data-jk]', { timeout: 10000 });
        } catch (error) {
          this.log(`[Indeed] No jobs found on page ${currentPage}`, 'WARN');
          break;
        }

        // Extract jobs from current page
        const pageJobs = await this.extractIndeedJobs(page);
        jobs.push(...pageJobs);
        this.log(`[Indeed] Found ${pageJobs.length} jobs on page ${currentPage}`);
        
        // Check if we should continue to next page
        if (currentPage >= maxPages) {
          this.log(`[Indeed] Reached maximum pages (${maxPages})`);
          break;
        }
        
        // Try to find and click the next button
        const hasNextPage = await this.navigateToNextPage(page, paginationConfig, 'Indeed');
        
        if (!hasNextPage) {
          this.log(`[Indeed] No more pages available after page ${currentPage}`);
          break;
        }
        
        currentPage++;
        
        // Wait for the new page to load
        await new Promise(resolve => setTimeout(resolve, paginationConfig.waitAfterClick));
      }
      
    } catch (error) {
      this.log(`[Indeed] Error during pagination: ${error}`, 'ERROR');
    } finally {
      await page.close();
    }
    
    return jobs;
  }

  async scrapeGlassdoorWithPagination(query: string, location?: string, maxPages: number = 3): Promise<JobListing[]> {
    const jobs: JobListing[] = [];
    const page = await this.browser.newPage();
    
    const paginationConfig: PaginationConfig = {
      nextButtonSelectors: [
        '[data-test="pagination-next"]',
        '.next:not(.disabled)',
        'button[data-test="next-page"]',
        'a.next'
      ],
      disabledNextSelectors: [
        '[data-test="pagination-next"].disabled',
        '.next.disabled'
      ],
      maxPages,
      waitAfterClick: 4000
    };
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Handle cookie consent first
      try {
        await page.goto('https://www.glassdoor.com', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 3000 });
        await page.click('#onetrust-accept-btn-handler');
        this.log('[Glassdoor] Accepted cookies');
      } catch (error) {
        // Cookie banner might not appear
      }
      
      // Build search URL
      const params = new URLSearchParams();
      params.set('sc.keyword', query);
      if (location) {
        params.set('locT', 'C');
        params.set('locId', location);
      }
      
      const initialUrl = `https://www.glassdoor.com/Job/jobs.htm?${params.toString()}`;
      this.log(`[Glassdoor] Starting pagination scraping: ${initialUrl}`);
      
      await page.goto(initialUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      let currentPage = 1;
      
      while (currentPage <= maxPages) {
        this.log(`[Glassdoor] Scraping page ${currentPage}...`);
        
        // Wait for job listings to load
        try {
          await page.waitForSelector('[data-test="job-listing"], .react-job-listing', { timeout: 10000 });
        } catch (error) {
          this.log(`[Glassdoor] No jobs found on page ${currentPage}`, 'WARN');
          break;
        }

        // Extract jobs from current page
        const pageJobs = await this.extractGlassdoorJobs(page);
        jobs.push(...pageJobs);
        this.log(`[Glassdoor] Found ${pageJobs.length} jobs on page ${currentPage}`);
        
        // Check if we should continue to next page
        if (currentPage >= maxPages) {
          this.log(`[Glassdoor] Reached maximum pages (${maxPages})`);
          break;
        }
        
        // Try to find and click the next button
        const hasNextPage = await this.navigateToNextPage(page, paginationConfig, 'Glassdoor');
        
        if (!hasNextPage) {
          this.log(`[Glassdoor] No more pages available after page ${currentPage}`);
          break;
        }
        
        currentPage++;
        
        // Wait for the new page to load
        await new Promise(resolve => setTimeout(resolve, paginationConfig.waitAfterClick));
      }
      
    } catch (error) {
      this.log(`[Glassdoor] Error during pagination: ${error}`, 'ERROR');
    } finally {
      await page.close();
    }
    
    return jobs;
  }

  async scrapeRemoteOKWithPagination(query: string, maxPages: number = 5): Promise<JobListing[]> {
    const jobs: JobListing[] = [];
    const page = await this.browser.newPage();
    
    const paginationConfig: PaginationConfig = {
      nextButtonSelectors: [
        '.page-link[rel="next"]',
        'a.next',
        '.pagination .next:not(.disabled)'
      ],
      disabledNextSelectors: [
        '.pagination .next.disabled'
      ],
      maxPages,
      waitAfterClick: 2000
    };
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const initialUrl = 'https://remoteok.io/remote-dev-jobs';
      this.log(`[RemoteOK] Starting pagination scraping: ${initialUrl}`);
      
      await page.goto(initialUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      let currentPage = 1;
      
      while (currentPage <= maxPages) {
        this.log(`[RemoteOK] Scraping page ${currentPage}...`);
        
        // Wait for job listings to load
        try {
          await page.waitForSelector('tr.job', { timeout: 10000 });
        } catch (error) {
          this.log(`[RemoteOK] No jobs found on page ${currentPage}`, 'WARN');
          break;
        }

        // Extract jobs from current page
        const pageJobs = await this.extractRemoteOKJobs(page);
        jobs.push(...pageJobs);
        this.log(`[RemoteOK] Found ${pageJobs.length} jobs on page ${currentPage}`);
        
        // Check if we should continue to next page
        if (currentPage >= maxPages) {
          this.log(`[RemoteOK] Reached maximum pages (${maxPages})`);
          break;
        }
        
        // Try to find and click the next button
        const hasNextPage = await this.navigateToNextPage(page, paginationConfig, 'RemoteOK');
        
        if (!hasNextPage) {
          this.log(`[RemoteOK] No more pages available after page ${currentPage}`);
          break;
        }
        
        currentPage++;
        
        // Wait for the new page to load
        await new Promise(resolve => setTimeout(resolve, paginationConfig.waitAfterClick));
      }
      
    } catch (error) {
      this.log(`[RemoteOK] Error during pagination: ${error}`, 'ERROR');
    } finally {
      await page.close();
    }
    
    return jobs;
  }

  private async navigateToNextPage(page: any, config: PaginationConfig, siteName: string): Promise<boolean> {
    try {
      // First check if next button is disabled
      if (config.disabledNextSelectors) {
        for (const disabledSelector of config.disabledNextSelectors) {
          const disabledElement = await page.$(disabledSelector);
          if (disabledElement) {
            this.log(`[${siteName}] Next button is disabled (${disabledSelector})`);
            return false;
          }
        }
      }
      
      // Try to find and click the next button
      for (const selector of config.nextButtonSelectors) {
        try {
          const nextButton = await page.$(selector);
          if (nextButton) {
            // Check if the button is visible and clickable
            const isVisible = await page.evaluate((el: Element) => {
              const rect = el.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            }, nextButton);
            
            if (isVisible) {
              this.log(`[${siteName}] Clicking next button: ${selector}`);
              
              // Scroll the button into view
              await page.evaluate((el: Element) => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, nextButton);
              
              // Wait a bit for scroll to complete
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Click the button
              await nextButton.click();
              
              // Wait for navigation or page update
              try {
                await page.waitForFunction(
                  () => document.readyState === 'complete',
                  { timeout: 10000 }
                );
              } catch (error) {
                // Fallback wait
                await new Promise(resolve => setTimeout(resolve, 3000));
              }
              
              return true;
            }
          }
        } catch (error) {
          this.log(`[${siteName}] Failed to click selector ${selector}: ${error}`, 'WARN');
          continue;
        }
      }
      
      this.log(`[${siteName}] No clickable next button found`);
      return false;
      
    } catch (error) {
      this.log(`[${siteName}] Error in navigation: ${error}`, 'ERROR');
      return false;
    }
  }

  private async extractIndeedJobs(page: any): Promise<JobListing[]> {
    return await page.evaluate(() => {
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
  }

  private async extractGlassdoorJobs(page: any): Promise<JobListing[]> {
    return await page.evaluate(() => {
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
  }

  private async extractRemoteOKJobs(page: any): Promise<JobListing[]> {
    return await page.evaluate(() => {
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
      const filename = `pagination-jobs_${new Date().toISOString().split('T')[0]}.json`;
      
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
      
      this.log(`Starting pagination scraping for query: "${query}"`);
      this.log(`Location: ${location || 'Any'}`);
      
      const allJobs: JobListing[] = [];
      
      // Scrape RemoteOK with pagination
      this.log('Starting RemoteOK pagination scraping...');
      const remoteOKJobs = await this.scrapeRemoteOKWithPagination(query, 3);
      allJobs.push(...remoteOKJobs);
      
      // Wait between sites
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Scrape Indeed with pagination
      this.log('Starting Indeed pagination scraping...');
      const indeedJobs = await this.scrapeIndeedWithPagination(query, location, 3);
      allJobs.push(...indeedJobs);
      
      // Wait between sites
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Scrape Glassdoor with pagination
      this.log('Starting Glassdoor pagination scraping...');
      const glassdoorJobs = await this.scrapeGlassdoorWithPagination(query, location, 2);
      allJobs.push(...glassdoorJobs);
      
      if (allJobs.length > 0) {
        await this.saveToDatabase(allJobs);
        
        // Log summary
        const summary = allJobs.reduce((acc: any, job) => {
          acc[job.source] = (acc[job.source] || 0) + 1;
          return acc;
        }, {});
        
        this.log('=== PAGINATION SCRAPING SUMMARY ===');
        Object.entries(summary).forEach(([source, count]) => {
          this.log(`${source}: ${count} jobs`);
        });
        this.log(`Total jobs scraped: ${allJobs.length}`);
        
      } else {
        this.log('No jobs found across all sites', 'WARN');
      }
      
    } catch (error) {
      this.log(`Pagination scraping failed: ${error}`, 'ERROR');
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the scraper
(async () => {
  const scraper = new PaginationScraper();
  
  try {
    await scraper.run('software developer', 'New York, NY');
  } catch (error) {
    console.error('Scraper execution failed:', error);
    process.exit(1);
  }
})();
