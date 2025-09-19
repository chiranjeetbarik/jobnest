import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  try {
    const url = 'https://remoteok.io/remote-dev-jobs';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('Extracting job listings...');
    const jobs = await page.$$eval('tr.job', (jobRows) => {
      return jobRows.map(row => {
        const titleElement = row.querySelector('.company h2');
        const companyElement = row.querySelector('.company h3');
        const locationElement = row.querySelector('.location');
        const linkElement = row.querySelector('a');

        const title = titleElement?.textContent?.trim() || null;
        const company = companyElement?.textContent?.trim() || null;
        const location = locationElement?.textContent?.trim() || 'Remote';
        const jobUrl = linkElement ? 'https://remoteok.io' + (linkElement as HTMLAnchorElement).getAttribute('href') : null;

        return { title, company, location, jobUrl };
      }).filter(job => job.title && job.company); // Filter out empty results
    });

    console.log(`Found ${jobs.length} jobs.`);
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} at ${job.company} (${job.location})`);
    });

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
