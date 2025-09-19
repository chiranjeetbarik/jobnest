import { Page } from 'puppeteer';

export interface JobListing {
  title: string;
  company: string;
  location: string;
  jobUrl: string;
  description?: string;
  salary?: string;
  scrapedAt: Date;
  source: string;
}

export interface SiteConfig {
  name: string;
  baseUrl: string;
  searchUrl: string;
  selectors: {
    jobCard: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    description?: string;
    link: string;
    nextButton?: string;
  };
  waitForSelector?: string;
  maxPages?: number;
  delayBetweenPages?: number;
}

export abstract class BaseScraper {
  protected config: SiteConfig;
  protected page: Page;

  constructor(config: SiteConfig, page: Page) {
    this.config = config;
    this.page = page;
  }

  abstract buildSearchUrl(query: string, location?: string, page?: number): string;
  
  async scrapeJobs(query: string, location?: string, maxPages: number = 3): Promise<JobListing[]> {
    const allJobs: JobListing[] = [];
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const url = this.buildSearchUrl(query, location, pageNum);
        console.log(`[${this.config.name}] Scraping page ${pageNum}: ${url}`);
        
        await this.page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });

        // Wait for job listings to load
        if (this.config.waitForSelector) {
          try {
            await this.page.waitForSelector(this.config.waitForSelector, { timeout: 10000 });
          } catch (error) {
            console.log(`[${this.config.name}] No jobs found on page ${pageNum}, stopping pagination`);
            break;
          }
        }

        const jobs = await this.extractJobsFromPage();
        console.log(`[${this.config.name}] Found ${jobs.length} jobs on page ${pageNum}`);
        
        allJobs.push(...jobs);

        // Add delay between pages
        if (pageNum < maxPages && this.config.delayBetweenPages) {
          await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenPages));
        }
        
      } catch (error) {
        console.error(`[${this.config.name}] Error scraping page ${pageNum}:`, error);
        break;
      }
    }

    return allJobs;
  }

  protected async extractJobsFromPage(): Promise<JobListing[]> {
    return await this.page.$$eval(this.config.selectors.jobCard, (jobCards, selectors, siteName) => {
      return jobCards.map((card: Element) => {
        try {
          const titleElement = card.querySelector(selectors.title);
          const companyElement = card.querySelector(selectors.company);
          const locationElement = card.querySelector(selectors.location);
          const linkElement = card.querySelector(selectors.link);
          const salaryElement = selectors.salary ? card.querySelector(selectors.salary) : null;

          const title = titleElement?.textContent?.trim() || null;
          const company = companyElement?.textContent?.trim() || null;
          const location = locationElement?.textContent?.trim() || null;
          const salary = salaryElement?.textContent?.trim() || null;
          
          let jobUrl = null;
          if (linkElement) {
            const href = (linkElement as HTMLAnchorElement).href || 
                        (linkElement as HTMLAnchorElement).getAttribute('href');
            jobUrl = href?.startsWith('http') ? href : 
                    href?.startsWith('/') ? window.location.origin + href : null;
          }

          if (title && company && jobUrl) {
            return {
              title,
              company,
              location: location || 'Not specified',
              jobUrl,
              salary,
              scrapedAt: new Date(),
              source: siteName
            };
          }
          return null;
        } catch (error) {
          console.error('Error extracting job data:', error);
          return null;
        }
      }).filter(job => job !== null);
    }, this.config.selectors, this.config.name);
  }

  async getJobDescription(jobUrl: string): Promise<string | null> {
    try {
      await this.page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      
      if (this.config.selectors.description) {
        const description = await this.page.$eval(
          this.config.selectors.description, 
          el => el.textContent?.trim() || null
        );
        return description;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting job description from ${jobUrl}:`, error);
      return null;
    }
  }
}
