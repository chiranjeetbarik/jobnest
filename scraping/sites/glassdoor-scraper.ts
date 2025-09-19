import { Page } from 'puppeteer';
import { BaseScraper, SiteConfig } from './base-scraper.js';

export class GlassdoorScraper extends BaseScraper {
  constructor(page: Page) {
    const config: SiteConfig = {
      name: 'Glassdoor',
      baseUrl: 'https://www.glassdoor.com',
      searchUrl: 'https://www.glassdoor.com/Job/jobs.htm',
      selectors: {
        // Updated selectors for Glassdoor's current layout
        jobCard: '[data-test="job-listing"], .react-job-listing',
        title: '[data-test="job-title"], .jobTitle',
        company: '[data-test="employer-name"], .employerName',
        location: '[data-test="job-location"], .location',
        salary: '[data-test="detailSalary"], .salaryText',
        link: '[data-test="job-title"] a, .jobTitle a',
        description: '.jobDescriptionContent, [data-test="job-description"]',
        nextButton: '[data-test="pagination-next"], .next'
      },
      waitForSelector: '[data-test="job-listing"]',
      maxPages: 3,
      delayBetweenPages: 4000
    };
    
    super(config, page);
  }

  buildSearchUrl(query: string, location?: string, page?: number): string {
    const params = new URLSearchParams();
    params.set('sc.keyword', query);
    
    if (location) {
      params.set('locT', 'C');
      params.set('locId', location);
    }
    
    if (page && page > 1) {
      params.set('p', page.toString());
    }
    
    return `${this.config.searchUrl}?${params.toString()}`;
  }

  // Override extraction for Glassdoor's specific structure
  protected async extractJobsFromPage() {
    return await this.page.evaluate((selectors, siteName) => {
      const jobCards = document.querySelectorAll(selectors.jobCard);
      const jobs: any[] = [];

      jobCards.forEach((card: Element) => {
        try {
          const titleElement = card.querySelector(selectors.title) || 
                              card.querySelector('a[data-test="job-title"]');
          
          const companyElement = card.querySelector(selectors.company) || 
                                card.querySelector('span[data-test="employer-name"]');
          
          const locationElement = card.querySelector(selectors.location) || 
                                 card.querySelector('span[data-test="job-location"]');
          
          const linkElement = card.querySelector(selectors.link) || 
                             card.querySelector('a[data-test="job-title"]');
          
          const salaryElement = card.querySelector(selectors.salary);

          const title = titleElement?.textContent?.trim();
          const company = companyElement?.textContent?.trim();
          const location = locationElement?.textContent?.trim();
          const salary = salaryElement?.textContent?.trim();
          
          let jobUrl = null;
          if (linkElement) {
            const href = (linkElement as HTMLAnchorElement).href || 
                        (linkElement as HTMLAnchorElement).getAttribute('href');
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
              source: siteName
            });
          }
        } catch (error) {
          console.error('Error extracting Glassdoor job:', error);
        }
      });

      return jobs;
    }, this.config.selectors, this.config.name);
  }

  // Glassdoor-specific setup
  async setupPage() {
    // Glassdoor requires accepting cookies and location
    await this.page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });

    // Handle cookie consent if it appears
    try {
      await this.page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 3000 });
      await this.page.click('#onetrust-accept-btn-handler');
      console.log('[Glassdoor] Accepted cookies');
    } catch (error) {
      // Cookie banner might not appear
    }
  }
}
