/**
 * Safari extension content script
 * Injects and executes content scraping functionality in web pages
 */

// Safari extension API wrapper
const safari = window.safari;

class SafariContentScript {
  constructor() {
    this.scraper = new ContentScraper();
    this.urlMatcher = new URLMatcher();
    this.sensitiveFilter = new SensitiveFilter();
    this.config = null;
    this.isInitialized = false;
    
    this.init();
  }

  /**
   * Initialize content script
   */
  async init() {
    try {
      // Load configuration
      await this.loadConfig();
      
      // Setup global API
      this.setupGlobalAPI();
      
      // Setup message listener
      this.setupMessageListener();
      
      // Setup page change listener
      this.setupPageChangeListener();
      
      this.isInitialized = true;
      console.log('Browser Context Plugin content script initialized');
    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }

  /**
   * Load configuration
   */
  async loadConfig() {
    return new Promise((resolve) => {
      safari.extension.settings.getItem('scrapingConfig', (result) => {
        if (result) {
          this.config = result;
          this.updateFilters();
        }
        resolve();
      });
    });
  }

  /**
   * Update filter configurations
   */
  updateFilters() {
    if (!this.config) return;

    // Update URL matcher
    this.urlMatcher.updatePatterns(this.config.blacklist);
    
    // Update sensitive info filter
    this.sensitiveFilter.updatePatterns(this.config.sensitiveFilters.patterns);
    this.sensitiveFilter.setReplacement(this.config.sensitiveFilters.replacement);
    
    // Update scraper configuration
    this.scraper.setMaxContentLength(this.config.maxContentLength);
    this.scraper.setDelayBetweenPages(this.config.delayBetweenPages);
  }

  /**
   * Setup global API
   */
  setupGlobalAPI() {
    window.browserContextPlugin = {
      scrapePage: () => this.scrapePage(),
      isBlacklisted: (url) => this.urlMatcher.isBlacklisted(url),
      filterSensitiveInfo: (content) => this.sensitiveFilter.filter(content)
    };
  }

  /**
   * Setup message listener
   */
  setupMessageListener() {
    safari.self.addEventListener('message', (event) => {
      const message = event.message;
      
      switch (message.type) {
        case 'SCRAPE_PAGE':
          this.handleScrapePage().then((result) => {
            safari.self.tab.dispatchMessage('SCRAPE_RESULT', result);
          });
          break;
          
        case 'UPDATE_CONFIG':
          this.handleUpdateConfig(message.config).then(() => {
            safari.self.tab.dispatchMessage('CONFIG_UPDATED', { success: true });
          });
          break;
          
        case 'CHECK_BLACKLIST':
          const isBlacklisted = this.urlMatcher.isBlacklisted(message.url);
          safari.self.tab.dispatchMessage('BLACKLIST_CHECK', { isBlacklisted });
          break;
          
        case 'FILTER_SENSITIVE':
          const filtered = this.sensitiveFilter.filter(message.content);
          safari.self.tab.dispatchMessage('SENSITIVE_FILTERED', { filtered });
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
      }
    });
  }

  /**
   * Setup page change listener
   */
  setupPageChangeListener() {
    // Listen for URL changes (SPA applications)
    let currentUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.onPageChange();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Handle page change
   */
  onPageChange() {
    if (!this.config?.enabled) return;
    
    // Check if blacklisted
    if (this.urlMatcher.isBlacklisted(window.location.href)) {
      console.log('Page is blacklisted, skipping scraping');
      return;
    }

    // Delay scraping to wait for page load
    setTimeout(() => {
      this.autoScrape();
    }, 2000);
  }

  /**
   * Auto scrape page
   */
  async autoScrape() {
    if (!this.config?.enabled) return;

    try {
      const content = await this.scrapePage();
      if (content) {
        // Send to background script
        safari.self.tab.dispatchMessage('PAGE_SCRAPED', content);
      }
    } catch (error) {
      console.error('Auto scraping failed:', error);
    }
  }

  /**
   * Handle scrape page request
   */
  async handleScrapePage() {
    return await this.scrapePage();
  }

  /**
   * Handle configuration update
   */
  async handleUpdateConfig(config) {
    this.config = config;
    this.updateFilters();
  }

  /**
   * Scrape page content
   */
  async scrapePage() {
    try {
      if (!this.isInitialized) {
        console.warn('Content script not initialized');
        return null;
      }

      // Check if blacklisted
      if (this.urlMatcher.isBlacklisted(window.location.href)) {
        console.log('Page is blacklisted');
        return null;
      }

      // Scrape content
      const content = await this.scraper.scrapeCurrentPage();
      if (!content) {
        return null;
      }

      // Filter sensitive information
      if (this.config?.sensitiveFilters.enabled) {
        content.content = this.sensitiveFilter.filter(content.content);
        content.title = this.sensitiveFilter.filter(content.title);
        
        // Filter metadata
        if (content.metadata.description) {
          content.metadata.description = this.sensitiveFilter.filter(content.metadata.description);
        }
        if (content.metadata.author) {
          content.metadata.author = this.sensitiveFilter.filter(content.metadata.author);
        }
      }

      return content;
    } catch (error) {
      console.error('Failed to scrape page:', error);
      return null;
    }
  }
}

// Content scraper class
class ContentScraper {
  constructor(maxContentLength = 10000, delayBetweenPages = 1000) {
    this.maxContentLength = maxContentLength;
    this.delayBetweenPages = delayBetweenPages;
  }

  async scrapeCurrentPage() {
    try {
      const url = window.location.href;
      const title = document.title;
      
      // Wait for page to load completely
      await this.waitForPageLoad();
      
      // Scrape main content
      const content = this.extractMainContent();
      
      // Extract metadata
      const metadata = this.extractMetadata();
      
      // Get domain
      const domain = this.extractDomain(url);

      const pageContent = {
        url,
        title,
        content: content.substring(0, this.maxContentLength),
        timestamp: Date.now(),
        domain,
        metadata
      };

      return pageContent;
    } catch (error) {
      console.error('Failed to scrape page content:', error);
      return null;
    }
  }

  async waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
        return;
      }

      const checkReady = () => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };

