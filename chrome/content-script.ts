/**
 * Chrome扩展内容脚本
 * 在网页中注入并执行内容抓取功能
 */

import { ContentScraper } from '../shared/utils/content-scraper';
import { URLMatcher } from '../shared/utils/url-matcher';
import { SensitiveFilter } from '../shared/utils/sensitive-filter';
import { WebPageContent, ScrapingConfig } from '../shared/types';

class ChromeContentScript {
  private scraper: ContentScraper;
  private urlMatcher: URLMatcher;
  private sensitiveFilter: SensitiveFilter;
  private config: ScrapingConfig | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.scraper = new ContentScraper();
    this.urlMatcher = new URLMatcher();
    this.sensitiveFilter = new SensitiveFilter();
    
    this.init();
  }

  /**
   * 初始化内容脚本
   */
  private async init(): Promise<void> {
    try {
      // 加载配置
      await this.loadConfig();
      
      // 设置全局API
      this.setupGlobalAPI();
      
      // 监听来自background script的消息
      this.setupMessageListener();
      
      // 监听页面变化
      this.setupPageChangeListener();
      
      this.isInitialized = true;
      console.log('Browser Context Plugin content script initialized');
    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }

  /**
   * 加载配置
   */
  private async loadConfig(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['scrapingConfig'], (result) => {
        if (result.scrapingConfig) {
          this.config = result.scrapingConfig;
          this.updateFilters();
        }
        resolve();
      });
    });
  }

  /**
   * 更新过滤器配置
   */
  private updateFilters(): void {
    if (!this.config) return;

    // 更新URL匹配器
    this.urlMatcher.updatePatterns(this.config.blacklist);
    
    // 更新敏感信息过滤器
    this.sensitiveFilter.updatePatterns(this.config.sensitiveFilters.patterns);
    this.sensitiveFilter.setReplacement(this.config.sensitiveFilters.replacement);
    
    // 更新抓取器配置
    this.scraper.setMaxContentLength(this.config.maxContentLength);
    this.scraper.setDelayBetweenPages(this.config.delayBetweenPages);
  }

  /**
   * 设置全局API
   */
  private setupGlobalAPI(): void {
    window.browserContextPlugin = {
      scrapePage: () => this.scrapePage(),
      isBlacklisted: (url: string) => this.urlMatcher.isBlacklisted(url),
      filterSensitiveInfo: (content: string) => this.sensitiveFilter.filter(content)
    };
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'SCRAPE_PAGE':
          this.handleScrapePage().then(sendResponse);
          return true; // 保持消息通道开放
          
        case 'UPDATE_CONFIG':
          this.handleUpdateConfig(message.config).then(sendResponse);
          return true;
          
        case 'CHECK_BLACKLIST':
          sendResponse({ isBlacklisted: this.urlMatcher.isBlacklisted(message.url) });
          break;
          
        case 'FILTER_SENSITIVE':
          sendResponse({ filtered: this.sensitiveFilter.filter(message.content) });
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
      }
    });
  }

  /**
   * 设置页面变化监听器
   */
  private setupPageChangeListener(): void {
    // 监听URL变化 (SPA应用)
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
   * 页面变化处理
   */
  private onPageChange(): void {
    if (!this.config?.enabled) return;
    
    // 检查是否在黑名单中
    if (this.urlMatcher.isBlacklisted(window.location.href)) {
      console.log('Page is blacklisted, skipping scraping');
      return;
    }

    // 延迟抓取，等待页面加载完成
    setTimeout(() => {
      this.autoScrape();
    }, 2000);
  }

  /**
   * 自动抓取页面
   */
  private async autoScrape(): Promise<void> {
    if (!this.config?.enabled) return;

    try {
      const content = await this.scrapePage();
      if (content) {
        // 发送到background script
        chrome.runtime.sendMessage({
          type: 'PAGE_SCRAPED',
          content
        });
      }
    } catch (error) {
      console.error('Auto scraping failed:', error);
    }
  }

  /**
   * 处理抓取页面请求
   */
  private async handleScrapePage(): Promise<WebPageContent | null> {
    return await this.scrapePage();
  }

  /**
   * 处理配置更新
   */
  private async handleUpdateConfig(config: ScrapingConfig): Promise<void> {
    this.config = config;
    this.updateFilters();
  }

  /**
   * 抓取页面内容
   */
  private async scrapePage(): Promise<WebPageContent | null> {
    try {
      if (!this.isInitialized) {
        console.warn('Content script not initialized');
        return null;
      }

      // 检查是否在黑名单中
      if (this.urlMatcher.isBlacklisted(window.location.href)) {
        console.log('Page is blacklisted');
        return null;
      }

      // 抓取内容
      const content = await this.scraper.scrapeCurrentPage();
      if (!content) {
        return null;
      }

      // 过滤敏感信息
      if (this.config?.sensitiveFilters.enabled) {
        content.content = this.sensitiveFilter.filter(content.content);
        content.title = this.sensitiveFilter.filter(content.title);
        
        // 过滤元数据
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

// 启动内容脚本
new ChromeContentScript();
