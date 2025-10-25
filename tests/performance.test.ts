/**
 * Performance tests and benchmarks
 */

import { ContentScraper } from '../shared/utils/content-scraper';
import { URLMatcher } from '../shared/utils/url-matcher';
import { SensitiveFilter } from '../shared/utils/sensitive-filter';
import { Scheduler } from '../shared/utils/scheduler';
import { MemoryAdapterFactory } from '../shared/memory-adapters/adapter-factory';
import { WebPageContent, ScrapingConfig, MemoryConfig } from '../shared/types';

// Mock axios for testing
jest.mock('axios');
const mockedAxios = require('axios');

describe('Performance Tests', () => {
  let scraper: ContentScraper;
  let urlMatcher: URLMatcher;
  let sensitiveFilter: SensitiveFilter;
  let scheduler: Scheduler;

  beforeEach(() => {
    scraper = new ContentScraper();
    urlMatcher = new URLMatcher();
    sensitiveFilter = new SensitiveFilter();
    scheduler = new Scheduler({
      startTime: '09:00',
      endTime: '18:00',
      days: [1, 2, 3, 4, 5]
    });
  });

  afterEach(() => {
    scheduler.stop();
  });

  describe('Content Scraper Performance', () => {
    test('should scrape large content efficiently', async () => {
      // Create large content
      const largeContent = 'Lorem ipsum '.repeat(10000); // ~110KB
      document.body.innerHTML = `<div class="content">${largeContent}</div>`;

      const startTime = performance.now();
      const content = await scraper.scrapeCurrentPage();
      const endTime = performance.now();

      expect(content).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    test('should handle multiple content selectors efficiently', () => {
      // Create complex DOM structure
      document.body.innerHTML = `
        <div class="container">
          <header>Header content</header>
          <main>
            <article>
              <h1>Article Title</h1>
              <p>Article content</p>
            </article>
          </main>
          <aside>Sidebar content</aside>
          <footer>Footer content</footer>
        </div>
      `;

      const startTime = performance.now();
      const content = scraper.extractMainContent();
      const endTime = performance.now();

      expect(content).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should handle empty or minimal content', () => {
      document.body.innerHTML = '';

      const startTime = performance.now();
      const content = scraper.extractMainContent();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should handle empty content quickly
    });

    test('should extract metadata efficiently', () => {
      document.head.innerHTML = `
        <meta name="description" content="Test description">
        <meta name="keywords" content="test, performance, content">
        <meta name="author" content="Test Author">
        <meta property="article:published_time" content="2023-01-01T00:00:00Z">
      `;
      document.documentElement.lang = 'en';

      const startTime = performance.now();
      const metadata = scraper.extractMetadata();
      const endTime = performance.now();

      expect(metadata).toBeDefined();
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('URL Matcher Performance', () => {
    test('should handle large blacklist efficiently', () => {
      const largeBlacklist = Array.from({ length: 1000 }, (_, i) => `*.example${i}.com`);
      urlMatcher.updatePatterns(largeBlacklist);

      const testUrls = Array.from({ length: 100 }, (_, i) => `https://example${i}.com/page`);

      const startTime = performance.now();
      testUrls.forEach(url => urlMatcher.isBlacklisted(url));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should handle 100 URLs in under 1 second
    });

    test('should handle complex regex patterns efficiently', () => {
      const complexPatterns = [
        'https://(www\\.)?example\\.com/.*',
        '.*\\.admin\\..*',
        '.*/api/v\\d+/.*',
        '.*\\.(jpg|png|gif|css|js)$',
        '.*\\?.*utm_.*'
      ];
      urlMatcher.updatePatterns(complexPatterns);

      const testUrls = Array.from({ length: 50 }, (_, i) => 
        `https://example${i}.com/page${i}?utm_source=test`
      );

      const startTime = performance.now();
      testUrls.forEach(url => urlMatcher.isBlacklisted(url));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    test('should handle invalid URLs gracefully', () => {
      const patterns = ['*.example.com'];
      urlMatcher.updatePatterns(patterns);

      const invalidUrls = [
        'not-a-url',
        '',
        'http://',
        'https://',
        'ftp://invalid'
      ];

      const startTime = performance.now();
      invalidUrls.forEach(url => {
        expect(() => urlMatcher.isBlacklisted(url)).not.toThrow();
      });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Sensitive Filter Performance', () => {
    test('should filter large content efficiently', () => {
      const largeContent = `
        Contact us at john.doe@example.com for support.
        Call us at 13812345678 for urgent matters.
        Our API key is sk-1234567890abcdef.
        Credit card: 1234-5678-9012-3456
        Password: secret123
      `.repeat(1000); // Large content with sensitive info

      const patterns = [
        '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
        '\\b1[3-9]\\d{9}\\b',
        'sk-[a-zA-Z0-9]+',
        '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
        'Password:\\s*\\w+'
      ];

      sensitiveFilter.updatePatterns(patterns);

      const startTime = performance.now();
      const filtered = sensitiveFilter.filter(largeContent);
      const endTime = performance.now();

      expect(filtered).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000);
      expect(filtered).not.toContain('john.doe@example.com');
    });

    test('should handle many patterns efficiently', () => {
      const manyPatterns = Array.from({ length: 100 }, (_, i) => `\\bpattern${i}\\b`);
      sensitiveFilter.updatePatterns(manyPatterns);

      const testContent = 'This is test content with pattern50 in it.';

      const startTime = performance.now();
      const filtered = sensitiveFilter.filter(testContent);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle invalid regex patterns gracefully', () => {
      const invalidPatterns = [
        'valid@email.com',
        '[invalid[regex',
        '(unclosed(group',
        '\\invalid\\escape'
      ];

      const startTime = performance.now();
      sensitiveFilter.updatePatterns(invalidPatterns);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Scheduler Performance', () => {
    test('should check schedule efficiently', () => {
      const startTime = performance.now();
      
      // Check schedule multiple times
      for (let i = 0; i < 1000; i++) {
        scheduler.isInSchedule();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle multiple scheduler instances', () => {
      const schedulers = Array.from({ length: 100 }, () => 
        new Scheduler({
          startTime: '09:00',
          endTime: '18:00',
          days: [1, 2, 3, 4, 5]
        })
      );

      const startTime = performance.now();
      schedulers.forEach(s => s.isInSchedule());
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);

      // Clean up
      schedulers.forEach(s => s.stop());
    });
  });

  describe('Memory Adapter Performance', () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn()
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance);
    });

    test('should handle batch operations efficiently', async () => {
      const adapter = MemoryAdapterFactory.createAdapter({
        provider: 'mem0',
        endpoint: 'https://api.mem0.ai',
        apiKey: 'test-key',
        options: { collection: 'test' }
      });

      const contents = Array.from({ length: 100 }, (_, i) => ({
        url: `https://example.com/page${i}`,
        title: `Page ${i}`,
        content: `Content for page ${i}`,
        timestamp: Date.now(),
        domain: 'example.com',
        metadata: {}
      }));

      mockAxiosInstance.post.mockResolvedValue({ status: 200 });

      const startTime = performance.now();
      await Promise.all(contents.map(content => adapter.save(content)));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should handle 100 saves in under 2 seconds
    });

    test('should handle search operations efficiently', async () => {
      const adapter = MemoryAdapterFactory.createAdapter({
        provider: 'mem0',
        endpoint: 'https://api.mem0.ai',
        apiKey: 'test-key',
        options: { collection: 'test' }
      });

      const mockResponse = {
        data: {
          memories: Array.from({ length: 50 }, (_, i) => ({
            content: `Search result ${i}`,
            metadata: { url: `https://example.com/page${i}` }
          }))
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const startTime = performance.now();
      const results = await adapter.search('test query', 50);
      const endTime = performance.now();

      expect(results).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory with repeated operations', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const scraper = new ContentScraper();
        const urlMatcher = new URLMatcher(['*.example.com']);
        const sensitiveFilter = new SensitiveFilter(['\\b\\d{11}\\b']);
        
        // Simulate operations
        urlMatcher.isBlacklisted('https://test.example.com');
        sensitiveFilter.filter('Call us at 13812345678');
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent scraping operations', async () => {
      const scrapers = Array.from({ length: 10 }, () => new ContentScraper());
      
      // Mock different DOM content for each scraper
      scrapers.forEach((scraper, index) => {
        document.body.innerHTML = `<div class="content">Content ${index}</div>`;
      });

      const startTime = performance.now();
      const results = await Promise.all(
        scrapers.map(scraper => scraper.scrapeCurrentPage())
      );
      const endTime = performance.now();

      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('should handle concurrent URL matching', () => {
      const urlMatchers = Array.from({ length: 10 }, () => 
        new URLMatcher(['*.example.com', '*.test.com'])
      );

      const testUrls = Array.from({ length: 100 }, (_, i) => 
        `https://example${i % 2 === 0 ? '' : 'test'}.com/page${i}`
      );

      const startTime = performance.now();
      const results = urlMatchers.map(matcher => 
        testUrls.map(url => matcher.isBlacklisted(url))
      );
      const endTime = performance.now();

      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Edge Cases', () => {
    test('should handle extremely large content', async () => {
      const hugeContent = 'A'.repeat(1000000); // 1MB content
      document.body.innerHTML = `<div class="content">${hugeContent}</div>`;

      const startTime = performance.now();
      const content = await scraper.scrapeCurrentPage();
      const endTime = performance.now();

      expect(content).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should handle 1MB in under 5 seconds
    });

    test('should handle malformed HTML gracefully', () => {
      document.body.innerHTML = `
        <div class="content">
          <p>Valid content</p>
          <div>Unclosed div
          <p>More content</p>
          <script>alert('test')</script>
          <style>body { color: red; }</style>
        </div>
      `;

      const startTime = performance.now();
      const content = scraper.extractMainContent();
      const endTime = performance.now();

      expect(content).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle special characters in content', () => {
      const specialContent = `
        Content with special chars: àáâãäåæçèéêë
        Emojis: 🚀🎉💡🔥
        Unicode: 中文日本語한국어
        Symbols: !@#$%^&*()_+-=[]{}|;':",./<>?
      `;

      document.body.innerHTML = `<div class="content">${specialContent}</div>`;

      const startTime = performance.now();
      const content = scraper.extractMainContent();
      const endTime = performance.now();

      expect(content).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