      checkReady();
    });
  }

  extractMainContent() {
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content',
      '#content',
      '.container'
    ];

    let content = '';
    
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = this.cleanText(element.textContent || '');
        if (content.length > 100) {
          break;
        }
      }
    }

    if (!content || content.length < 100) {
      const body = document.body;
      if (body) {
        const clone = body.cloneNode(true);
        const scripts = clone.querySelectorAll('script, style, noscript');
        scripts.forEach(el => el.remove());
        
        content = this.cleanText(clone.textContent || '');
      }
    }

    return content;
  }

  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  extractMetadata() {
    const metadata = {};

    const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
    if (description) {
      metadata.description = description;
    }

    const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
    if (keywords) {
      metadata.keywords = keywords.split(',').map(k => k.trim());
    }

    const author = document.querySelector('meta[name="author"]')?.getAttribute('content') ||
                  document.querySelector('[rel="author"]')?.textContent;
    if (author) {
      metadata.author = author;
    }

    const publishedDate = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                         document.querySelector('time[datetime]')?.getAttribute('datetime');
    if (publishedDate) {
      metadata.publishedDate = publishedDate;
    }

    const language = document.documentElement.lang || 
                    document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content');
    if (language) {
      metadata.language = language;
    }

    return metadata;
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  setMaxContentLength(length) {
    this.maxContentLength = length;
  }

  setDelayBetweenPages(delay) {
    this.delayBetweenPages = delay;
  }
}

// URL matcher class
class URLMatcher {
  constructor(patterns = []) {
    this.patterns = patterns;
  }

  updatePatterns(patterns) {
    this.patterns = patterns;
  }

  isBlacklisted(url) {
    if (this.patterns.length === 0) {
      return false;
    }

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const pathname = urlObj.pathname;

      return this.patterns.some(pattern => {
        if (pattern.includes('*')) {
          const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*');
          const regex = new RegExp(`^${regexPattern}$`, 'i');
          return regex.test(domain) || regex.test(url);
        }

        if (pattern.startsWith('http')) {
          return url.includes(pattern);
        }

        if (pattern.startsWith('.')) {
          return domain.endsWith(pattern);
        }

        if (pattern.startsWith('/')) {
          return pathname.startsWith(pattern);
        }

        return url.includes(pattern);
      });
    } catch (error) {
      console.error('URL matching error:', error);
      return false;
    }
  }
}

// Sensitive filter class
class SensitiveFilter {
  constructor(patterns = [], replacement = '[FILTERED]') {
    this.patterns = patterns.map(pattern => {
      try {
        return new RegExp(pattern, 'gi');
      } catch (error) {
        console.warn(`Invalid regex pattern: ${pattern}`, error);
        return null;
      }
    }).filter(Boolean);
    this.replacement = replacement;
  }

  updatePatterns(patterns) {
    this.patterns = patterns.map(pattern => {
      try {
        return new RegExp(pattern, 'gi');
      } catch (error) {
        console.warn(`Invalid regex pattern: ${pattern}`, error);
        return null;
      }
    }).filter(Boolean);
  }

  setReplacement(replacement) {
    this.replacement = replacement;
  }

  filter(content) {
    if (this.patterns.length === 0) {
      return content;
    }

    let filteredContent = content;

    this.patterns.forEach(pattern => {
      filteredContent = filteredContent.replace(pattern, this.replacement);
    });

    return filteredContent;
  }
}

// Initialize content script
new SafariContentScript();
