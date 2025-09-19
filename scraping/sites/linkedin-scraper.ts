import { Page } from 'puppeteer';
import { BaseScraper, SiteConfig } from './base-scraper.js';

export class LinkedInScraper extends BaseScraper {
  constructor(page: Page) {
    const config: SiteConfig = {
      name: 'LinkedIn',
      baseUrl: 'https://www.linkedin.com',
      searchUrl: 'https://www.linkedin.com/jobs/search',
      selectors: {
        // Updated selectors for LinkedIn's current layout
        jobCard: '.job-search-card, .jobs-search__results-list li',
        title: '.base-search-card__title, .job-search-card__title a',
        company: '.base-search-card__subtitle, .job-search-card__subtitle-link',
        location: '.job-search-card__location',
        salary: '.job-search-card__salary-info',
        link: '.base-search-card__title a, .job-search-card__title a',
        description: '.show-more-less-html__markup, .jobs-description__content',
        nextButton: 'button[aria-label="View next page"]'
      },
      waitForSelector: '.job-search-card',
      maxPages: 3,
      delayBetweenPages: 5000 // LinkedIn is more strict, longer delays
    };
    
    super(config, page);
  }

  buildSearchUrl(query: string, location?: string, page?: number): string {
    const params = new URLSearchParams();
    params.set('keywords', query);
    params.set('f_TPR', 'r604800'); // Past week
    
    if (location) {
      params.set('location', location);
    }
    
    if (page && page > 1) {
      params.set('start', ((page - 1) * 25).toString());
    }
    
    return `${this.config.searchUrl}?${params.toString()}`;
  }

  // Override extraction for LinkedIn's specific structure
  protected async extractJobsFromPage() {
    return await this.page.evaluate((selectors, siteName) => {
      const jobCards = document.querySelectorAll(selectors.jobCard);
      const jobs: any[] = [];

      jobCards.forEach((card: Element) => {
        try {
          const titleElement = card.querySelector(selectors.title) || 
                              card.querySelector('a .sr-only');
          
          const companyElement = card.querySelector(selectors.company) || 
                                card.querySelector('.job-search-card__subtitle-link');
          
          const locationElement = card.querySelector(selectors.location);
          
          const linkElement = card.querySelector(selectors.link) || 
                             card.querySelector('a[data-control-name="job_search_job_result_click"]');
          
          const salaryElement = card.querySelector(selectors.salary);

          const title = titleElement?.textContent?.trim();
          const company = companyElement?.textContent?.trim();
          const location = locationElement?.textContent?.trim();
          const salary = salaryElement?.textContent?.trim() || null;
          
          let jobUrl = null;
          if (linkElement) {
            const href = (linkElement as HTMLAnchorElement).href || 
                        (linkElement as HTMLAnchorElement).getAttribute('href');
            jobUrl = href?.startsWith('http') ? href : 
                    href?.startsWith('/') ? 'https://www.linkedin.com' + href : null;
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
          console.error('Error extracting LinkedIn job:', error);
        }
      });

      return jobs;
    }, this.config.selectors, this.config.name);
  }

  // LinkedIn-specific setup
  async setupPage() {
    // LinkedIn requires more sophisticated headers
    await this.page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1'
    });

    // Handle LinkedIn's guest access
    try {
      // Wait for potential login prompt and dismiss it
      await this.page.waitForSelector('.guest-homepage', { timeout: 3000 });
      console.log('[LinkedIn] Accessing as guest');
    } catch (error) {
      // No guest prompt, continue
    }
  }

  // LinkedIn often requires scrolling to load more jobs
  async scrollToLoadJobs() {
    await this.page.evaluate(() => {
      return new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
}
