/**
 * End-to-end tests for complete workflow
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

describe('End-to-End Workflow', () => {
  let scraper: ContentScraper;
  let urlMatcher: URLMatcher;
  let sensitiveFilter: SensitiveFilter;
  let scheduler: Scheduler;
  let memoryAdapter: any;

  beforeEach(() => {
    // Initialize components
    scraper = new ContentScraper(10000, 1000);
    urlMatcher = new URLMatcher();
    sensitiveFilter = new SensitiveFilter();
    scheduler = new Scheduler({
      startTime: '09:00',
      endTime: '18:00',
      days: [1, 2, 3, 4, 5]
    });

    // Mock memory adapter
    memoryAdapter = {
      connect: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue({ total: 0, lastUpdated: 0 }),
      isConnectedToStorage: jest.fn().mockReturnValue(true)
    };

    // Mock DOM for content scraping
    document.body.innerHTML = `
      <div class="content">
        <h1>Test Article</h1>
        <p>This is a test article with some content.</p>
        <p>Contact us at test@example.com for more information.</p>
        <p>Phone: 13812345678</p>
      </div>
    `;

    document.head.innerHTML = `
      <meta name="description" content="Test article description">
      <meta name="keywords" content="test, article, content">
      <meta name="author" content="Test Author">
    `;

    document.title = 'Test Article';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/test-article', hostname: 'example.com' },
      writable: true
    });
  });

  afterEach(() => {
    scheduler.stop();
    jest.clearAllMocks();
  });

  test('should complete full scraping workflow', async () => {
    // Step 1: Configure components
    const config: ScrapingConfig = {
      enabled: true,
      schedule: {
        startTime: '09:00',
        endTime: '18:00',
        days: [1, 2, 3, 4, 5]
      },
      blacklist: ['*.admin.*', '/api/*'],
      sensitiveFilters: {
        enabled: true,
        patterns: ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b', '\\b1[3-9]\\d{9}\\b'],
        replacement: '[FILTERED]'
      },
      maxContentLength: 10000,
      delayBetweenPages: 1000
    };

    // Step 2: Update configurations
    urlMatcher.updatePatterns(config.blacklist);
    sensitiveFilter.updatePatterns(config.sensitiveFilters.patterns);
    sensitiveFilter.setReplacement(config.sensitiveFilters.replacement);
    scraper.setMaxContentLength(config.maxContentLength);
    scraper.setDelayBetweenPages(config.delayBetweenPages);

    // Step 3: Check if URL is blacklisted
    const testUrl = 'https://example.com/test-article';
    const isBlacklisted = urlMatcher.isBlacklisted(testUrl);
    expect(isBlacklisted).toBe(false);

    // Step 4: Check if in schedule
    const isInSchedule = scheduler.isInSchedule();
    expect(typeof isInSchedule).toBe('boolean');

    // Step 5: Scrape content
    const scrapedContent = await scraper.scrapeCurrentPage();
    expect(scrapedContent).toBeDefined();
    expect(scrapedContent?.url).toBe(testUrl);
    expect(scrapedContent?.title).toBe('Test Article');
    expect(scrapedContent?.content).toContain('This is a test article');

    // Step 6: Filter sensitive information
    if (scrapedContent && config.sensitiveFilters.enabled) {
      const originalContent = scrapedContent.content;
      scrapedContent.content = sensitiveFilter.filter(scrapedContent.content);
      
      // Verify sensitive information was filtered
      expect(scrapedContent.content).not.toContain('test@example.com');
      expect(scrapedContent.content).not.toContain('13812345678');
      expect(scrapedContent.content).toContain('[FILTERED]');
    }

    // Step 7: Save to memory storage
    if (scrapedContent) {
      await memoryAdapter.connect();
      await memoryAdapter.save(scrapedContent);
      
      expect(memoryAdapter.connect).toHaveBeenCalled();
      expect(memoryAdapter.save).toHaveBeenCalledWith(scrapedContent);
    }
  });

  test('should handle blacklisted URLs', async () => {
    // Configure blacklist
    urlMatcher.updatePatterns(['*.admin.*', '/api/*', '*.login']);

    // Test various URLs
    const testUrls = [
      'https://example.com/test-article', // Should not be blacklisted
      'https://admin.example.com/dashboard', // Should be blacklisted
      'https://example.com/api/users', // Should be blacklisted
      'https://example.com/login', // Should be blacklisted
    ];

    const expectedResults = [false, true, true, true];

    testUrls.forEach((url, index) => {
      const isBlacklisted = urlMatcher.isBlacklisted(url);
      expect(isBlacklisted).toBe(expectedResults[index]);
    });
  });

  test('should handle sensitive information filtering', () => {
    const testContent = `
      Contact us at john.doe@example.com for support.
      Call us at 13812345678 or 13987654321.
      Our office is at 123 Main Street.
      API Key: sk-1234567890abcdef
      Password: secret123
    `;

    const patterns = [
      '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b', // Email
      '\\b1[3-9]\\d{9}\\b', // Phone
      'sk-[a-zA-Z0-9]+', // API Key
      'Password:\\s*\\w+', // Password
    ];

    sensitiveFilter.updatePatterns(patterns);
    sensitiveFilter.setReplacement('[REDACTED]');

    const filteredContent = sensitiveFilter.filter(testContent);

    expect(filteredContent).not.toContain('john.doe@example.com');
    expect(filteredContent).not.toContain('13812345678');
    expect(filteredContent).not.toContain('13987654321');
    expect(filteredContent).not.toContain('sk-1234567890abcdef');
    expect(filteredContent).not.toContain('Password: secret123');
    expect(filteredContent).toContain('[REDACTED]');
  });

  test('should handle scheduling scenarios', () => {
    const testConfigs = [
      {
        startTime: '09:00',
        endTime: '18:00',
        days: [1, 2, 3, 4, 5],
        description: 'Weekday business hours'
      },
      {
        startTime: '00:00',
        endTime: '23:59',
        days: [0, 1, 2, 3, 4, 5, 6],
        description: '24/7 schedule'
      },
      {
        startTime: '22:00',
        endTime: '06:00',
        days: [1, 2, 3, 4, 5],
        description: 'Cross-day schedule'
      }
    ];

    testConfigs.forEach(config => {
      const testScheduler = new Scheduler(config);
      expect(testScheduler).toBeDefined();
      
      const status = testScheduler.getStatus();
      expect(status).toHaveProperty('isActive');
      expect(status).toHaveProperty('isInSchedule');
      expect(status).toHaveProperty('nextSchedule');
    });
  });

  test('should handle memory storage operations', async () => {
    const testContent: WebPageContent = {
      url: 'https://example.com/test',
      title: 'Test Page',
      content: 'Test content',
      timestamp: Date.now(),
      domain: 'example.com',
      metadata: {
        description: 'Test description',
        author: 'Test Author'
      }
    };

    // Test connection
    await memoryAdapter.connect();
    expect(memoryAdapter.isConnectedToStorage()).toBe(true);

    // Test save
    await memoryAdapter.save(testContent);
    expect(memoryAdapter.save).toHaveBeenCalledWith(testContent);

    // Test search
    const searchResults = await memoryAdapter.search('test query', 10);
    expect(Array.isArray(searchResults)).toBe(true);

    // Test delete
    await memoryAdapter.delete(testContent.url);
    expect(memoryAdapter.delete).toHaveBeenCalledWith(testContent.url);

    // Test clear
    await memoryAdapter.clear();
    expect(memoryAdapter.clear).toHaveBeenCalled();

    // Test stats
    const stats = await memoryAdapter.getStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('lastUpdated');
  });

  test('should handle error scenarios gracefully', async () => {
    // Test scraper with invalid DOM
    document.body.innerHTML = '';
    const emptyContent = await scraper.scrapeCurrentPage();
    expect(emptyContent).toBeNull();

    // Test URL matcher with invalid URL
    const invalidUrl = 'not-a-valid-url';
    const isBlacklisted = urlMatcher.isBlacklisted(invalidUrl);
    expect(isBlacklisted).toBe(false);

    // Test sensitive filter with invalid regex
    sensitiveFilter.updatePatterns(['[invalid[regex']);
    const testContent = 'This is test content';
    const filteredContent = sensitiveFilter.filter(testContent);
    expect(filteredContent).toBe(testContent); // Should return original content

    // Test memory adapter with connection failure
    memoryAdapter.connect.mockRejectedValue(new Error('Connection failed'));
    await expect(memoryAdapter.connect()).rejects.toThrow('Connection failed');
  });

  test('should handle configuration updates', () => {
    const initialConfig: ScrapingConfig = {
      enabled: false,
      schedule: { startTime: '09:00', endTime: '18:00', days: [1, 2, 3, 4, 5] },
      blacklist: [],
      sensitiveFilters: { enabled: false, patterns: [], replacement: '[FILTERED]' },
      maxContentLength: 5000,
      delayBetweenPages: 500
    };

    // Update configurations
    urlMatcher.updatePatterns(initialConfig.blacklist);
    sensitiveFilter.updatePatterns(initialConfig.sensitiveFilters.patterns);
    scraper.setMaxContentLength(initialConfig.maxContentLength);
    scraper.setDelayBetweenPages(initialConfig.delayBetweenPages);

    // Verify initial state
    expect(scraper.getConfig().maxContentLength).toBe(5000);
    expect(scraper.getConfig().delayBetweenPages).toBe(500);

    // Update configurations
    const updatedConfig: ScrapingConfig = {
      ...initialConfig,
      enabled: true,
      blacklist: ['*.example.com'],
      sensitiveFilters: { enabled: true, patterns: ['\\b\\d{11}\\b'], replacement: '[REDACTED]' },
      maxContentLength: 15000,
      delayBetweenPages: 2000
    };

    urlMatcher.updatePatterns(updatedConfig.blacklist);
    sensitiveFilter.updatePatterns(updatedConfig.sensitiveFilters.patterns);
    scraper.setMaxContentLength(updatedConfig.maxContentLength);
    scraper.setDelayBetweenPages(updatedConfig.delayBetweenPages);

    // Verify updated state
    expect(scraper.getConfig().maxContentLength).toBe(15000);
    expect(scraper.getConfig().delayBetweenPages).toBe(2000);
    expect(urlMatcher.isBlacklisted('https://test.example.com')).toBe(true);
  });

  test('should handle concurrent operations', async () => {
    const testContents = [
      {
        url: 'https://example.com/page1',
        title: 'Page 1',
        content: 'Content 1',
        timestamp: Date.now(),
        domain: 'example.com',
        metadata: {}
      },
      {
        url: 'https://example.com/page2',
        title: 'Page 2',
        content: 'Content 2',
        timestamp: Date.now(),
        domain: 'example.com',
        metadata: {}
      }
    ];

    // Simulate concurrent saves
    const savePromises = testContents.map(content => memoryAdapter.save(content));
    await Promise.all(savePromises);

    expect(memoryAdapter.save).toHaveBeenCalledTimes(2);
  });

  test('should validate complete workflow with real-world scenario', async () => {
    // Simulate a real-world scraping scenario
    const realWorldConfig: ScrapingConfig = {
      enabled: true,
      schedule: {
        startTime: '09:00',
        endTime: '17:00',
        days: [1, 2, 3, 4, 5] // Weekdays only
      },
      blacklist: [
        '*.admin.*',
        '*.login',
        '*.api.*',
        '/private/*'
      ],
      sensitiveFilters: {
        enabled: true,
        patterns: [
          '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b', // Email
          '\\b1[3-9]\\d{9}\\b', // Chinese phone
          '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b', // Credit card
          'sk-[a-zA-Z0-9]+', // API key
        ],
        replacement: '[REDACTED]'
      },
      maxContentLength: 20000,
      delayBetweenPages: 2000
    };

    // Initialize all components
    urlMatcher.updatePatterns(realWorldConfig.blacklist);
    sensitiveFilter.updatePatterns(realWorldConfig.sensitiveFilters.patterns);
    sensitiveFilter.setReplacement(realWorldConfig.sensitiveFilters.replacement);
    scraper.setMaxContentLength(realWorldConfig.maxContentLength);
    scraper.setDelayBetweenPages(realWorldConfig.delayBetweenPages);

    // Test URL filtering
    const testUrls = [
      'https://example.com/article', // Should pass
      'https://admin.example.com/dashboard', // Should be blocked
      'https://example.com/api/users', // Should be blocked
      'https://example.com/login', // Should be blocked
    ];

    const urlResults = testUrls.map(url => ({
      url,
      isBlacklisted: urlMatcher.isBlacklisted(url)
    }));

    expect(urlResults[0].isBlacklisted).toBe(false);
    expect(urlResults[1].isBlacklisted).toBe(true);
    expect(urlResults[2].isBlacklisted).toBe(true);
    expect(urlResults[3].isBlacklisted).toBe(true);

    // Test content scraping and filtering
    const testContent = `
      Welcome to our website!
      Contact us at support@example.com for assistance.
      Call us at 13812345678 for urgent matters.
      Our API key is sk-1234567890abcdef.
      Credit card: 1234-5678-9012-3456
    `;

    const filteredContent = sensitiveFilter.filter(testContent);
    
    expect(filteredContent).not.toContain('support@example.com');
    expect(filteredContent).not.toContain('13812345678');
    expect(filteredContent).not.toContain('sk-1234567890abcdef');
    expect(filteredContent).not.toContain('1234-5678-9012-3456');
    expect(filteredContent).toContain('[REDACTED]');

    // Test memory storage
    await memoryAdapter.connect();
    expect(memoryAdapter.isConnectedToStorage()).toBe(true);

    const stats = await memoryAdapter.getStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('lastUpdated');
  });
});
