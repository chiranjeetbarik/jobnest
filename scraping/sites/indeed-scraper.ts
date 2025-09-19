import { Page } from 'puppeteer';
import { BaseScraper, SiteConfig } from './base-scraper.js';

export class IndeedScraper extends BaseScraper {
  constructor(page: Page) {
    const config: SiteConfig = {
      name: 'Indeed',
      baseUrl: 'https://www.indeed.com',
      searchUrl: 'https://www.indeed.com/jobs',
      selectors: {
        // Updated selectors for Indeed's current layout
        jobCard: '[data-jk]', // Indeed uses data-jk attribute for job cards
        title: 'h2[data-testid="job-title"] a span, .jobTitle a span',
        company: '[data-testid="company-name"], .companyName',
        location: '[data-testid="job-location"], .companyLocation',
        salary: '.salary-snippet, [data-testid="job-salary"]',
        link: 'h2[data-testid="job-title"] a, .jobTitle a',
        description: '.jobsearch-jobDescriptionText, [data-testid="job-description"]',
        nextButton: 'a[aria-label="Next Page"], .np:last-child'
      },
      waitForSelector: '[data-jk]',
      maxPages: 5,
      delayBetweenPages: 3000
    };
    
    super(config, page);
  }

  buildSearchUrl(query: string, location?: string, page?: number): string {
    const params = new URLSearchParams();
    params.set('q', query);
    
    if (location) {
      params.set('l', location);
    }
    
    if (page && page > 1) {
      params.set('start', ((page - 1) * 10).toString());
    }
    
    return `${this.config.searchUrl}?${params.toString()}`;
  }

  // Override extraction for Indeed's specific structure
  protected async extractJobsFromPage() {
    return await this.page.evaluate((selectors, siteName) => {
      const jobCards = document.querySelectorAll(selectors.jobCard);
      const jobs: any[] = [];

      jobCards.forEach((card: Element) => {
        try {
          // Indeed has nested structures, so we need to be more specific
          const titleElement = card.querySelector(selectors.title) || 
                              card.querySelector('h2 a span[title]');
          
          const companyElement = card.querySelector(selectors.company) || 
                                card.querySelector('span[data-testid="company-name"]');
          
          const locationElement = card.querySelector(selectors.location) || 
                                 card.querySelector('div[data-testid="job-location"]');
          
          const linkElement = card.querySelector(selectors.link) || 
                             card.querySelector('h2 a');
          
          const salaryElement = card.querySelector(selectors.salary);

          const title = titleElement?.textContent?.trim() || 
                       titleElement?.getAttribute('title')?.trim();
          
          const company = companyElement?.textContent?.trim();
          const location = locationElement?.textContent?.trim();
          const salary = salaryElement?.textContent?.trim();
          
          let jobUrl = null;
          if (linkElement) {
            const href = (linkElement as HTMLAnchorElement).href || 
                        (linkElement as HTMLAnchorElement).getAttribute('href');
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
              source: siteName
            });
          }
        } catch (error) {
          console.error('Error extracting Indeed job:', error);
        }
      });

      return jobs;
    }, this.config.selectors, this.config.name);
  }

  // Indeed-specific method to handle anti-bot measures
  async setupPage() {
    // Set additional headers to appear more human-like
    await this.page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });

    // Disable images and CSS to speed up loading
    await this.page.setRequestInterception(true);
    this.page.on('request', (req) => {
      if (req.resourceType() === 'stylesheet' || req.resourceType() === 'image') {
        req.abort();
      } else {
        req.continue();
      }
    });
  }
}
