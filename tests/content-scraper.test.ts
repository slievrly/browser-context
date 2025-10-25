/**
 * Content scraper tests
 */

import { ContentScraper } from '../shared/utils/content-scraper';

describe('ContentScraper', () => {
  let scraper: ContentScraper;

  beforeEach(() => {
    scraper = new ContentScraper();
  });

  test('should extract main content from page', () => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div class="content">
        <h1>Test Title</h1>
        <p>This is test content for scraping.</p>
      </div>
    `;

    const content = scraper.extractMainContent();
    expect(content).toContain('Test Title');
    expect(content).toContain('This is test content for scraping.');
  });

  test('should extract metadata from page', () => {
    // Mock meta tags
    document.head.innerHTML = `
      <meta name="description" content="Test description">
      <meta name="keywords" content="test, scraping, content">
      <meta name="author" content="Test Author">
      <meta property="article:published_time" content="2023-01-01T00:00:00Z">
    `;
    document.documentElement.lang = 'en';

    const metadata = scraper.extractMetadata();
    expect(metadata.description).toBe('Test description');
    expect(metadata.keywords).toEqual(['test', 'scraping', 'content']);
    expect(metadata.author).toBe('Test Author');
    expect(metadata.publishedDate).toBe('2023-01-01T00:00:00Z');
    expect(metadata.language).toBe('en');
  });

  test('should clean text content', () => {
    const dirtyText = '  This   is   a   test\n\n\n  with   multiple   spaces  ';
    const cleanedText = scraper.cleanText(dirtyText);
    expect(cleanedText).toBe('This is a test with multiple spaces');
  });

  test('should extract domain from URL', () => {
    const url = 'https://example.com/path/to/page';
    const domain = scraper.extractDomain(url);
    expect(domain).toBe('example.com');
  });

  test('should set max content length', () => {
    scraper.setMaxContentLength(5000);
    const config = scraper.getConfig();
    expect(config.maxContentLength).toBe(5000);
  });

  test('should set delay between pages', () => {
    scraper.setDelayBetweenPages(2000);
    const config = scraper.getConfig();
    expect(config.delayBetweenPages).toBe(2000);
  });
});
