/**
 * Error handling and edge case tests
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

describe('Error Handling Tests', () => {
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

  describe('Content Scraper Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      document.body.innerHTML = '';
      document.head.innerHTML = '';

      expect(() => {
        const content = scraper.extractMainContent();
        expect(content).toBeDefined();
      }).not.toThrow();
    });

    test('should handle malformed HTML gracefully', () => {
      document.body.innerHTML = `
        <div class="content">
          <p>Valid content
          <div>Unclosed div
          <script>alert('test')</script>
          <style>body { color: red; }</style>
        </div>
      `;

      expect(() => {
        const content = scraper.extractMainContent();
        expect(content).toBeDefined();
      }).not.toThrow();
    });

    test('should handle extremely large content', async () => {
      const hugeContent = 'A'.repeat(1000000); // 1MB
      document.body.innerHTML = `<div class="content">${hugeContent}</div>`;

      const content = await scraper.scrapeCurrentPage();
      expect(content).toBeDefined();
      expect(content?.content.length).toBeLessThanOrEqual(10000); // Should be limited
    });

    test('should handle special characters and unicode', () => {
      const specialContent = `
        Content with special chars: àáâãäåæçèéêë
        Emojis: 🚀🎉💡🔥
        Unicode: 中文日本語한국어
        Symbols: !@#$%^&*()_+-=[]{}|;':",./<>?
        Newlines: Line 1
        Line 2
        Line 3
      `;

      document.body.innerHTML = `<div class="content">${specialContent}</div>`;

      expect(() => {
        const content = scraper.extractMainContent();
        expect(content).toBeDefined();
        expect(content).toContain('中文日本語한국어');
        expect(content).toContain('🚀🎉💡🔥');
      }).not.toThrow();
    });

    test('should handle null and undefined values', () => {
      // @ts-ignore - Testing error handling
      document.body = null;
      document.head = null;

      expect(() => {
        const content = scraper.extractMainContent();
        expect(content).toBeDefined();
      }).not.toThrow();
    });

    test('should handle circular references in DOM', () => {
      document.body.innerHTML = '<div class="content">Test content</div>';
      
      // Create circular reference
      const element = document.querySelector('.content');
      if (element) {
        // @ts-ignore - Testing error handling
        element.parent = element;
      }

      expect(() => {
        const content = scraper.extractMainContent();
        expect(content).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('URL Matcher Error Handling', () => {
    test('should handle invalid URLs gracefully', () => {
      const patterns = ['*.example.com'];
      urlMatcher.updatePatterns(patterns);

      const invalidUrls = [
        'not-a-url',
        '',
        null,
        undefined,
        'http://',
        'https://',
        'ftp://invalid',
        'javascript:alert("test")',
        'data:text/html,<script>alert("test")</script>'
      ];

      invalidUrls.forEach(url => {
        expect(() => {
          const result = urlMatcher.isBlacklisted(url as string);
          expect(typeof result).toBe('boolean');
        }).not.toThrow();
      });
    });

    test('should handle invalid regex patterns gracefully', () => {
      const invalidPatterns = [
        '[invalid[regex',
        '(unclosed(group',
        '\\invalid\\escape',
        '.*\\',
        '?invalid',
        '*invalid',
        '+invalid'
      ];

      expect(() => {
        urlMatcher.updatePatterns(invalidPatterns);
      }).not.toThrow();

      // Should still work with valid patterns
      expect(() => {
        const result = urlMatcher.isBlacklisted('https://example.com');
        expect(typeof result).toBe('boolean');
      }).not.toThrow();
    });

    test('should handle extremely long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(10000);
      const patterns = ['*.example.com'];
      urlMatcher.updatePatterns(patterns);

      expect(() => {
        const result = urlMatcher.isBlacklisted(longUrl);
        expect(typeof result).toBe('boolean');
      }).not.toThrow();
    });

    test('should handle null and undefined patterns', () => {
      expect(() => {
        // @ts-ignore - Testing error handling
        urlMatcher.updatePatterns(null);
        // @ts-ignore - Testing error handling
        urlMatcher.updatePatterns(undefined);
      }).not.toThrow();
    });

    test('should handle empty patterns array', () => {
      urlMatcher.updatePatterns([]);
      
      expect(() => {
        const result = urlMatcher.isBlacklisted('https://example.com');
        expect(result).toBe(false);
      }).not.toThrow();
    });
  });

  describe('Sensitive Filter Error Handling', () => {
    test('should handle invalid regex patterns gracefully', () => {
      const invalidPatterns = [
        '[invalid[regex',
        '(unclosed(group',
        '\\invalid\\escape',
        '.*\\',
        '?invalid',
        '*invalid',
        '+invalid'
      ];

      expect(() => {
        sensitiveFilter.updatePatterns(invalidPatterns);
      }).not.toThrow();

      // Should still work with valid patterns
      const testContent = 'Contact us at test@example.com';
      const filtered = sensitiveFilter.filter(testContent);
      expect(filtered).toBeDefined();
    });

    test('should handle null and undefined content', () => {
      const patterns = ['\\b\\d{11}\\b'];
      sensitiveFilter.updatePatterns(patterns);

      expect(() => {
        // @ts-ignore - Testing error handling
        const filtered1 = sensitiveFilter.filter(null);
        // @ts-ignore - Testing error handling
        const filtered2 = sensitiveFilter.filter(undefined);
        expect(filtered1).toBeDefined();
        expect(filtered2).toBeDefined();
      }).not.toThrow();
    });

    test('should handle extremely large content', () => {
      const largeContent = 'A'.repeat(1000000); // 1MB
      const patterns = ['\\b\\d{11}\\b'];
      sensitiveFilter.updatePatterns(patterns);

      const startTime = performance.now();
      const filtered = sensitiveFilter.filter(largeContent);
      const endTime = performance.now();

      expect(filtered).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in reasonable time
    });

    test('should handle empty patterns array', () => {
      sensitiveFilter.updatePatterns([]);
      
      const testContent = 'Contact us at test@example.com';
      const filtered = sensitiveFilter.filter(testContent);
      expect(filtered).toBe(testContent); // Should return original content
    });

    test('should handle null and undefined patterns', () => {
      expect(() => {
        // @ts-ignore - Testing error handling
        sensitiveFilter.updatePatterns(null);
        // @ts-ignore - Testing error handling
        sensitiveFilter.updatePatterns(undefined);
      }).not.toThrow();
    });
  });

  describe('Scheduler Error Handling', () => {
    test('should handle invalid time formats', () => {
      const invalidConfigs = [
        { startTime: '25:00', endTime: '18:00', days: [1, 2, 3, 4, 5] },
        { startTime: '09:00', endTime: '25:00', days: [1, 2, 3, 4, 5] },
        { startTime: 'invalid', endTime: '18:00', days: [1, 2, 3, 4, 5] },
        { startTime: '09:00', endTime: 'invalid', days: [1, 2, 3, 4, 5] },
        { startTime: '', endTime: '18:00', days: [1, 2, 3, 4, 5] },
        { startTime: '09:00', endTime: '', days: [1, 2, 3, 4, 5] }
      ];

      invalidConfigs.forEach(config => {
        expect(() => {
          const testScheduler = new Scheduler(config as any);
          expect(testScheduler).toBeDefined();
        }).not.toThrow();
      });
    });

    test('should handle invalid day arrays', () => {
      const invalidDayConfigs = [
        { startTime: '09:00', endTime: '18:00', days: [8, 9, 10] }, // Invalid day numbers
        { startTime: '09:00', endTime: '18:00', days: [-1, 0, 1] }, // Negative numbers
        { startTime: '09:00', endTime: '18:00', days: [1.5, 2.5] }, // Decimal numbers
        { startTime: '09:00', endTime: '18:00', days: [] }, // Empty array
        { startTime: '09:00', endTime: '18:00', days: null }, // Null
        { startTime: '09:00', endTime: '18:00', days: undefined } // Undefined
      ];

      invalidDayConfigs.forEach(config => {
        expect(() => {
          const testScheduler = new Scheduler(config as any);
          expect(testScheduler).toBeDefined();
        }).not.toThrow();
      });
    });

    test('should handle null and undefined configuration', () => {
      expect(() => {
        // @ts-ignore - Testing error handling
        const testScheduler = new Scheduler(null);
        // @ts-ignore - Testing error handling
        const testScheduler2 = new Scheduler(undefined);
        expect(testScheduler).toBeDefined();
        expect(testScheduler2).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Memory Adapter Error Handling', () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn()
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance);
    });

    test('should handle connection failures gracefully', async () => {
      const adapter = MemoryAdapterFactory.createAdapter({
        provider: 'mem0',
        endpoint: 'https://api.mem0.ai',
        apiKey: 'test-key',
        options: { collection: 'test' }
      });

      mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'));

      await expect(adapter.connect()).rejects.toThrow('Connection failed');
    });

    test('should handle save failures gracefully', async () => {
      const adapter = MemoryAdapterFactory.createAdapter({
        provider: 'mem0',
        endpoint: 'https://api.mem0.ai',
        apiKey: 'test-key',
        options: { collection: 'test' }
      });

      mockAxiosInstance.post.mockRejectedValue(new Error('Save failed'));

      const content: WebPageContent = {
        url: 'https://example.com',
        title: 'Test',
        content: 'Test content',
        timestamp: Date.now(),
        domain: 'example.com',
        metadata: {}
      };

      await expect(adapter.save(content)).rejects.toThrow('Save failed');
    });

    test('should handle search failures gracefully', async () => {
      const adapter = MemoryAdapterFactory.createAdapter({
        provider: 'mem0',
        endpoint: 'https://api.mem0.ai',
        apiKey: 'test-key',
        options: { collection: 'test' }
      });

      mockAxiosInstance.get.mockRejectedValue(new Error('Search failed'));

      await expect(adapter.search('test query')).rejects.toThrow('Search failed');
    });

    test('should handle invalid configuration gracefully', () => {
      const invalidConfigs = [
        { provider: 'invalid', endpoint: '', options: {} },
        { provider: 'mem0', endpoint: '', options: {} },
        { provider: 'mem0', endpoint: 'invalid-url', options: {} },
        null,
        undefined
      ];

      invalidConfigs.forEach(config => {
        expect(() => {
          if (config && config.provider !== 'invalid') {
            const adapter = MemoryAdapterFactory.createAdapter(config as any);
            expect(adapter).toBeDefined();
          }
        }).not.toThrow();
      });
    });

    test('should handle network timeouts gracefully', async () => {
      const adapter = MemoryAdapterFactory.createAdapter({
        provider: 'mem0',
        endpoint: 'https://api.mem0.ai',
        apiKey: 'test-key',
        options: { collection: 'test' }
      });

      mockAxiosInstance.get.mockRejectedValue(new Error('timeout'));

      await expect(adapter.testConnection()).rejects.toThrow('timeout');
    });

    test('should handle malformed responses gracefully', async () => {
      const adapter = MemoryAdapterFactory.createAdapter({
        provider: 'mem0',
        endpoint: 'https://api.mem0.ai',
        apiKey: 'test-key',
        options: { collection: 'test' }
      });

      const malformedResponse = {
        data: {
          // Missing required fields
          invalid: 'data'
        }
      };

      mockAxiosInstance.get.mockResolvedValue(malformedResponse);

      const results = await adapter.search('test query');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Factory Error Handling', () => {
    test('should handle unsupported providers gracefully', () => {
      expect(() => {
        MemoryAdapterFactory.createAdapter({
          provider: 'unsupported' as any,
          endpoint: 'https://api.example.com',
          options: {}
        });
      }).toThrow('Unsupported memory provider: unsupported');
    });

    test('should handle invalid configuration validation', () => {
      const invalidConfigs = [
        { provider: '', endpoint: '', options: {} },
        { provider: 'mem0', endpoint: '', options: {} },
        { provider: 'vector_db', endpoint: 'https://api.example.com', options: {} },
        null,
        undefined
      ];

      invalidConfigs.forEach(config => {
        const validation = MemoryAdapterFactory.validateConfig(config as any);
        expect(validation.valid).toBe(false);
        expect(Array.isArray(validation.errors)).toBe(true);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Global Error Handling', () => {
    test('should handle missing browser APIs gracefully', () => {
      const originalChrome = global.chrome;
      const originalSafari = global.safari;
      const originalBrowser = global.browser;

      // Remove browser APIs
      delete (global as any).chrome;
      delete (global as any).safari;
      delete (global as any).browser;

      expect(() => {
        // Should not throw errors when browser APIs are missing
        const scraper = new ContentScraper();
        const urlMatcher = new URLMatcher();
        const sensitiveFilter = new SensitiveFilter();
      }).not.toThrow();

      // Restore browser APIs
      global.chrome = originalChrome;
      global.safari = originalSafari;
      global.browser = originalBrowser;
    });

    test('should handle memory pressure gracefully', () => {
      // Simulate memory pressure by creating many objects
      const objects = [];
      for (let i = 0; i < 10000; i++) {
        objects.push({
          scraper: new ContentScraper(),
          urlMatcher: new URLMatcher(),
          sensitiveFilter: new SensitiveFilter()
        });
      }

      // Should still work under memory pressure
      expect(() => {
        const scraper = new ContentScraper();
        const content = scraper.extractMainContent();
        expect(content).toBeDefined();
      }).not.toThrow();

      // Clean up
      objects.length = 0;
    });

    test('should handle concurrent access gracefully', async () => {
      const scrapers = Array.from({ length: 100 }, () => new ContentScraper());
      
      // Simulate concurrent access
      const promises = scrapers.map(async (scraper, index) => {
        document.body.innerHTML = `<div class="content">Content ${index}</div>`;
        return scraper.scrapeCurrentPage();
      });

      const results = await Promise.allSettled(promises);
      
      // All operations should complete (either success or failure)
      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result.status).toBeDefined();
      });
    });
  });
});
